import { NextResponse, type NextRequest } from 'next/server';
import { REVIEWER_COOKIE, cookieOptions, findReviewerByToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reviewer = await findReviewerByToken(token);
  if (!reviewer) return NextResponse.redirect(new URL('/?error=link', req.url));
  const res = NextResponse.redirect(new URL('/review', req.url));
  res.cookies.set(REVIEWER_COOKIE, token, cookieOptions());
  return res;
}
