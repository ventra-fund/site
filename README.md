# Astro + Bejamas/ui + Cloudflare Workers
- viewport prefetching enabled on all navbar links
- Bejamas/ui for the component library
- CF worker deployment through github repo connection: automatic when pushed to main
## Environment
The site is static except for `/api/contact` and `/api/partner`, which run on the Worker: each verifies the Turnstile token, then sends the message through Resend. They share the same secrets and inbox. The admin pages, the signing page and their API routes run on the Worker too (below). The shared pieces (body parsing, secret checks, siteverify, Resend, bindings) live in `src/lib/server/`. Variables are listed in `.env.example`.

- **Local:** copy `.env.example` to `.env` (gitignored) and fill it in. Both `pnpm dev` and `pnpm build && pnpm preview` read it (the adapter hands the values to wrangler at build time).
- **Production build:** needs nothing. The Turnstile site key is public, so it is committed as the default in `astro.config.mjs`. A `PUBLIC_TURNSTILE_SITE_KEY` build variable overrides it.
- **Production runtime** (Worker → Settings → Variables and Secrets, type *Secret*, or `npx wrangler secret put <NAME>`): `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `SIGNING_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `ADMIN_EMAILS`, `CONTACT_PHONE`, `CONTACT_CAREERS_EMAIL`. Use secrets, not plain variables: plain dashboard variables are wiped on each deploy, and nothing belongs in `wrangler.jsonc` since the repo is on GitHub.

Until the runtime secrets are set, the endpoints return 500 and send nothing.

Submissions are capped per IP by the `FORM_RATE_LIMIT` rate limiting binding in `wrangler.jsonc` (2 per 60 s across the two submit endpoints; a third returns 429 and the form explains why). The signing link's steps have `SIGN_RATE_LIMIT` (10 per 60 s) and the contact reveal has `CONTACT_RATE_LIMIT` (12 per 60 s). The bindings are read through `cloudflare:workers` in `src/lib/server/bindings.ts`, so they are only active inside the Worker: `pnpm dev` runs unlimited, `pnpm build && pnpm preview` exercises them.

Response headers (HSTS, nosniff, referrer policy, permissions policy, and a Content Security Policy) are set in two places that must stay in step. `public/_headers` covers static files (the prerendered pages and assets); Cloudflare doesn't apply it to anything the Worker answers, so `src/middleware.ts` adds the same set to the admin pages, the signing page and the API routes from `src/lib/server/security-headers.ts`, where each CSP directive is explained. The policy allows no inline scripts, so `astro.config.mjs` stops Astro from inlining small ones. A new third-party script, frame or API called from the browser needs its origin added to the policy in both files. Under `pnpm dev` neither applies.

### Stored applications (drop-offs)
The site used to take merchant applications directly at `/apply`, with bank statement uploads read by LlamaCloud, address suggestions from LocationIQ and drop-off capture of unfinished applications. That form and its API routes are gone (the site is ISO-only), but the records it left stay where they were: sessions and applications in the `DRAFTS_DB` D1 database, statement copies in the `DOCUMENTS` R2 bucket, both read by the admin pages (`/admin/drop-offs`) and the signing flow below. See `src/lib/server/drafts.ts`; the old form and its endpoints are in git history before their removal.

Retention is set in the `app_setting` table (defaults: unsubmitted drafts 30 days after their last save, submitted applications nobody has decided on 366 days, at most 5000 unsubmitted drafts, beyond which the oldest without an email or mobile go first) and applied lazily: a purge pass runs at most hourly, triggered by admin page loads, and deletes each session's stored statements with it. Changing a setting re-scopes existing rows on the next pass.

The numbers mirror the privacy policy (`src/pages/privacy.astro`, "How long we keep it"), so change the two together. A submitted application is kept at least 12 months (`APPLICATION_RETENTION_DAYS` in `src/lib/server/drafts.ts`; the admin setting can only raise it), the record retention period for business credit under ECOA / Regulation B (12 CFR § 1002.12). An application an admin has approved or declined is never purged, which covers the 12 months after a decision and the 7 years promised for signed ones. The same pass deletes stored statements no session ever claimed, 30 days after upload (`UNCLAIMED_DOCUMENT_DAYS`), a page of the bucket at a time.

One-time setup (production), then `pnpm migrate:remote` after any schema change:
```sh
npx wrangler r2 bucket create ventra-fund-documents
# No lifecycle rule on the bucket: it would delete the statements of applications that must be kept.
# If the earlier 180-day rule was added, remove it:
npx wrangler r2 bucket lifecycle remove ventra-fund-documents --name apply-backstop
pnpm migrate:remote
```
Locally, `pnpm migrate:local` before `pnpm build && pnpm preview`. Under `pnpm dev` there are no bindings, so the admin pages have no data.

### Decisions and e-signatures
An application's admin page (`/admin/drop-offs/<id>`) has a **Decision** section: approve or decline, with a reason written in the rich-text editor (required to decline, sanitized like the contact form's message). Approving emails the applicant a personal signing link (`/sign/<token>`, 14 days, `SIGNING_LINK_TTL_DAYS` in `src/lib/signing-config.ts`); approving again, resending or declining revokes the earlier link. Once signed, the decision is final. Logic in `src/lib/server/signing.ts`, schema in `migrations-drafts/0003_application_signing.sql`.

The signing page works like a DocuSign envelope, in two steps posted to `/api/sign/<token>`:
1. The electronic records and signatures disclosure (ESIGN), accepted on its own and timestamped.
2. The application details to confirm or correct, the business EIN and the signer's SSN, the attestation, and a typed name drawn in a cursive face (Dancing Script) as the signature.

Stored with the signature: what was confirmed (the admin page marks anything changed from the application), the signer's IP, browser, location, the disclosure and sign times, the terms version, and a SHA-256 over all of it plus the exact texts agreed to. Every step (sent, opened, disclosure accepted, signed, link revoked, identifiers revealed) goes into an audit trail with its time and origin, shown under the signature. The EIN and SSN are encrypted with AES-GCM under `SIGNING_ENCRYPTION_KEY` before they're written; the admin page shows the last four digits, and **Reveal** decrypts them, logging which admin did. The link token itself is never stored, only its hash. Decided applications are kept out of the retention purge.

Signing sends the applicant a receipt and the team inbox a notice. The disclosure and attestation wording in `src/lib/signing-config.ts` is a starting point; have it reviewed, and bump `SIGNING_TERMS_VERSION` whenever it changes.

### Worker Previews (non-production branches)
Every push to a branch other than `main` builds a Preview (`pnpm run build`, then `npx wrangler preview`) at `https://<branch>-site.ventrafund.workers.dev`. Previews inherit no production bindings: the `previews` block in `wrangler.jsonc` points them at staging copies (`ventra-fund-auth-preview`, `ventra-fund-drafts-preview`, the `ventra-fund-documents-preview` bucket, the `ventra-fund-sessions-preview` KV namespace) and separate rate-limit counters, so test data and admin sign-ins never touch production data.

- **Schema changes:** `pnpm migrate:preview` applies migrations to the staging databases (via `wrangler.preview-db.jsonc`, since `wrangler d1 migrations` doesn't read `previews`).
- **Secrets:** set once for all new Previews with `npx wrangler preview base-config secret put NAME`, or for one branch with `npx wrangler preview secret put NAME --name <branch>`. Base changes only reach Previews created afterwards.
- **Admins:** same `ADMIN_EMAILS` allowlist; each admin gets a fresh account in the staging auth database on first sign-in.
- **Turnstile:** the Preview hostname must be on the widget's allowed hostnames.
- **Builds:** watch paths skip commits that change no files, so an empty commit won't trigger one; retry from the dashboard instead.

### Dev vs. build
`astro.config.mjs` only attaches the `@astrojs/cloudflare` adapter for `astro build`/`astro preview`, not `astro dev`. Local dev runs on plain Node/Vite instead of the adapter's workerd emulation, which sidesteps an upstream dev-server bug where a dependency only reachable from an on-demand route (e.g. `free-email-domains` via `/partner`) gets discovered lazily and crashes the runner ([withastro/astro#17921](https://github.com/withastro/astro/issues/17921)). The rate limiters degrade to "unlimited" when absent, so `pnpm dev` behaves the same apart from that. To exercise anything binding-specific, use `pnpm build && pnpm preview` (or `wrangler dev`), not `pnpm dev`.

### Images
The adapter is set to `imageService: "compile"`: images are optimized once at build time and served as plain static files. The alternative, the Cloudflare Images binding, transforms on request, so the first load of each image size waits on the transform before it is cached. Only switch to it if a server-rendered page ever needs runtime resizing; static pages gain nothing from it.
