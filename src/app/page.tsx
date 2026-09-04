import { redirect } from 'next/navigation';
import { currentReviewer, isAdmin } from '@/lib/auth';

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) {
    if (await isAdmin()) redirect('/admin');
    if (await currentReviewer()) redirect('/review');
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <h1 className="text-2xl font-semibold">Peer review of the take-home submissions</h1>
      {error === 'link' && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          That link is not valid. Use the personal link from your invitation email, or write to
          hiring@verifiedmechanisms.ai if it does not work.
        </p>
      )}
      <p className="text-zinc-700">
        Reviewers reach their assigned submissions through a personal link sent by email. There is no
        password: the link is the login, so please do not forward it.
      </p>
      <ul className="list-disc space-y-1 pl-6 text-zinc-700">
        <li>Submissions are identified by a code such as RS-07. Names, emails and repository links have been removed.</li>
        <li>Your review is seen only by the hiring team. Authors never learn who reviewed them.</li>
        <li>Drafts save automatically. You can edit a submitted review until the deadline.</li>
      </ul>
    </div>
  );
}
