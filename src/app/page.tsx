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
      {error === 'signin' && (
        <p className="rounded-md border border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-800">
          Please sign in with your token first.
        </p>
      )}
      {error === 'token' && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          That token is not recognised. Check for missing characters, or write to
          hiring@verifiedmechanisms.ai.
        </p>
      )}
      <p className="text-zinc-700">
        Reviewers receive a personal token by email. Paste it here to sign in. The token is your
        login, so please do not share it.
      </p>
      <form method="post" action="/r" className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          name="token"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="Paste your token"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
