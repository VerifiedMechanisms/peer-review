import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentReviewer } from '@/lib/auth';
import { getAssignments, getReview } from '@/lib/store';

import { DEADLINE } from '@/lib/config';

export default async function ReviewHome() {
  const reviewer = await currentReviewer();
  if (!reviewer) redirect('/?error=link');
  const mine = (await getAssignments()).filter((a) => a.reviewerId === reviewer.id);
  const reviews = await Promise.all(mine.map((a) => getReview(reviewer.id, a.code)));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hi {reviewer.name.split(' ')[0]}</h1>
        <p className="mt-1 text-zinc-600">
          You have {mine.length} {mine.length === 1 ? 'submission' : 'submissions'} to review for the{' '}
          {reviewer.role === 'RS' ? 'Research Scientist' : 'Research Engineer'} track. Reviews are due by {DEADLINE}.
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

      <section className="space-y-2 text-sm text-zinc-700">
        <h2 className="font-semibold text-zinc-900">How to review</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Read the whole writeup first. The questionnaire takes about fifteen minutes once you have.</li>
          <li>Where a question asks you to check a claim, say what you checked and how far you got. Honest uncertainty is more useful than a confident guess.</li>
          <li>Judge the writeup on what it shows, not on what you would have done. Different approaches are welcome.</li>
          <li>Do not try to identify the author, and do not discuss submissions with anyone. If you recognize one anyway, say so in the last question and carry on.</li>
        </ul>
      </section>
    </div>
  );
}
