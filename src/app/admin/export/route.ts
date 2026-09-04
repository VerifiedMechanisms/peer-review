import { type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { allQuestions } from '@/lib/questionnaire';
import { getReviewers, listReviews } from '@/lib/store';

function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return new Response('Forbidden', { status: 403 });
  const [reviewers, reviews] = await Promise.all([getReviewers(), listReviews()]);
  const byId = new Map(reviewers.map((r) => [r.id, r]));
  const rows = reviews
    .map((r) => ({
      code: r.code,
      role: r.role,
      reviewer: byId.get(r.reviewerId)?.name ?? r.reviewerId,
      reviewer_email: byId.get(r.reviewerId)?.email ?? '',
      status: r.status,
      submittedAt: r.submittedAt ?? '',
      updatedAt: r.updatedAt,
      answers: r.answers,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
  const format = req.nextUrl.searchParams.get('format') ?? 'json';
  const stamp = new Date().toISOString().slice(0, 10);
  if (format !== 'csv') {
    return Response.json(rows, {
      headers: { 'Content-Disposition': `attachment; filename="peer-reviews-${stamp}.json"`, 'Cache-Control': 'no-store' },
    });
  }
  const qids = Array.from(new Set([...allQuestions('RS'), ...allQuestions('RE')].map((q) => q.id)));
  const head = ['code', 'role', 'reviewer', 'reviewer_email', 'status', 'submittedAt', 'updatedAt', ...qids];
  const lines = [head.join(',')];
  for (const r of rows) {
    lines.push([r.code, r.role, r.reviewer, r.reviewer_email, r.status, r.submittedAt, r.updatedAt, ...qids.map((q) => r.answers[q])].map(csvCell).join(','));
  }
  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="peer-reviews-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
