// Rows and sort order of the admin progress table. Plain module (no 'use client'), so the
// server page and the client table both get the real values: importing a constant from a
// client component into a server component yields a client reference, not the value.
export type ProgressRow = {
  code: string;
  name: string;
  reviewerId: string;
  reviewer: string;
  status: 'submitted' | 'draft' | null;
  overall: string;
  quality: string;
  clarity: string;
  originality: string;
  rank: number | null; // position in the hiring team's ranking, when one is seeded
};

export const SORT_KEYS = ['code', 'name', 'reviewer', 'status', 'overall', 'rank', 'quality', 'clarity', 'originality'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = 'asc' | 'desc';
const SCORE_KEYS: SortKey[] = ['overall', 'quality', 'clarity', 'originality'];
const VERDICT_RANK: Record<string, number> = { Excellent: 3, Good: 2, Satisfactory: 1 };
const STATUS_RANK: Record<string, number> = { submitted: 2, draft: 1 };

// Score columns start highest first, the rank with 1 first, the text columns A-Z.
export const defaultDir = (k: SortKey): SortDir => (SCORE_KEYS.includes(k) || k === 'status' ? 'desc' : 'asc');

// Rows without a value sort last either way. Within the same overall verdict, rows are
// ordered by the sum of the three scores (in the same direction); remaining ties fall
// back to the code.
export function sortRows(rows: ProgressRow[], key: SortKey, dir: SortDir): ProgressRow[] {
  const num = (r: ProgressRow): number | null => {
    if (key === 'overall') return VERDICT_RANK[r.overall] ?? null;
    if (key === 'status') return STATUS_RANK[r.status ?? ''] ?? 0;
    if (key === 'rank') return r.rank;
    const v = r[key as 'quality' | 'clarity' | 'originality'];
    return v === '' ? null : Number(v);
  };
  const total = (r: ProgressRow): number => [r.quality, r.clarity, r.originality].reduce((s, v) => s + (v === '' ? 0 : Number(v)), 0);
  const text = (r: ProgressRow): string => (key === 'code' ? r.code : key === 'name' ? r.name : r.reviewer);
  const sign = dir === 'asc' ? 1 : -1;
  return rows.slice().sort((x, y) => {
    if (SCORE_KEYS.includes(key) || key === 'status' || key === 'rank') {
      const a = num(x), b = num(y);
      if (a === null && b === null) return x.code.localeCompare(y.code);
      if (a === null) return 1;
      if (b === null) return -1;
      return sign * (a - b) || (key === 'overall' ? sign * (total(x) - total(y)) : 0) || x.code.localeCompare(y.code);
    }
    return sign * text(x).localeCompare(text(y)) || x.code.localeCompare(y.code);
  });
}
