import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentReviewer } from '@/lib/auth';
import { getAssignments, getReview } from '@/lib/store';

import { DEADLINE, MAX_REVIEWS, SOFT_DEADLINE } from '@/lib/config';

export default async function ReviewHome() {
  const reviewer = await currentReviewer();
  if (!reviewer) redirect('/?error=signin');
  const mine = (await getAssignments()).filter((a) => a.reviewerId === reviewer.id);
  const reviews = await Promise.all(mine.map((a) => getReview(reviewer.id, a.code)));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hi {reviewer.name.split(' ')[0]}</h1>
        <p className="mt-4 text-zinc-600">
          You have {mine.length} {mine.length === 1 ? 'submission' : 'submissions'} to review for the{' '}
          {reviewer.role === 'RS' ? 'Research Scientist' : 'Research Engineer'} track. Please keep an eye on this
          page, it is possible you may be assigned more submissions in the future, up to a maximum of {MAX_REVIEWS}.
        </p>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {mine.map((a, i) => {
          const r = reviews[i];
          const status = r?.status === 'submitted' ? 'Submitted' : r ? 'Draft saved' : 'Not started';
          const tone =
            r?.status === 'submitted' ? 'bg-emerald-100 text-emerald-800' : r ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-700';
          return (
            <li key={a.code} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link href={`/review/${a.code}`} className="font-medium text-blue-700 hover:underline">
                  Submission {a.code}
                </Link>
                {r?.updatedAt && (
                  <span className="ml-3 text-xs text-zinc-500">last saved {new Date(r.updatedAt).toLocaleString('en-GB')}</span>
                )}
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
            </li>
          );
        })}
        {mine.length === 0 && <li className="px-4 py-6 text-zinc-600">Nothing assigned to you yet.</li>}
      </ul>

      <section className="space-y-2 text-[14.5px] text-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900">Instructions</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Submissions are identified by a code such as RS-07 for the purpose of keeping submissions anonymous.</li>
          <li>
            <strong>Soft deadline:</strong> {SOFT_DEADLINE}. We would greatly appreciate receiving your reviews by this
            time.
          </li>
          <li>
            <strong>Hard deadline:</strong> {DEADLINE}. This deadline is strict, so please only confirm if you are
            confident you can complete the reviews by then.
          </li>
          <li>Drafts save automatically. You can edit a submitted review until the deadline.</li>
        </ul>
      </section>

      <section className="space-y-2 text-[14.5px] text-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900">Recommendations</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            We recommend keeping a local copy of your review in case you encounter any issues with autosaving on the
            website.
          </li>
          <li>
            We recommend completing the reviews serially, submitting each review as soon as you finish it rather than
            working on multiple reviews in parallel. This will help us process the reviews more efficiently.
          </li>
          <li>
            For each detailed-answer section, aim for approximately 150–200 words in total, covering 3–4 substantive
            points.
          </li>
        </ul>
      </section>
    </div>
  );
}
