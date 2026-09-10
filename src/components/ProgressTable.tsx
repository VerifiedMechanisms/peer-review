'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import Overlay from '@/components/Overlay';
import { defaultDir, sortRows, type ProgressRow, type SortDir, type SortKey } from '@/lib/progress';

// One assignment per row, flattened on the server (see src/lib/progress.ts) so this
// client component holds only what the table shows. Sorting happens here, in place:
// clicking a header reorders the rows without a reload, so nothing is refetched from
// the store and the page stays put.

type Column = { k: SortKey; label: string };
const BASE: Column[] = [
  { k: 'code', label: 'Code' },
  { k: 'name', label: 'Name' },
  { k: 'reviewer', label: 'Reviewer' },
  { k: 'status', label: 'Status' },
  { k: 'overall', label: 'Overall' },
  { k: 'quality', label: 'Quality' },
  { k: 'clarity', label: 'Clarity' },
  { k: 'originality', label: 'Originality' },
];
// The hiring team's ranking, when one is seeded, sits right after the overall verdict.
function columnsFor(rankLabel?: string): Column[] {
  if (!rankLabel) return BASE;
  const i = BASE.findIndex((c) => c.k === 'overall') + 1;
  return [...BASE.slice(0, i), { k: 'rank', label: rankLabel }, ...BASE.slice(i)];
}

// Hidden columns, chosen through the "Columns" menu like on the applicant-review
// dashboard. Kept in localStorage and shared by both track tables through one external
// store, so a change on one tab shows on the other; the server render shows every column
// and the stored choice applies after hydration.
const HIDDEN_KEY = 'pr-admin-hidden-cols';
const listeners = new Set<() => void>();
const readHidden = (): string => {
  try {
    return localStorage.getItem(HIDDEN_KEY) ?? '[]';
  } catch {
    return '[]';
  }
};
const writeHidden = (keys: string[]) => {
  try {
    if (keys.length) localStorage.setItem(HIDDEN_KEY, JSON.stringify(keys));
    else localStorage.removeItem(HIDDEN_KEY);
  } catch {
    // private mode or storage blocked: the choice lasts for this page view only
  }
  listeners.forEach((l) => l());
};
const subscribeHidden = (l: () => void) => {
  listeners.add(l);
  window.addEventListener('storage', l);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', l);
  };
};
function useHiddenColumns(): [Set<string>, (k: string) => void, () => void] {
  const raw = useSyncExternalStore(subscribeHidden, readHidden, () => '[]');
  const hidden = useMemo(() => {
    try {
      const v: unknown = JSON.parse(raw);
      return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
    } catch {
      return new Set<string>();
    }
  }, [raw]);
  const toggle = (k: string) => {
    const next = new Set(hidden);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    writeHidden([...next]);
  };
  const reset = () => writeHidden([]);
  return [hidden, toggle, reset];
}

function ColumnMenu({ columns, hidden, toggle, reset }: { columns: Column[]; hidden: Set<string>; toggle: (k: string) => void; reset: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
      >
        Columns &#9662;
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-40 rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-lg">
          {columns.map((c) =>
            c.k === 'name' ? null : ( // the name stays, as on the dashboard
              <label key={c.k} className="flex items-center gap-2 py-0.5">
                <input type="checkbox" checked={!hidden.has(c.k)} onChange={() => toggle(c.k)} />
                {c.label}
              </label>
            ),
          )}
          <button type="button" onClick={() => { reset(); setOpen(false); }} className="mt-2 text-xs text-blue-700 hover:underline">
            Reset columns
          </button>
        </div>
      )}
    </div>
  );
}

// Column header. The arrow slot is always there, so the header keeps its width whether
// or not this column is the active one.
function HeadCell({ k, label, active, dir, onSort }: { k: SortKey; label: string; active: boolean; dir: SortDir; onSort: (k: SortKey) => void }) {
  return (
    <th className="px-3 py-2" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={'inline-flex items-center uppercase tracking-wide hover:underline ' + (active ? 'text-zinc-900' : '')}
      >
        {label}
        <span aria-hidden="true" className="inline-block w-3 text-center">
          {active ? (dir === 'asc' ? '▴' : '▾') : ''}
        </span>
      </button>
    </th>
  );
}

function cell(r: ProgressRow, k: SortKey): ReactNode {
  switch (k) {
    case 'code':
      return <Overlay href={`/api/pdf/${r.code}`} title={`Submission ${r.code}`}>{r.code}</Overlay>;
    case 'name':
      return r.name ? <Overlay href={`/api/cv/${r.code}`} title={`${r.name}, CV`}>{r.name}</Overlay> : '';
    case 'reviewer':
      return r.reviewer;
    case 'status':
      return r.status ? (
        <Overlay
          href={`/embed/review/${r.code}/${r.reviewerId}`}
          openHref={`/admin/review/${r.code}/${r.reviewerId}`}
          title={`Review of ${r.code} by ${r.reviewer}`}
        >
          {r.status}
        </Overlay>
      ) : (
        'not started'
      );
    case 'overall':
      return r.overall;
    case 'rank':
      return r.rank ?? '';
    default:
      return r[k];
  }
}

export default function ProgressTable({
  rows,
  initialSort,
  initialDir,
  rankLabel,
}: {
  rows: ProgressRow[];
  initialSort: SortKey;
  initialDir: SortDir;
  rankLabel?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>(initialSort);
  const [dir, setDir] = useState<SortDir>(initialDir);
  const [hidden, toggle, reset] = useHiddenColumns();
  const columns = useMemo(() => columnsFor(rankLabel), [rankLabel]);
  const visible = columns.filter((c) => !hidden.has(c.k));
  const onSort = (k: SortKey) => {
    // Clicking the active column flips the direction; any other column starts from its default.
    const next = k === sortKey ? (dir === 'asc' ? 'desc' : 'asc') : defaultDir(k);
    setSortKey(k);
    setDir(next);
    // Kept in the URL so a refresh or a shared link opens with the same order.
    const url = new URL(window.location.href);
    url.searchParams.set('sort', k);
    url.searchParams.set('dir', next);
    window.history.replaceState(null, '', url);
  };
  const sorted = useMemo(() => sortRows(rows, sortKey, dir), [rows, sortKey, dir]);
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <ColumnMenu columns={columns} hidden={hidden} toggle={toggle} reset={reset} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              {visible.map((c) => (
                <HeadCell key={c.k} k={c.k} label={c.label} active={c.k === sortKey} dir={dir} onSort={onSort} />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted.map((r) => (
              <tr key={`${r.reviewerId}/${r.code}`}>
                {visible.map((c) => (
                  <td key={c.k} className={'px-3 py-2' + (c.k === 'code' ? ' font-medium' : '')}>
                    {cell(r, c.k)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-zinc-500" colSpan={visible.length}>No assignments yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
