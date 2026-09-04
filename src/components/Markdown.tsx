'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Renders reviewer-written Markdown with GitHub tables and LaTeX ($...$ and $$...$$).
// react-markdown never emits raw HTML from the source, so this is safe for user input.
export default function Markdown({ source }: { source: string }) {
  if (!source.trim()) return <p className="text-sm italic text-zinc-400">Nothing to preview yet.</p>;
  return (
    <div className="md-preview text-sm leading-relaxed text-zinc-800">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
