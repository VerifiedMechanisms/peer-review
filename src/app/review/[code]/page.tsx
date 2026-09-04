import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ReviewForm from '@/components/ReviewForm';
import { currentReviewer } from '@/lib/auth';
import { DEADLINE } from '@/lib/config';
import { getCodeManifest, getReview, getSubmissions, isAssigned } from '@/lib/store';

export default async function ReviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const reviewer = await currentReviewer();
  if (!reviewer) redirect('/?error=signin');
  if (!(await isAssigned(reviewer.id, code))) notFound();
  const submission = (await getSubmissions()).find((s) => s.code === code);
  if (!submission) notFound();
  const review = await getReview(reviewer.id, code);
  const codeZip = (await getCodeManifest())[code];
  const track = submission.role === 'RS' ? 'Research Scientist' : 'Research Engineer';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4 text-sm">
        <Link href="/review" className="text-blue-700 hover:underline">
          &larr; Back to my reviews
        </Link>
        <div id="save-status" className="text-xs text-zinc-500" />
      </div>

      {/* OpenReview-style submission header */}
      <header className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Submission {code}</h1>
            <p className="mt-1 text-sm text-zinc-600">Reviews due {DEADLINE}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/pdf/${code}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              PDF
            </a>
            {codeZip && (
              <a
                href={`/api/code/${code}`}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                title="Anonymized snapshot of the submitted repository, as a zip"
              >
                Code ({codeZip >= 1024 * 1024 ? `${(codeZip / 1024 / 1024).toFixed(0)} MB` : `${Math.ceil(codeZip / 1024)} KB`})
              </a>
            )}
          </div>
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-zinc-500">Track</dt>
          <dd>{track}</dd>
        </dl>
        {submission.role === 'RE' && (
          <ul className="mt-4 list-disc space-y-1 border-t border-zinc-200 pl-5 pt-3 text-sm text-zinc-700">
            <li>
              The submission materials are available in two places: the PDF tab contains the write-up, while the Code
              tab contains the submitted repository.
            </li>
            <li>
              For the review, the primary expectation is to assess the submission based on the write-up and an
              inspection of the code.
            </li>
            <li>
              You are not required to rerun the experiments. However, if you would find it useful to do so, you may use
              the API key from your own take-home submission. Unfortunately, we are not able to provide access to the
              holdout set since it is under construction.
            </li>
          </ul>
        )}
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Your review</h2>
        <ReviewForm track={submission.role} code={code} initial={review} />
      </section>
    </div>
  );
}
