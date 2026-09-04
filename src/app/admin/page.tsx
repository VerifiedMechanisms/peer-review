import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getAssignments, getReviewers, getSubmissions, listReviews } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  if (!(await isAdmin())) redirect('/?error=signin');
  const [reviewers, submissions, assignments, reviews] = await Promise.all([
    getReviewers(),
    getSubmissions(),
    getAssignments(),
    listReviews(),
  ]);
  const byReviewer = new Map(reviewers.map((r) => [r.id, r]));
  const key = (rid: string, code: string) => `${rid}/${code}`;
  const byKey = new Map(reviews.map((r) => [key(r.reviewerId, r.code), r]));
  const rows = assignments
    .map((a) => ({ ...a, reviewer: byReviewer.get(a.reviewerId), review: byKey.get(key(a.reviewerId, a.code)) }))
    .sort((x, y) => x.code.localeCompare(y.code));
  const submitted = rows.filter((r) => r.review?.status === 'submitted').length;
  const drafts = rows.filter((r) => r.review?.status === 'draft').length;
  const unassigned = submissions.filter((s) => !assignments.some((a) => a.code === s.code));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">Progress</h1>
        <div className="flex gap-4 text-sm">
          <a className="text-blue-700 hover:underline" href="/admin/export?format=csv">Export CSV</a>
          <a className="text-blue-700 hover:underline" href="/admin/export?format=json">Export JSON</a>
        </div>
      </div>
      <p className="text-zinc-700">
        {submitted} of {rows.length} reviews submitted, {drafts} in draft, {rows.length - submitted - drafts} not started.
        {unassigned.length > 0 && <> {unassigned.length} submissions have no reviewer yet: {unassigned.map((s) => s.code).join(', ')}.</>}
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Reviewer</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Overall</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Minutes</th>
              <th className="px-3 py-2">Recognized</th>
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
                <td className="px-3 py-2">{r.review?.answers.overall_rec ?? ''}</td>
                <td className="px-3 py-2">{r.review?.answers.confidence ?? ''}</td>
                <td className="px-3 py-2">{r.review?.answers.minutes ?? ''}</td>
                <td className="px-3 py-2">{r.review?.answers.recognized ?? ''}</td>
                <td className="px-3 py-2 text-zinc-500">{r.review?.updatedAt ? new Date(r.review.updatedAt).toLocaleString('en-GB') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="text-lg font-semibold">Reviewers</h2>
      <ul className="grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {reviewers.map((r) => {
          const n = assignments.filter((a) => a.reviewerId === r.id).length;
          const done = rows.filter((x) => x.reviewerId === r.id && x.review?.status === 'submitted').length;
          return (
            <li key={r.id} className="rounded-md border border-zinc-200 bg-white px-3 py-2">
              <span className="font-medium">{r.name}</span> <span className="text-zinc-500">{r.role}</span>
              <span className="float-right text-zinc-600">{done}/{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
