import { type NextRequest } from 'next/server';
import { currentReviewer, isAdmin } from '@/lib/auth';
import { getCodeZip, isAssigned } from '@/lib/store';

// Zips run to tens of megabytes; give the stream time to finish.
export const maxDuration = 300;

const CODE = /^(RS|RE)-\d{2}$/;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!CODE.test(code)) return new Response('Not found', { status: 404 });
  const reviewer = await currentReviewer();
  const admin = await isAdmin();
  const allowed = admin || (reviewer !== null && (await isAssigned(reviewer.id, code)));
  if (!allowed) return new Response('Forbidden', { status: 403 });
  const zip = await getCodeZip(code);
  if (!zip) return new Response('Not found', { status: 404 });
  return new Response(zip.stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': String(zip.blob.size),
      'Content-Disposition': `attachment; filename="${code}-code.zip"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
