import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, cookieOptions, isAdminToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isAdminToken(token)) return NextResponse.redirect(new URL('/?error=link', req.url));
  const res = NextResponse.redirect(new URL('/admin', req.url));
  res.cookies.set(ADMIN_COOKIE, token, cookieOptions());
  return res;
}
