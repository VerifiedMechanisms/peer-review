import { redirect } from 'next/navigation';
import ReviewView from '@/components/ReviewView';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Full-page view of one review for the admin. Reviewers never reach it.
export default async function AdminReview({ params }: { params: Promise<{ code: string; reviewer: string }> }) {
  if (!(await isAdmin())) redirect('/?error=signin');
  const { code, reviewer } = await params;
  return <ReviewView code={code} reviewerId={reviewer} />;
}
