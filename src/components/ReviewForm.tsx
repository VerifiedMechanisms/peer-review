'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { questionnaire, type Question, type Track } from '@/lib/questionnaire';
import type { Review } from '@/lib/store';
import MarkdownEditor from './MarkdownEditor';

type Answers = Record<string, string | number>;

export default function ReviewForm({ track, code, initial }: { track: Track; code: string; initial: Review | null }) {
  const [answers, setAnswers] = useState<Answers>(initial?.answers ?? {});
  const [status, setStatus] = useState<'draft' | 'submitted'>(initial?.status ?? 'draft');
  const [locked, setLocked] = useState(initial?.status === 'submitted');
  const [savedAt, setSavedAt] = useState<string | null>(initial?.updatedAt ?? null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(initial?.submittedAt ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The save status is shown in the page header, top right, outside this box.
  const [statusSlot, setStatusSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setStatusSlot(document.getElementById('save-status')), []);
  const statusText =
    status === 'submitted'
      ? `Submitted ${submittedAt ? new Date(submittedAt).toLocaleString('en-GB') : ''}`
      : savedAt
        ? `Draft saved ${new Date(savedAt).toLocaleString('en-GB')}`
        : 'Drafts save automatically';

  const save = useCallback(
    async (next: 'draft' | 'submitted', current: Answers) => {
      setBusy(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/review/${code}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: current, status: next }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 422) {
          setMissing(data.missing ?? []);
          setMessage('Please answer the highlighted questions before submitting.');
          return false;
        }
        if (!res.ok) {
          setMessage(`Could not save (${res.status}). Your answers are still in this page; try again in a moment.`);
          return false;
        }
        dirty.current = false;
        setMissing([]);
        setSavedAt(data.updatedAt ?? new Date().toISOString());
        if (data.submittedAt) setSubmittedAt(data.submittedAt);
        setStatus(data.status ?? next);
        return true;
      } catch {
        setMessage('Network error while saving. Your answers are still in this page; try again in a moment.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [code],
  );

  // autosave drafts, debounced
  useEffect(() => {
    if (locked || status === 'submitted' || !dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save('draft', answers), 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [answers, locked, status, save]);

  // warn on leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  function set(id: string, value: string | number) {
    dirty.current = true;
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  async function submit() {
    const ok = await save('submitted', answers);
    if (ok) {
      setLocked(true);
      setMessage('Review submitted. Thank you. You can still edit it until the deadline.');
    }
  }

  const sections = questionnaire[track];

  return (
    <form
      className="space-y-8 rounded-lg border border-zinc-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {statusSlot && createPortal(<span>{statusText}</span>, statusSlot)}
      {locked && (
        <div className="flex justify-end text-sm">
          <button type="button" className="text-blue-700 hover:underline" onClick={() => setLocked(false)}>
            Edit review
          </button>
        </div>
      )}

      <fieldset disabled={locked} className="space-y-8 disabled:opacity-70">
        {sections.map((s, i) => (
          <section key={i} className="flex flex-col gap-6">
            {(s.title || s.intro) && (
              <div>
                {s.title && <h2 className="text-lg font-semibold">{s.title}</h2>}
                {s.intro && <p className="mt-1 text-sm text-zinc-600">{s.intro}</p>}
              </div>
            )}
            {s.questions.map((q) => (
              <Field key={q.id} q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} invalid={missing.includes(q.id)} />
            ))}
          </section>
        ))}
      </fieldset>

      {message && (
        <p className={`rounded-md border p-3 text-sm ${missing.length ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`}>
          {message}
        </p>
      )}

      {!locked && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {status === 'submitted' ? 'Save changes' : 'Submit review'}
          </button>
          {status !== 'submitted' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void save('draft', answers)}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
            >
              Save draft
            </button>
          )}
          {busy && <span className="text-sm text-zinc-500">Saving…</span>}
        </div>
      )}
    </form>
  );
}

function Field({ q, value, onChange, invalid }: { q: Question; value: string | number | undefined; onChange: (v: string | number) => void; invalid: boolean }) {
  const frame = `space-y-2 rounded-md ${invalid ? 'ring-2 ring-amber-400 ring-offset-4' : ''}`;
  const clear =
    value !== undefined && value !== '' ? (
      <button type="button" onClick={() => onChange('')} className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline">
        Clear selection
      </button>
    ) : null;
  // text answers are Markdown; scales and choices stay as buttons
  const label = (
    <label className="block text-sm font-medium text-zinc-900">
      {q.label} {q.required && <span className="text-red-600">*</span>}
      {q.help && <span className="mt-0.5 block text-xs font-normal text-zinc-500">{q.help}</span>}
    </label>
  );
  if (q.kind === 'scale') {
    return (
      <div className={frame}>
        {label}
        <div className="flex items-center gap-2">
          <span className="w-28 text-xs text-zinc-500">{q.low}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border text-sm ${value === n ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 hover:bg-zinc-100'}`}>
                <input type="radio" name={q.id} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
                {n}
              </label>
            ))}
          </div>
          <span className="w-28 text-right text-xs text-zinc-500">{q.high}</span>
        </div>
        {clear}
      </div>
    );
  }
  if (q.kind === 'choice') {
    return (
      <div className={frame}>
        {label}
        <div className={q.layout === 'column' ? 'flex flex-col items-start gap-2' : 'flex flex-wrap gap-2'}>
          {q.options.map((o) => (
            <label key={o} className={`cursor-pointer rounded-md border px-3 py-1.5 text-[13px] leading-snug ${value === o ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 hover:bg-zinc-100'}`}>
              <input type="radio" name={q.id} value={o} checked={value === o} onChange={() => onChange(o)} className="sr-only" />
              {o}
            </label>
          ))}
        </div>
        {clear}
      </div>
    );
  }
  if (q.kind === 'number') {
    return (
      <div className={frame}>
        {label}
        <input
          type="number"
          min={q.min}
          max={q.max}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-32 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
        />
      </div>
    );
  }
  return (
    <div className={frame}>
      {label}
      <MarkdownEditor id={q.id} rows={q.rows ?? 4} value={typeof value === 'string' ? value : ''} onChange={onChange} />
    </div>
  );
}
