# Verified Mechanisms peer review

The site the take-home reviewers use: each reviewer opens a personal link, reads the
submissions assigned to them (redacted PDFs identified only by a code such as RS-07) and
fills in a short questionnaire per submission. Reviews are visible only to the hiring team.

Feature requests and bug reports are welcome as [GitHub issues](../../issues/new/choose).

## How it works

- Next.js on Vercel. One private Vercel Blob store holds the redacted PDFs, the reviewer
  roster, the assignments and one JSON file per review. There is no database.
- No accounts. A reviewer's link `/r/<token>` sets a cookie; `/a/<ADMIN_TOKEN>` does the same
  for the admin view at `/admin`, which shows progress and exports all reviews as CSV or JSON.
- The app never learns who wrote a submission. The code-to-author mapping is kept elsewhere.
- The questionnaire lives in `src/lib/questionnaire.ts`, one section list per track.

## Running it

```
npm install
vercel link && vercel env pull .env.local   # BLOB_READ_WRITE_TOKEN, ADMIN_TOKEN
npm run dev
```

Seed or update the data (the seed file and the PDFs stay outside the repo):

```
node --env-file=.env.local scripts/seed.mjs /path/to/seed.json /path/to/redacted-pdfs
```

Re-running the seed overwrites the roster, submissions and assignments and re-uploads the
PDFs; it never touches submitted reviews.
