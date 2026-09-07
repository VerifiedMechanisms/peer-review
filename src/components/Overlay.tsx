'use client';

import { useEffect, useState } from 'react';

// A link that opens its target in an overlay iframe, the way the applicant-review
// dashboard opens documents, instead of leaving the page. Escape, the close button or
// a click outside closes it; a modifier-click or the "open in a tab" link opens the
// target as a normal page.
export default function Overlay({
  href,
  openHref,
  title,
  className,
  children,
}: {
  href: string;
  openHref?: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const tab = openHref ?? href;
  return (
    <>
      <a
        href={tab}
        className={className ?? 'text-blue-700 hover:underline'}
        title={title}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </a>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-label={title}
        >
          <div
            className="flex h-[94vh] w-[min(1000px,96vw)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 text-sm text-zinc-100">
              <span>
                {title}
                <a href={tab} target="_blank" rel="noreferrer" className="ml-3 text-zinc-400 hover:text-white hover:underline">
                  open in a tab
                </a>
              </span>
              <button type="button" onClick={() => setOpen(false)} className="text-xl leading-none hover:text-white" aria-label="Close">
                &times;
              </button>
            </div>
            <iframe src={href} title={title} className="w-full flex-1 bg-white" />
          </div>
        </div>
      )}
    </>
  );
}
