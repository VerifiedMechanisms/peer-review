import { type NextRequest } from 'next/server';
import { currentReviewer, isAdmin } from '@/lib/auth';
import { getPdf, isAssigned } from '@/lib/store';

const CODE = /^(RS|RE)-\d{2}$/;

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!CODE.test(code)) return new Response('Not found', { status: 404 });
  const reviewer = await currentReviewer();
  const admin = await isAdmin();
  const allowed = admin || (reviewer !== null && (await isAssigned(reviewer.id, code)));
  if (!allowed) return new Response('Forbidden', { status: 403 });
  const pdf = await getPdf(code);
  if (!pdf) return new Response('Not found', { status: 404 });
  const download = req.nextUrl.searchParams.get('download') === '1';
  return new Response(pdf.stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.blob.size),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${code}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
