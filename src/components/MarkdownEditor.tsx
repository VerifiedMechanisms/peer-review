'use client';

import { useState } from 'react';
import Markdown from './Markdown';

// OpenReview-style text field: Markdown source on the left, live preview on the right.
// On narrow screens the two become tabs.
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
  return (
    <div className="rounded-md border border-zinc-300 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-2 py-1 text-xs text-zinc-500">
        <div className="flex gap-1 md:hidden">
          <button type="button" onClick={() => setTab('write')} className={`rounded px-2 py-0.5 ${tab === 'write' ? 'bg-zinc-200 text-zinc-900' : ''}`}>
            Write
          </button>
          <button type="button" onClick={() => setTab('preview')} className={`rounded px-2 py-0.5 ${tab === 'preview' ? 'bg-zinc-200 text-zinc-900' : ''}`}>
            Preview
          </button>
        </div>
        <span className="hidden md:inline">Markdown</span>
        <span>
          Markdown and LaTeX supported: <code>**bold**</code>, lists, tables, <code>$H^*(f)$</code>
        </span>
      </div>
      <div className="grid md:grid-cols-2 md:divide-x md:divide-zinc-200">
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck
          className={`w-full resize-y rounded-bl-md p-2 font-mono text-sm outline-none focus:bg-zinc-50 ${tab === 'write' ? '' : 'hidden md:block'}`}
        />
        <div className={`min-h-[6rem] overflow-auto p-2 ${tab === 'preview' ? '' : 'hidden md:block'}`}>
          <Markdown source={value} />
        </div>
      </div>
    </div>
  );
}
