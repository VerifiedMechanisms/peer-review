import type { Metadata } from 'next';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Verified Mechanisms peer review',
  description: 'Anonymous peer review of the Verified Mechanisms take-home submissions.',
  robots: { index: false, follow: false },
};

import { ISSUES_URL } from '@/lib/config';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              Verified Mechanisms <span className="font-normal text-zinc-500">peer review</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600">
              <a href={ISSUES_URL} className="hover:text-zinc-900" target="_blank" rel="noreferrer">
                Request a feature
              </a>
              <a href="/logout" className="hover:text-zinc-900">
                Sign out
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 py-8 text-xs text-zinc-500">
          Questions: hiring@verifiedmechanisms.ai. This page was vibe coded with Claude. It is expected that you may
          face some issues, so feel free to{' '}
          <a href={ISSUES_URL} className="underline hover:text-zinc-900" target="_blank" rel="noreferrer">
            open an issue on GitHub
          </a>{' '}
          if you have problems or would like some features.
        </footer>
      </body>
    </html>
  );
}
