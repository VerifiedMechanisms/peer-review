#!/usr/bin/env node
// Upload the reviewer roster, submissions, assignments and redacted PDFs to the
// private Blob store. Run from the project root with the Blob token in the env:
//
//   node --env-file=.env.local scripts/seed.mjs <seed.json> [<dir with CODE.pdf files>]
//
// seed.json: { reviewers: [{id,name,email,role,token}], submissions: [{code,role}],
//              assignments: [{reviewerId,code}] }
// The seed file and the PDF directory live outside this repository.
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { put, list } from '@vercel/blob';

const [seedPath, pdfDir] = process.argv.slice(2);
if (!seedPath) {
  console.error('usage: node --env-file=.env.local scripts/seed.mjs <seed.json> [<pdf dir>]');
  process.exit(2);
}
// A private store connected through the dashboard gives BLOB_STORE_ID and an
// OIDC token (VERCEL_OIDC_TOKEN from `vercel env pull`) rather than a
// read-write token; the SDK accepts either.
const oidc = process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN;
if (!process.env.BLOB_READ_WRITE_TOKEN && !oidc) {
  console.error('no Blob credentials: need BLOB_READ_WRITE_TOKEN, or BLOB_STORE_ID plus '
    + 'VERCEL_OIDC_TOKEN (run `vercel env pull .env.local`, then pass --env-file=.env.local)');
  process.exit(2);
}
const seed = JSON.parse(await readFile(seedPath, 'utf8'));
const opts = { access: 'private', addRandomSuffix: false, allowOverwrite: true };

for (const [name, data] of [
  ['reviewers', seed.reviewers],
  ['submissions', seed.submissions.map((s) => ({ code: s.code, role: s.role, pdf: `pdfs/${s.code}.pdf` }))],
  ['assignments', seed.assignments],
]) {
  await put(`data/${name}.json`, JSON.stringify(data, null, 1), { ...opts, contentType: 'application/json' });
  console.log(`data/${name}.json  ${data.length} rows`);
}

if (pdfDir) {
  const wanted = new Set(seed.submissions.map((s) => `${s.code}.pdf`));
  const files = (await readdir(pdfDir)).filter((f) => wanted.has(f));
  const missing = [...wanted].filter((f) => !files.includes(f));
  if (missing.length) console.warn('no PDF for:', missing.join(', '));
  for (const f of files) {
    const body = await readFile(join(pdfDir, f));
    await put(`pdfs/${f}`, body, { ...opts, contentType: 'application/pdf' });
    console.log(`pdfs/${f}  ${(body.length / 1024).toFixed(0)} KB`);
  }
}

const { blobs } = await list({ prefix: 'pdfs/' });
console.log(`store now holds ${blobs.length} PDFs`);
