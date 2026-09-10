import { redirect } from 'next/navigation';
import ProgressTable from '@/components/ProgressTable';
import Tabs from '@/components/Tabs';
import { isAdmin } from '@/lib/auth';
import { SORT_KEYS, defaultDir, type ProgressRow, type SortDir, type SortKey } from '@/lib/progress';
import { getAssignments, getAuthors, getRanks, getReviewers, getSubmissions, listReviews, type Review } from '@/lib/store';

export const dynamic = 'force-dynamic';

// Answers are stored as the option text ("Good: Answers the task, ..." and "3: good");
// the table shows the word for the overall verdict and the number for the scales.
const head = (v: unknown) => (v === undefined || v === null ? '' : String(v).split(':')[0].trim());

const TRACKS = [
  { role: 'RS', title: 'Research Scientist' },
  { role: 'RE', title: 'Research Engineer' },
] as const;
type TrackRole = (typeof TRACKS)[number]['role'];

export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await isAdmin())) redirect('/?error=signin');
  // ?track=RS|RE, ?sort=<column>&dir=asc|desc: the page opens in that state, and the tabs
  // and table keep the URL updated as the admin clicks, without reloading.
  const sp = await searchParams;
  const sortParam = typeof sp.sort === 'string' ? sp.sort : '';
  const sortKey: SortKey = (SORT_KEYS as readonly string[]).includes(sortParam) ? (sortParam as SortKey) : 'code';
  const dir: SortDir = sp.dir === 'asc' || sp.dir === 'desc' ? sp.dir : defaultDir(sortKey);
  const trackParam = typeof sp.track === 'string' ? sp.track.toUpperCase() : '';
  const track: TrackRole = TRACKS.some((t) => t.role === trackParam) ? (trackParam as TrackRole) : 'RS';

  const [reviewers, submissions, assignments, reviews, authors, ranking] = await Promise.all([
    getReviewers(),
    getSubmissions(),
    getAssignments(),
    listReviews(),
    getAuthors(),
    getRanks(),
  ]);
  const byReviewer = new Map(reviewers.map((r) => [r.id, r]));
  const byKey = new Map<string, Review>(reviews.map((r) => [`${r.reviewerId}/${r.code}`, r]));
  const roleOf = new Map(submissions.map((s) => [s.code, s.role]));
  const rows: ProgressRow[] = assignments.map((a) => {
    const review = byKey.get(`${a.reviewerId}/${a.code}`);
    const answers = review?.answers ?? {};
    return {
      code: a.code,
      name: authors[a.code] ?? '',
      reviewerId: a.reviewerId,
      reviewer: byReviewer.get(a.reviewerId)?.name ?? a.reviewerId,
      status: review?.status ?? null,
      overall: head(answers.overall_score),
      quality: head(answers.quality),
      clarity: head(answers.clarity),
      originality: head(answers.originality),
      rank: ranking?.ranks[a.code] ?? null,
    };
  });
  const submitted = rows.filter((r) => r.status === 'submitted').length;
  const drafts = rows.filter((r) => r.status === 'draft').length;

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
      <Tabs
        label="Tracks"
        initial={track}
        tabs={TRACKS.map((t) => {
          const trackRows = rows.filter((r) => roleOf.get(r.code) === t.role);
          const trackSubmissions = submissions.filter((s) => s.role === t.role);
          const done = trackRows.filter((r) => r.status === 'submitted').length;
          const inDraft = trackRows.filter((r) => r.status === 'draft').length;
          const unassigned = trackSubmissions.filter((s) => !assignments.some((a) => a.code === s.code));
          return {
            id: t.role,
            label: t.title,
            count: trackSubmissions.length,
            content: (
              <section className="space-y-3">
                <p className="text-sm text-zinc-600">
                  {trackSubmissions.length} submissions, {done} of {trackRows.length} reviews submitted, {inDraft} in draft
                  {unassigned.length > 0 && <>, no reviewer yet: {unassigned.map((s) => s.code).join(', ')}</>}
                </p>
                <ProgressTable rows={trackRows} initialSort={sortKey} initialDir={dir} rankLabel={ranking?.label} />
              </section>
            ),
          };
        })}
      />
    </div>
  );
}
