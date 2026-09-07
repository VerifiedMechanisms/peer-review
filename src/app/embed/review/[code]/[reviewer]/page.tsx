import ReviewView from '@/components/ReviewView';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// The same review without the site header and footer (the root layout hides them under
// /embed/), loaded inside the overlay on the admin progress table. Admin only: without
// the cookie there is nothing to show, and no redirect, since this sits in an iframe.
export default async function EmbeddedReview({ params }: { params: Promise<{ code: string; reviewer: string }> }) {
  if (!(await isAdmin())) return <p className="p-6 text-sm text-zinc-600">Sign in as admin on the front page first.</p>;
  const { code, reviewer } = await params;
  return <ReviewView code={code} reviewerId={reviewer} embed />;
}
