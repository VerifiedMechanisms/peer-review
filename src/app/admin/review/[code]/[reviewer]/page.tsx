import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Markdown from '@/components/Markdown';
import { isAdmin } from '@/lib/auth';
import { allQuestions } from '@/lib/questionnaire';
import { getAuthors, getReview, getReviewers, getSubmissions } from '@/lib/store';

export const dynamic = 'force-dynamic';

// Read-only view of one review for the admin: the questionnaire in order, text answers
// rendered as the reviewer saw them in the preview (Markdown, tables, LaTeX). Reviewers
// never reach this page; it needs the admin cookie.
export default async function AdminReview({ params }: { params: Promise<{ code: string; reviewer: string }> }) {
  if (!(await isAdmin())) redirect('/?error=signin');
  const { code, reviewer: reviewerId } = await params;
  const [submission, reviewers, review, authors] = await Promise.all([
    getSubmissions().then((all) => all.find((s) => s.code === code)),
    getReviewers(),
    getReview(reviewerId, code),
    getAuthors(),
  ]);
  if (!submission) notFound();
  const reviewer = reviewers.find((r) => r.id === reviewerId);
  const track = submission.role === 'RS' ? 'Research Scientist' : 'Research Engineer';
  const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-GB') : '');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-sm">
        <Link href="/admin" className="text-blue-700 hover:underline">
          &larr; Back to progress
        </Link>
      </div>

      <header className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Review of {code}
              {authors[code] && <span className="font-normal text-zinc-500"> ({authors[code]})</span>}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              by {reviewer?.name ?? reviewerId} &middot; {track}
            </p>
          </div>
          <a
            href={`/api/pdf/${code}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            PDF
          </a>
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-zinc-500">Status</dt>
          <dd>{review ? review.status : 'not started'}</dd>
          {review?.submittedAt && (
            <>
              <dt className="text-zinc-500">Submitted</dt>
              <dd>{when(review.submittedAt)}</dd>
            </>
          )}
          {review && (
            <>
              <dt className="text-zinc-500">Last saved</dt>
              <dd>{when(review.updatedAt)}</dd>
            </>
          )}
        </dl>
      </header>

      {!review ? (
        <p className="text-sm text-zinc-600">This reviewer has not saved anything for {code} yet.</p>
      ) : (
        <section className="space-y-5">
          {allQuestions(submission.role).map((q) => {
            const v = review.answers[q.id];
            const empty = v === undefined || v === null || String(v).trim() === '';
            return (
              <div key={q.id} className="rounded-lg border border-zinc-200 bg-white p-5">
                <h2 className="font-semibold">{q.label}</h2>
                {q.help && <p className="mt-1 text-xs text-zinc-500">{q.help}</p>}
                <div className="mt-3">
                  {empty ? (
                    <p className="text-sm italic text-zinc-400">Not answered.</p>
                  ) : q.kind === 'text' ? (
                    <Markdown source={String(v)} />
                  ) : (
                    <p className="text-sm">{String(v)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
