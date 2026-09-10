'use client';

import { useState, type ReactNode } from 'react';

export type TabSpec = { id: string; label: string; count?: number; content: ReactNode };

// Tab bar in the style of the track tabs on the applicant-review dashboard. Switching
// happens on the client (no reload, so no extra store reads) and the choice is written
// to the URL (?track=RE) so a sort link, which reloads the page, lands on the same tab.
export default function Tabs({ tabs, initial, param = 'track', label }: { tabs: TabSpec[]; initial: string; param?: string; label: string }) {
  const [active, setActive] = useState(tabs.some((t) => t.id === initial) ? initial : tabs[0]?.id);
  const select = (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    url.searchParams.set(param, id);
    window.history.replaceState(null, '', url);
  };
  return (
    <div>
      <nav role="tablist" aria-label={label} className="flex flex-wrap gap-1.5 border-b border-zinc-300">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              onClick={() => select(t.id)}
              className={
                'relative top-px rounded-t-lg border border-zinc-300 px-4 pb-2 pt-2.5 text-sm font-semibold ' +
                (on
                  ? "border-b-white bg-white text-zinc-900 after:absolute after:-top-px after:left-3 after:right-3 after:h-[3px] after:rounded-b-sm after:bg-blue-700 after:content-['']"
                  : 'border-b-0 bg-zinc-100 text-zinc-500 hover:text-zinc-700')
              }
            >
              {t.label}
              {t.count !== undefined && <span className="ml-1.5 font-mono text-[11.5px] tabular-nums text-zinc-500">{t.count}</span>}
            </button>
          );
        })}
      </nav>
      {tabs.map((t) => (
        <section key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={t.id !== active} className="pt-5">
          {t.content}
        </section>
      ))}
    </div>
  );
}
