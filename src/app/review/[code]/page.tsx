import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ReviewForm from '@/components/ReviewForm';
import { currentReviewer } from '@/lib/auth';
import { DEADLINE } from '@/lib/config';
import { getReview, getSubmissions, isAssigned } from '@/lib/store';

export default async function ReviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const reviewer = await currentReviewer();
  if (!reviewer) redirect('/?error=signin');
  if (!(await isAssigned(reviewer.id, code))) notFound();
  const submission = (await getSubmissions()).find((s) => s.code === code);
  if (!submission) notFound();
  const review = await getReview(reviewer.id, code);
  const track = submission.role === 'RS' ? 'Research Scientist' : 'Research Engineer';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav className="text-sm text-zinc-500">
        <Link href="/review" className="hover:underline">My reviews</Link> <span className="mx-1">/</span> {code}
      </nav>

      {/* OpenReview-style submission header */}
      <header className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Submission {code}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Anonymous author <span className="mx-1 text-zinc-300">|</span> {track} take-home
              <span className="mx-1 text-zinc-300">|</span> Reviews due {DEADLINE}
            </p>
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
            <a href={`/api/pdf/${code}?download=1`} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50">
              Download
            </a>
          </div>
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-zinc-500">Track</dt>
          <dd>{track}</dd>
          <dt className="text-zinc-500">What was asked</dt>
          <dd className="text-zinc-700">
            {submission.role === 'RS'
              ? 'Part one: read an autoresearch run of about 200 theorems on head complexity and pick out what matters. Part two: results of their own, with bonus credit for building on Part one or verifying in Lean.'
              : 'Part one: make Qwen and GPT-OSS collaborate to solve and prove competition problems in Lean 4. Part two: show whether the pair beats either model alone, and where one fills the other’s gaps.'}
          </dd>
          <dt className="text-zinc-500">Anonymization</dt>
          <dd className="text-zinc-700">Names, emails, repository links and metadata were removed. Do not try to identify the author.</dd>
        </dl>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Your review</h2>
        <ReviewForm track={submission.role} code={code} initial={review} />
      </section>
    </div>
  );
}
