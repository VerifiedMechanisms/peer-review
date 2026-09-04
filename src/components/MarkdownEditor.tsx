'use client';

import { useState } from 'react';
import Markdown from './Markdown';

// OpenReview-style text field: a Write / Preview toggle over one box.
export default function MarkdownEditor({
  id,
  value,
  rows = 6,
  onChange,
}: {
  id: string;
  value: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const tabClass = (t: 'write' | 'preview') =>
    `rounded px-2.5 py-1 ${tab === t ? 'bg-zinc-200 font-medium text-zinc-900' : 'text-zinc-600 hover:text-zinc-900'}`;
  return (
    <div className="rounded-md border border-zinc-300 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-2 py-1 text-xs text-zinc-500">
        <div className="flex gap-1">
          <button type="button" onClick={() => setTab('write')} className={tabClass('write')}>
            Write
          </button>
          <button type="button" onClick={() => setTab('preview')} className={tabClass('preview')}>
            Preview
          </button>
        </div>
        <span>Markdown and LaTeX supported</span>
      </div>
      {tab === 'write' ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck
          className="w-full resize-y rounded-b-md p-2 font-mono text-sm outline-none focus:bg-zinc-50"
        />
      ) : (
        <div className="min-h-[6rem] overflow-auto p-2">
          {value.trim() ? <Markdown source={value} /> : <p className="text-sm text-zinc-400">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
