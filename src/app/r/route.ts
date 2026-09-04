import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_COOKIE,
  REVIEWER_COOKIE,
  cookieOptions,
  findReviewerByToken,
  isAdminToken,
} from '@/lib/auth';

// The landing page form posts a pasted token here. This is the only login:
// there is no link that signs people in, so a token never sits in a URL.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get('token') ?? '').trim();
  if (token && isAdminToken(token)) {
    const res = NextResponse.redirect(new URL('/admin', req.url), 303);
    res.cookies.set(ADMIN_COOKIE, token, cookieOptions());
    return res;
  }
  const reviewer = token ? await findReviewerByToken(token) : null;
  if (!reviewer) return NextResponse.redirect(new URL('/?error=token', req.url), 303);
  const res = NextResponse.redirect(new URL('/review', req.url), 303);
  res.cookies.set(REVIEWER_COOKIE, token, cookieOptions());
  return res;
}
