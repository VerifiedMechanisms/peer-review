import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getAssignments, getAuthors, getReviewers, getSubmissions, listReviews, type Assignment, type Review, type Reviewer, type Submission } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Row = Assignment & { reviewer?: Reviewer; review?: Review };
// Answers are stored as the option text ("Good: Answers the task, ..." and "3: good");
// the table shows the word for the overall verdict and the number for the scales.
const verdict = (v: unknown) => (v === undefined || v === null ? '' : String(v).split(':')[0].trim());
const score = (v: unknown) => (v === undefined || v === null ? '' : String(v).split(':')[0].trim());

// Sorting: ?sort=<column>&dir=asc|desc. Score columns default to highest first, the
// text columns to A-Z; rows without a value sort last either way.
const SORT_KEYS = ['code', 'name', 'reviewer', 'status', 'overall', 'quality', 'clarity', 'originality'] as const;
type SortKey = (typeof SORT_KEYS)[number];
const SCORE_KEYS: SortKey[] = ['overall', 'quality', 'clarity', 'originality'];
const VERDICT_RANK: Record<string, number> = { Excellent: 3, Good: 2, Satisfactory: 1 };
const STATUS_RANK: Record<string, number> = { submitted: 2, draft: 1 };

function sortRows(rows: Row[], key: SortKey, dir: 'asc' | 'desc', authors: Record<string, string>): Row[] {
  const num = (r: Row): number | null => {
    const a = r.review?.answers ?? {};
    if (key === 'overall') return VERDICT_RANK[verdict(a.overall_score)] ?? null;
    if (key === 'status') return STATUS_RANK[r.review?.status ?? ''] ?? 0;
    const v = score(a[key]);
    return v === '' ? null : Number(v);
  };
  const text = (r: Row): string =>
    key === 'code' ? r.code : key === 'name' ? (authors[r.code] ?? '') : (r.reviewer?.name ?? r.reviewerId);
  const sign = dir === 'asc' ? 1 : -1;
  return rows.slice().sort((x, y) => {
    if (SCORE_KEYS.includes(key) || key === 'status') {
      const a = num(x), b = num(y);
      if (a === null && b === null) return x.code.localeCompare(y.code);
      if (a === null) return 1;
      if (b === null) return -1;
      return sign * (a - b) || x.code.localeCompare(y.code);
    }
    return sign * text(x).localeCompare(text(y)) || x.code.localeCompare(y.code);
  });
}
const key = (rid: string, code: string) => `${rid}/${code}`;
const TRACKS = [
  { role: 'RS', title: 'Research Scientist' },
  { role: 'RE', title: 'Research Engineer' },
] as const;

export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await isAdmin())) redirect('/?error=signin');
  const sp = await searchParams;
  const sortParam = typeof sp.sort === 'string' ? sp.sort : '';
  const sortKey: SortKey = (SORT_KEYS as readonly string[]).includes(sortParam) ? (sortParam as SortKey) : 'code';
  const defaultDir: 'asc' | 'desc' = SCORE_KEYS.includes(sortKey) || sortKey === 'status' ? 'desc' : 'asc';
  const dir: 'asc' | 'desc' = sp.dir === 'asc' || sp.dir === 'desc' ? sp.dir : defaultDir;
  const [reviewers, submissions, assignments, reviews, authors] = await Promise.all([
    getReviewers(),
    getSubmissions(),
    getAssignments(),
    listReviews(),
    getAuthors(),
  ]);
  const byReviewer = new Map(reviewers.map((r) => [r.id, r]));
  const byKey = new Map(reviews.map((r) => [key(r.reviewerId, r.code), r]));
  const roleOf = new Map(submissions.map((s) => [s.code, s.role]));
  const rows: Row[] = assignments
    .map((a) => ({ ...a, reviewer: byReviewer.get(a.reviewerId), review: byKey.get(key(a.reviewerId, a.code)) }))
    .sort((x, y) => x.code.localeCompare(y.code));
  const submitted = rows.filter((r) => r.review?.status === 'submitted').length;
  const drafts = rows.filter((r) => r.review?.status === 'draft').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">Progress</h1>
        <div className="flex gap-4 text-sm">
          <a className="text-blue-700 hover:underline" href="/admin/export?format=csv">Export CSV</a>
          <a className="text-blue-700 hover:underline" href="/admin/export?format=json">Export JSON</a>
        </div>
      </div>
      <p className="text-zinc-700">
        {submitted} of {rows.length} reviews submitted, {drafts} in draft, {rows.length - submitted - drafts} not started.
      </p>
      {TRACKS.map((t) => (
        <TrackSection
          key={t.role}
          title={t.title}
          rows={rows.filter((r) => roleOf.get(r.code) === t.role)}
          submissions={submissions.filter((s) => s.role === t.role)}
          reviewers={reviewers.filter((r) => r.role === t.role)}
          assignments={assignments}
          authors={authors}
          sortKey={sortKey}
          dir={dir}
        />
      ))}
    </div>
  );
}

function TrackSection({
  title,
  rows,
  submissions,
  reviewers,
  assignments,
  authors,
  sortKey,
  dir,
}: {
  title: string;
  rows: Row[];
  submissions: Submission[];
  reviewers: Reviewer[];
  assignments: Assignment[];
  authors: Record<string, string>;
  sortKey: SortKey;
  dir: 'asc' | 'desc';
}) {
  const sorted = sortRows(rows, sortKey, dir, authors);
  // Clicking the active column flips the direction; any other column starts from its default.
  const Head = ({ k, label }: { k: SortKey; label: string }) => {
    const active = k === sortKey;
    const nextDir = active ? (dir === 'asc' ? 'desc' : 'asc') : SCORE_KEYS.includes(k) || k === 'status' ? 'desc' : 'asc';
    return (
      <th className="px-3 py-2">
        <a className={active ? 'text-zinc-900 hover:underline' : 'hover:underline'} href={`/admin?sort=${k}&dir=${nextDir}`}>
          {label}
          {active && <span aria-hidden="true">{dir === 'asc' ? ' \u25B4' : ' \u25BE'}</span>}
        </a>
      </th>
    );
  };
  const submitted = rows.filter((r) => r.review?.status === 'submitted').length;
  const drafts = rows.filter((r) => r.review?.status === 'draft').length;
  const unassigned = submissions.filter((s) => !assignments.some((a) => a.code === s.code));
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-sm text-zinc-600">
          {submissions.length} submissions, {submitted} of {rows.length} reviews submitted, {drafts} in draft
          {unassigned.length > 0 && <>, no reviewer yet: {unassigned.map((s) => s.code).join(', ')}</>}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <Head k="code" label="Code" />
              <Head k="name" label="Name" />
              <Head k="reviewer" label="Reviewer" />
              <Head k="status" label="Status" />
              <Head k="overall" label="Overall" />
              <Head k="quality" label="Quality" />
              <Head k="clarity" label="Clarity" />
              <Head k="originality" label="Originality" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted.map((r) => (
              <tr key={key(r.reviewerId, r.code)}>
                <td className="px-3 py-2 font-medium">
                  <a className="text-blue-700 hover:underline" href={`/api/pdf/${r.code}`}>{r.code}</a>
                </td>
                <td className="px-3 py-2">{authors[r.code] ?? ''}</td>
                <td className="px-3 py-2">{r.reviewer?.name ?? r.reviewerId}</td>
                <td className="px-3 py-2">
                  {r.review ? (
                    <a className="text-blue-700 hover:underline" href={`/admin/review/${r.code}/${r.reviewerId}`}>
                      {r.review.status}
                    </a>
                  ) : (
                    'not started'
                  )}
                </td>
                <td className="px-3 py-2">{verdict(r.review?.answers.overall_score)}</td>
                <td className="px-3 py-2">{score(r.review?.answers.quality)}</td>
                <td className="px-3 py-2">{score(r.review?.answers.clarity)}</td>
                <td className="px-3 py-2">{score(r.review?.answers.originality)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-zinc-500" colSpan={8}>No assignments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <h3 className="text-sm font-semibold text-zinc-700">Reviewers</h3>
      <ul className="grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {reviewers.map((r) => {
          const n = assignments.filter((a) => a.reviewerId === r.id).length;
          if (n === 0) return null; // reviewers in the roster with nothing assigned would show as 0/0
          const done = rows.filter((x) => x.reviewerId === r.id && x.review?.status === 'submitted').length;
          return (
            <li key={r.id} className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              <span className="font-medium">{r.name}</span>
              <span className="float-right text-zinc-600">{done}/{n}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
