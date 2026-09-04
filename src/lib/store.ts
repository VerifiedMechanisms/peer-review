// Storage: one private Vercel Blob store. Small JSON records plus the redacted
// PDFs. The app never sees author identities: submissions are codes only, and
// the code-to-author mapping lives outside this repository.
import { get, list, put } from '@vercel/blob';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Local development without a Blob store: set LOCAL_STORE_DIR to a directory
// laid out like the store (data/*.json, pdfs/CODE.pdf, reviews/<id>/<code>.json).
const LOCAL = process.env.LOCAL_STORE_DIR;
import type { Track } from './questionnaire';

export type Reviewer = { id: string; name: string; email: string; role: Track; token: string };
export type Submission = { code: string; role: Track; pdf: string };
export type Assignment = { reviewerId: string; code: string };
export type ReviewStatus = 'draft' | 'submitted';
export type Review = {
  code: string;
  reviewerId: string;
  role: Track;
  status: ReviewStatus;
  answers: Record<string, string | number>;
  updatedAt: string;
  submittedAt?: string;
};

const PRIVATE = { access: 'private' as const };

async function readJson<T>(pathname: string): Promise<T | null> {
  if (LOCAL) {
    try {
      return JSON.parse(await readFile(join(LOCAL, pathname), 'utf8')) as T;
    } catch {
      return null;
    }
  }
  try {
    const res = await get(pathname, { ...PRIVATE, useCache: false });
    if (!res || res.statusCode !== 200) return null;
    const text = await new Response(res.stream).text();
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof Error && /not found|BlobNotFound/i.test(err.message)) return null;
    throw err;
  }
}

async function writeJson(pathname: string, data: unknown): Promise<void> {
  if (LOCAL) {
    const file = join(LOCAL, pathname);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(data, null, 1));
    return;
  }
  await put(pathname, JSON.stringify(data, null, 1), {
    ...PRIVATE,
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function getReviewers(): Promise<Reviewer[]> {
  return (await readJson<Reviewer[]>('data/reviewers.json')) ?? [];
}

export async function getSubmissions(): Promise<Submission[]> {
  return (await readJson<Submission[]>('data/submissions.json')) ?? [];
}

export async function getAssignments(): Promise<Assignment[]> {
  return (await readJson<Assignment[]>('data/assignments.json')) ?? [];
}

export function reviewPath(reviewerId: string, code: string): string {
  return `reviews/${reviewerId}/${code}.json`;
}

export async function getReview(reviewerId: string, code: string): Promise<Review | null> {
  return readJson<Review>(reviewPath(reviewerId, code));
}

export async function saveReview(review: Review): Promise<void> {
  await writeJson(reviewPath(review.reviewerId, review.code), review);
}

export async function listReviews(): Promise<Review[]> {
  const out: Review[] = [];
  if (LOCAL) {
    let ids: string[] = [];
    try {
      ids = await readdir(join(LOCAL, 'reviews'));
    } catch {
      return out;
    }
    for (const id of ids) {
      for (const f of await readdir(join(LOCAL, 'reviews', id))) {
        const r = await readJson<Review>(`reviews/${id}/${f}`);
        if (r) out.push(r);
      }
    }
    return out;
  }
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: 'reviews/', cursor, limit: 1000 });
    for (const b of page.blobs) {
      const r = await readJson<Review>(b.pathname);
      if (r) out.push(r);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

export async function getPdf(code: string): Promise<{ stream: ReadableStream<Uint8Array>; blob: { size: number } } | null> {
  if (LOCAL) {
    try {
      const buf = await readFile(join(LOCAL, `pdfs/${code}.pdf`));
      return { stream: new Blob([buf]).stream(), blob: { size: buf.length } };
    } catch {
      return null;
    }
  }
  const res = await get(`pdfs/${code}.pdf`, PRIVATE);
  if (!res || res.statusCode !== 200) return null;
  return res;
}

export async function isAssigned(reviewerId: string, code: string): Promise<boolean> {
  const a = await getAssignments();
  return a.some((x) => x.reviewerId === reviewerId && x.code === code);
}
