import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getAssignments, getReviewers, getSubmissions, listReviews, type Assignment, type Review, type Reviewer, type Submission } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Row = Assignment & { reviewer?: Reviewer; review?: Review };
const key = (rid: string, code: string) => `${rid}/${code}`;
const TRACKS = [
  { role: 'RS', title: 'Research Scientist' },
  { role: 'RE', title: 'Research Engineer' },
] as const;

export default async function Admin() {
  if (!(await isAdmin())) redirect('/?error=signin');
  const [reviewers, submissions, assignments, reviews] = await Promise.all([
    getReviewers(),
    getSubmissions(),
    getAssignments(),
    listReviews(),
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
}: {
  title: string;
  rows: Row[];
  submissions: Submission[];
  reviewers: Reviewer[];
  assignments: Assignment[];
}) {
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
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Reviewer</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Overall</th>
              <th className="px-3 py-2">Quality</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={key(r.reviewerId, r.code)}>
                <td className="px-3 py-2 font-medium">
                  <a className="text-blue-700 hover:underline" href={`/api/pdf/${r.code}`} target="_blank" rel="noreferrer">{r.code}</a>
                </td>
                <td className="px-3 py-2">{r.reviewer?.name ?? r.reviewerId}</td>
                <td className="px-3 py-2">{r.review?.status ?? 'not started'}</td>
                <td className="px-3 py-2">{r.review?.answers.overall_score ?? ''}</td>
                <td className="px-3 py-2">{r.review?.answers.quality ?? ''}</td>
                <td className="px-3 py-2 text-zinc-500">{r.review?.updatedAt ? new Date(r.review.updatedAt).toLocaleString('en-GB') : ''}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-zinc-500" colSpan={6}>No assignments yet.</td>
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
