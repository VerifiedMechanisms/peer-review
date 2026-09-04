import { NextResponse, type NextRequest } from 'next/server';
import { currentReviewer } from '@/lib/auth';
import { allQuestions, missingRequired } from '@/lib/questionnaire';
import { getReview, getSubmissions, isAssigned, saveReview, type Review } from '@/lib/store';

const CODE = /^(RS|RE)-\d{2}$/;

async function authorize(code: string) {
  if (!CODE.test(code)) return { error: NextResponse.json({ error: 'not found' }, { status: 404 }) };
  const reviewer = await currentReviewer();
  if (!reviewer) return { error: NextResponse.json({ error: 'not signed in' }, { status: 401 }) };
  if (!(await isAssigned(reviewer.id, code))) {
    return { error: NextResponse.json({ error: 'not assigned' }, { status: 403 }) };
  }
  return { reviewer };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const auth = await authorize(code);
  if ('error' in auth) return auth.error;
  const review = await getReview(auth.reviewer.id, code);
  return NextResponse.json(review ?? null, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const auth = await authorize(code);
  if ('error' in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as { answers?: unknown; status?: unknown } | null;
  if (!body || typeof body.answers !== 'object' || body.answers === null) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const status = body.status === 'submitted' ? 'submitted' : 'draft';
  const submission = (await getSubmissions()).find((s) => s.code === code);
  if (!submission) return NextResponse.json({ error: 'unknown submission' }, { status: 404 });

  // keep only known question ids, as strings or numbers, bounded in size
  const known = new Set(allQuestions(submission.role).map((q) => q.id));
  const answers: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
    if (!known.has(k)) continue;
    if (typeof v === 'number' && Number.isFinite(v)) answers[k] = v;
    else if (typeof v === 'string') answers[k] = v.slice(0, 20000);
  }
  if (status === 'submitted') {
    const missing = missingRequired(submission.role, answers);
    if (missing.length) return NextResponse.json({ error: 'missing required answers', missing }, { status: 422 });
  }
  const previous = await getReview(auth.reviewer.id, code);
  const now = new Date().toISOString();
  const review: Review = {
    code,
    reviewerId: auth.reviewer.id,
    role: submission.role,
    status,
    answers,
    updatedAt: now,
    submittedAt: status === 'submitted' ? (previous?.submittedAt ?? now) : previous?.submittedAt,
  };
  await saveReview(review);
  return NextResponse.json(review, { headers: { 'Cache-Control': 'no-store' } });
}
