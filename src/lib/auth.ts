import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';
import { getReviewers, type Reviewer } from './store';

export const REVIEWER_COOKIE = 'pr_reviewer';
export const ADMIN_COOKIE = 'pr_admin';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 45; // 45 days

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length || ba.length === 0) return false;
  return timingSafeEqual(ba, bb);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function findReviewerByToken(token: string): Promise<Reviewer | null> {
  if (!token) return null;
  const reviewers = await getReviewers();
  return reviewers.find((r) => safeEqual(r.token, token)) ?? null;
}

export async function currentReviewer(): Promise<Reviewer | null> {
  const token = (await cookies()).get(REVIEWER_COOKIE)?.value ?? '';
  return findReviewerByToken(token);
}

export function isAdminToken(token: string): boolean {
  const admin = process.env.ADMIN_TOKEN ?? '';
  return admin.length >= 16 && safeEqual(admin, token);
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? '';
  return isAdminToken(token);
}
