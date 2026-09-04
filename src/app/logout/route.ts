import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, REVIEWER_COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.delete(REVIEWER_COOKIE);
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
