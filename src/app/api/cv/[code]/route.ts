import { type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getCv } from '@/lib/store';

// The author's CV, for the admin pages only (added 7 Sep 2026). Reviewers never get
// past the admin check, so nothing identifying reaches them through this route.
const CODE = /^(RS|RE)-\d{2}$/;

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!CODE.test(code)) return new Response('Not found', { status: 404 });
  if (!(await isAdmin())) return new Response('Forbidden', { status: 403 });
  const pdf = await getCv(code);
  if (!pdf) return new Response('Not found', { status: 404 });
  const download = req.nextUrl.searchParams.get('download') === '1';
  return new Response(pdf.stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.blob.size),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${code}-cv.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
