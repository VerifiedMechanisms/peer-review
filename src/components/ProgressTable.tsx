'use client';

import { useMemo, useState } from 'react';
import Overlay from '@/components/Overlay';
import { defaultDir, sortRows, type ProgressRow, type SortDir, type SortKey } from '@/lib/progress';

// One assignment per row, flattened on the server (see src/lib/progress.ts) so this
// client component holds only what the table shows. Sorting happens here, in place:
// clicking a header reorders the rows without a reload, so nothing is refetched from
// the store and the page stays put.
const COLUMNS: { k: SortKey; label: string }[] = [
  { k: 'code', label: 'Code' },
  { k: 'name', label: 'Name' },
  { k: 'reviewer', label: 'Reviewer' },
  { k: 'status', label: 'Status' },
  { k: 'overall', label: 'Overall' },
  { k: 'quality', label: 'Quality' },
  { k: 'clarity', label: 'Clarity' },
  { k: 'originality', label: 'Originality' },
];

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

export default function ProgressTable({ rows, initialSort, initialDir }: { rows: ProgressRow[]; initialSort: SortKey; initialDir: SortDir }) {
  const [sortKey, setSortKey] = useState<SortKey>(initialSort);
  const [dir, setDir] = useState<SortDir>(initialDir);
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
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
          <tr>
            {COLUMNS.map((c) => (
              <HeadCell key={c.k} k={c.k} label={c.label} active={c.k === sortKey} dir={dir} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {sorted.map((r) => (
            <tr key={`${r.reviewerId}/${r.code}`}>
              <td className="px-3 py-2 font-medium">
                <Overlay href={`/api/pdf/${r.code}`} title={`Submission ${r.code}`}>{r.code}</Overlay>
              </td>
              <td className="px-3 py-2">
                {r.name ? <Overlay href={`/api/cv/${r.code}`} title={`${r.name}, CV`}>{r.name}</Overlay> : ''}
              </td>
              <td className="px-3 py-2">{r.reviewer}</td>
              <td className="px-3 py-2">
                {r.status ? (
                  <Overlay
                    href={`/embed/review/${r.code}/${r.reviewerId}`}
                    openHref={`/admin/review/${r.code}/${r.reviewerId}`}
                    title={`Review of ${r.code} by ${r.reviewer}`}
                  >
                    {r.status}
                  </Overlay>
                ) : (
                  'not started'
                )}
              </td>
              <td className="px-3 py-2">{r.overall}</td>
              <td className="px-3 py-2">{r.quality}</td>
              <td className="px-3 py-2">{r.clarity}</td>
              <td className="px-3 py-2">{r.originality}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-3 text-zinc-500" colSpan={COLUMNS.length}>No assignments yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
