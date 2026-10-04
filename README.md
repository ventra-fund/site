# Astro + Bejamas/ui + Cloudflare Workers
- viewport prefetching enabled on all navbar links
- Bejamas/ui for the component library
- CF worker deployment through github repo connection: automatic when pushed to main
## Environment
The site is static except for `/api/apply`, `/api/contact` and `/api/partner`, which run on the Worker: each verifies the Turnstile token, then sends the message through Resend. They share the same secrets and inbox. The apply form also has `/api/apply/upload` and `/api/apply/parse-status` for bank statements (below). The shared pieces (body parsing, secret checks, siteverify, Resend, bindings) live in `src/lib/server/`. Variables are listed in `.env.example`.

- **Local:** copy `.env.example` to `.env` (gitignored) and fill it in. Both `pnpm dev` and `pnpm build && pnpm preview` read it (the adapter hands the values to wrangler at build time).
- **Production build:** needs nothing. The Turnstile site key is public, so it is committed as the default in `astro.config.mjs`. A `PUBLIC_TURNSTILE_SITE_KEY` build variable overrides it.
- **Production runtime** (Worker → Settings → Variables and Secrets, type *Secret*, or `npx wrangler secret put <NAME>`): `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `LLAMA_CLOUD_API_KEY`, `SIGNING_ENCRYPTION_KEY`, `LOCATIONIQ_API_KEY`. Use secrets, not plain variables: plain dashboard variables are wiped on each deploy, and nothing belongs in `wrangler.jsonc` since the repo is on GitHub.

Until the runtime secrets are set, the endpoints return 500 and send nothing.

Submissions are capped per IP by the `FORM_RATE_LIMIT` rate limiting binding in `wrangler.jsonc` (2 per 60 s across the three submit endpoints; a third returns 429 and the form explains why). Statement uploads have their own `UPLOAD_RATE_LIMIT` (4 requests per 60 s) so re-picking files doesn't use up the submit budget, the statement status polls have `STATUS_RATE_LIMIT` (30 per 60 s), drop-off capture has `DRAFT_RATE_LIMIT` (12 per 60 s), the signing link's steps have `SIGN_RATE_LIMIT` (10 per 60 s), the contact reveal has `CONTACT_RATE_LIMIT` (12 per 60 s) and address suggestions have `ADDRESS_RATE_LIMIT` (60 per 60 s). The bindings are read through `cloudflare:workers` in `src/lib/server/bindings.ts`, so they are only active inside the Worker: `pnpm dev` runs unlimited, `pnpm build && pnpm preview` exercises them.

Response headers (HSTS, nosniff, referrer policy, permissions policy, and a Content Security Policy) are set in two places that must stay in step. `public/_headers` covers static files (the prerendered pages and assets); Cloudflare doesn't apply it to anything the Worker answers, so `src/middleware.ts` adds the same set to the admin pages, the signing page and the API routes from `src/lib/server/security-headers.ts`, where each CSP directive is explained. The policy allows no inline scripts, so `astro.config.mjs` stops Astro from inlining small ones. A new third-party script, frame or API called from the browser needs its origin added to the policy in both files. Under `pnpm dev` neither applies.

### Bank statements on the apply form
The apply page has an "Upload documents" area for bank statements (PDF, JPG, PNG; up to 6 files, 10 MB each, 20 MB together — `src/lib/upload-config.ts`). It does two jobs: the statements are attached to the application email, and what they say is read to pre-fill the legal business name (or first/last name for a personal account), the business address and the monthly revenue (average monthly deposits). Pre-filled fields are tinted and badged until the visitor edits them, and the email lists which ones were still pre-filled at submit.

Flow, per file (`src/pages/api/apply/upload.ts`):
1. Per-IP rate limit (`UPLOAD_RATE_LIMIT`, counted per request, not per file), then size caps and a magic-byte check of the actual bytes against the extension (`doc-extract/content-sniff.ts`); the browser's declared type is never trusted.
2. Turnstile, once per batch, only if something survived the free checks (a token is single-use).
3. One upload to LlamaCloud, then **Classify** on that file. Nothing is refused on its verdict: Classify reads only a PDF's text layer, so a photographed statement with a text watermark stamped on it comes back as "other". Its verdict is only logged and kept on the stored copy.
4. LlamaCloud **Extract** on every file (agentic tier, `doc-extract/schema.ts` for exactly what is asked) is submitted and its job id returned to the browser; it takes minutes, so the browser polls `/api/apply/parse-status?jobs=…`, which asks the provider and returns suggestions aggregated over every statement (`doc-extract/autofill.ts`). An extraction without a bank name and at least one month's deposits or balance is treated as unreadable and pre-fills nothing (`looksLikeStatement` in `doc-extract/llamacloud.ts`).

The page sends at most 4 files per upload request (`MAX_FILES_PER_UPLOAD`), so a pick of 5 or 6 goes up as two requests, each with its own Turnstile token. Each request may make at most `PROVIDER_CALLS_PER_REQUEST` provider calls (`doc-extract/config.ts`, 45). Classify takes 20–30 s per statement, about nine calls, so four files fit under the Workers Free limit of 50 external subrequests per request; files past the budget come back as "try again". On Workers Paid both limits can be raised.

5. A copy of each accepted file goes to the `DOCUMENTS` R2 bucket (`src/lib/server/documents.ts`) for the drop-off record below; the browser is told its document id.

The submission doesn't read those copies: the browser keeps the files (the page says to stay on it until submitting) and `/api/apply` is multipart, taking the same JSON as before in a `payload` field plus the files, which it re-validates (count, size, bytes) and attaches, adding a "Statements:" summary read from the provider by job id, not from the browser.

### Address suggestions on the apply form
The home and business address are one text field each (`src/components/AddressField.astro`). As the visitor types, the page asks `/api/address/suggest`, which asks LocationIQ's autocomplete API from the Worker (`src/lib/server/locationiq.ts`, US addresses only) and returns up to five matches written as one line, e.g. `265 Canal Street, New York, NY 10013`. Picking one puts that line in the field. Matches near the visitor are listed first, using the rough position Cloudflare attaches to the request (from their IP, no browser prompt). Nothing is validated: what's typed is kept whether or not a suggestion is picked, and a suite or unit is typed by hand. Without `LOCATIONIQ_API_KEY`, over quota (free plan: 5,000 requests a day, 2 a second) or on an outage, no suggestions show and the field is a plain text input. Details and what's left to do in `docs/address-autocomplete-checklist.md`.

### Drop-offs (unsubmitted applications)
The apply page saves what the visitor has typed as they go (`src/lib/apply-draft.ts`), so an abandoned application still reaches the team. Nothing is sent until a Turnstile check passes: the first save spends one token on `/api/apply/session`, which records the session's signals (IP from `CF-Connecting-IP`, country/city/ASN from `request.cf`, user agent, referrer, UTM) in the `DRAFTS_DB` D1 database and returns a draft id; later saves go to `/api/apply/draft` with that id (debounced, plus a `sendBeacon` when the page is hidden), capped by `DRAFT_RATE_LIMIT` (12 per 60 s). A successful `/api/apply` marks the session converted, or opens a converted one when the page never got as far as minting a session, so every sent application is listed. The same application (fields and statement bytes) can only be sent once: `/api/apply` claims its hash in `apply_submission` before emailing and answers 409 `duplicate_application` to a repeat. See `src/lib/server/drafts.ts`.

Retention is set in the `app_setting` table (defaults: unsubmitted drafts 30 days after their last save, converted sessions 90 days, at most 5000 unsubmitted drafts, beyond which the oldest without an email or mobile go first) and applied lazily: a purge pass runs at most hourly, triggered by new sessions and admin page loads, and deletes each session's stored statements with it. Changing a setting re-scopes existing rows on the next pass.

One-time setup (production), then `pnpm migrate:remote` after any schema change:
```sh
npx wrangler r2 bucket create ventra-fund-documents
# Backstop for statement copies no session ever claimed; keep it above the longest retention setting.
npx wrangler r2 bucket lifecycle add ventra-fund-documents apply-backstop apply/ --expire-days 180
pnpm migrate:remote
```
Locally, `pnpm migrate:local` before `pnpm build && pnpm preview`. Under local preview `CF-Connecting-IP` and `request.cf` are absent, so those columns stay empty. Under `pnpm dev` there are no bindings and capture is off.

Without `LLAMA_CLOUD_API_KEY` the upload area reports uploads as unavailable and the form still submits without statements. To test locally, use `pnpm build && pnpm preview` with `.env` filled in.

### Decisions and e-signatures
An application's admin page (`/admin/drop-offs/<id>`) has a **Decision** section: approve or decline, with a reason written in the rich-text editor (required to decline, sanitized like the contact form's message). Approving emails the applicant a personal signing link (`/sign/<token>`, 14 days, `SIGNING_LINK_TTL_DAYS` in `src/lib/signing-config.ts`); approving again, resending or declining revokes the earlier link. Once signed, the decision is final. Logic in `src/lib/server/signing.ts`, schema in `migrations-drafts/0003_application_signing.sql`.

The signing page works like a DocuSign envelope, in two steps posted to `/api/sign/<token>`:
1. The electronic records and signatures disclosure (ESIGN), accepted on its own and timestamped.
2. The application details to confirm or correct, the business EIN and the signer's SSN, the attestation, and a typed name drawn in a cursive face (Dancing Script) as the signature.

Stored with the signature: what was confirmed (the admin page marks anything changed from the application), the signer's IP, browser, location, the disclosure and sign times, the terms version, and a SHA-256 over all of it plus the exact texts agreed to. Every step (sent, opened, disclosure accepted, signed, link revoked, identifiers revealed) goes into an audit trail with its time and origin, shown under the signature. The EIN and SSN are encrypted with AES-GCM under `SIGNING_ENCRYPTION_KEY` before they're written; the admin page shows the last four digits, and **Reveal** decrypts them, logging which admin did. The link token itself is never stored, only its hash. Decided applications are kept out of the retention purge.

Signing sends the applicant a receipt and the team inbox a notice. The disclosure and attestation wording in `src/lib/signing-config.ts` is a starting point; have it reviewed, and bump `SIGNING_TERMS_VERSION` whenever it changes.

### Dev vs. build
`astro.config.mjs` only attaches the `@astrojs/cloudflare` adapter for `astro build`/`astro preview`, not `astro dev`. Local dev runs on plain Node/Vite instead of the adapter's workerd emulation, which sidesteps an upstream dev-server bug where a dependency only reachable from an on-demand route (e.g. `free-email-domains` via `/partner`) gets discovered lazily and crashes the runner ([withastro/astro#17921](https://github.com/withastro/astro/issues/17921)). The rate limiters degrade to "unlimited" when absent, so `pnpm dev` behaves the same apart from that. To exercise anything binding-specific, use `pnpm build && pnpm preview` (or `wrangler dev`), not `pnpm dev`.

### Images
The adapter is set to `imageService: "compile"`: images are optimized once at build time and served as plain static files. The alternative, the Cloudflare Images binding, transforms on request, so the first load of each image size waits on the transform before it is cached. Only switch to it if a server-rendered page ever needs runtime resizing; static pages gain nothing from it.
