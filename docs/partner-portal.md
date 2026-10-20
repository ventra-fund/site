# Partner (ISO) portal

The portal where ISOs and brokers submit deals, upload files, track status, price deals and
read partner-only material. This document is the build reference: the decisions behind the
prototype under `src/pages/partner/` and the architecture the email intake and the API will be
built on.

**Status:** UX prototype. Every `/partner/*` page is prerendered from `src/data/portal-fixtures.ts`
with no auth, database or bindings. Nothing in it saves or sends. The admin-side previews live at
`/partner/admin-preview/*` for the same reason.

## Decisions

- **Inbound channels for release 1:** portal form, email intake, API with keys. All three end in
  one `createSubmission()` (below), so the channel is only a `source` on the deal.
- **Deals are emailed to underwriting** for now; there is no admin pipeline. v1 uses the statuses
  `received`, `needs_details`, `in_review`; the full enum is defined so the API contract is stable.
- **Resources are gated** behind partner sign-in, unlike Credibly's public hub.
- **Sign-in:** email one-time code by default (the admin flow, `src/lib/server/auth.ts`). A user can
  turn on password + code, or passkeys, from Settings. A password never turns the code off.
- **Commission model:** buy rate per paper grade (B 1.32, C 1.36), partner upsell up to 12 points,
  1 point = 1% of the funded amount paid as commission. `src/data/commission-plan.ts` is the single
  implementation. Per-organisation plans override the default from an admin session.
- **The Worker stays on Workers Free.** 10 ms CPU per invocation, 50 external subrequests. Every
  server step is I/O-shaped (D1, R2, Resend); anything CPU-heavy is done by a vendor, as the apply
  form already does with the document provider. This rules out parsing email in the Worker.
- **Email intake vendor: Resend inbound,** not Cloudflare Email Routing. Email Routing hands the
  Worker the raw MIME message, and base64-decoding 5 to 20 MB of statements is CPU the free plan
  does not have (Cloudflare's docs say handlers on the free plan may fail with `EXCEEDED_CPU`).
  Resend parses on its side and the webhook hands over download URLs; the Worker streams each
  into R2. Resend keeps received mail 30 days; R2 is the store. Resend receiving needs an MX
  record, so the intake address lives on a subdomain if ventrafund.com mail is elsewhere.

## One intake pipeline, three adapters

```
portal form   POST /api/partner/deals          session + active org
email         POST /api/webhooks/resend         sender ∈ org members, or the org's alias
API           POST /api/v1/submissions          org-owned API key
                      └──► createSubmission({ source, organizationId, submittedBy, fields, files })
                                └─ deal row · storeDealFile() per file · deal_event · email to underwriting
```

Email behaviour: each org has an alias (`deals+<slug>@submit.ventrafund.com`) and its active
members are the accepted senders. A recognised email creates a deal in `needs_details` with the
attachments, auto-replies with the deal number and a link to finish, and the partner completes the
fields in the portal. An unrecognised sender is held in the admin intake queue, never dropped.

## Auth and tenancy

One Better Auth instance, extended:

- `organization` plugin. An ISO is an organisation; roles `owner`, `admin`, `member`. Custom
  statements: `deal` (create, read, update, withdraw), `file` (upload, read), `commission` (read),
  `apiKey` (create, read, delete), `member` (invite, update, remove). Members see only deals they
  submitted; admins and owners see the org's.
- A user `kind` (`admin` | `partner`). The `user.create` hook allows admins by the `ADMIN_EMAILS`
  allowlist and partners only through an accepted invitation. `AUTH_PATHS` grows to the
  organization, invitation, api-key, passkey and password endpoints the portal uses.
- `passkey` plugin and `emailAndPassword` as per-user opt-ins; the OTP always follows a password.
  Remember-device 30 days.
- `src/middleware.ts` gains a `/partner/*` and `/api/partner/*` guard beside the admin one, setting
  `locals.partnerSession` (user, active org, role). Sign-in page `/partner/login`.

## API

Mirrors the vocabulary broker CRMs already integrate against (Credibly, Kapitus, BriteCap via
Cloudsquare), with simpler auth. The contract is `src/data/openapi-v1.json`, rendered at
`/partner/developers/docs` and to be served at `/api/v1/openapi.json`.

- `Authorization: Bearer vf_live_…` / `vf_test_…`. Keys from `@better-auth/api-key` with
  `references: "organization"`, hashed at rest, shown once, scoped, optional expiry, rotation.
- `POST /v1/submissions` (+ `Idempotency-Key`), `GET /v1/submissions`, `GET|PATCH /v1/submissions/{id}`,
  `GET …/status`, `POST …/withdraw`, `GET|POST …/documents` (multipart or URL, one file per request),
  `GET …/offers`, `POST …/offers/{id}/select`, `GET|POST /v1/webhook-endpoints`, `DELETE|POST …/test`.
- Webhooks `submission.status_changed`, `offer.created`, `stip.requested`. Header
  `X-Ventra-Signature: t=<unix>,v1=<HMAC-SHA256(secret, "<t>.<body>")>`, `X-Ventra-Event-Id`;
  retried with backoff for 24 h; delivery log in the portal.
- Rate limits: an `API_RATE_LIMIT` binding keyed on the key id (not IP), 60/min, plus a 10/min
  `API_UPLOAD_RATE_LIMIT`. Workers limits are per-colo and permissive: cost protection, not accounting.

## Data model

New D1 `PORTAL_DB` (`migrations-portal/`), raw SQL like `drafts.ts`, zod like `apply-schema.ts`.
Organisation, member, invitation and apiKey tables come from the Better Auth plugins in `AUTH_DB`.

| table | columns (abridged) |
|---|---|
| `partner_org` | org id, legal name, EIN (encrypted), w9 received at, agreement signed at, RM, inbound alias, status applied/active/suspended |
| `commission_plan` | org id (null = default), buy rates JSON, max upsell points, renewal points, clawback days, payout timing |
| `deal` | id, number, org id, submitted_by, source portal/email/api, status, dba, legal name, EIN (encrypted), product, amount requested, paper grade, fields JSON, external ref, decline reasons JSON, created/updated |
| `deal_file` | id, deal id, org id, r2 key, original name, mime, bytes, etag, kind, uploaded_by, source, status stored/duplicate/rejected |
| `deal_event` | deal id, type, actor, payload JSON, at |
| `stip` | deal id, short text, long text, status open/received/cleared |
| `offer` | deal id, product, amount, grade, points, term, frequency, status, expires at |
| `webhook_endpoint` | org id, url, secret hash, events JSON, status |
| `webhook_delivery` | endpoint id, event id, event, deal id, attempts, response code, status, next attempt at |
| `intake_email` | resend email id, message id, from, to, org id?, deal id?, status matched/unmatched/rejected, received at |
| `resource` | slug, title, description, category, kind, r2 key, audience, updated at |

Status enum: `received`, `needs_details`, `in_review`, `on_hold`, `offers_ready`, `offer_selected`,
`contracts_out`, `final_diligence`, `funded`, `declined`, `withdrawn`.

## Files in R2

- Keys `partners/<orgId>/deals/<dealId>/<fileId>`; random ids, never the original name. Name,
  mime and size live in `deal_file`. The bucket is private; files are served only through
  `/api/partner/files/<id>` (org check) and `/api/admin/files/<id>`.
- Uploads go through the Worker one file per request (`readMultipart` caps), content-sniffed with
  `doc-extract/content-sniff.ts` (PDF, JPG, PNG by magic bytes, a few bytes of CPU). The same path
  stores Resend attachment URLs (streamed `fetch().body` → `R2.put()`) and API uploads.
- Duplicate detection by R2's etag (MD5 computed by R2 on single-part puts), not a hash in the
  Worker. Objects are immutable; a replacement is a new file id.
- Retention: funded-deal files kept; declined/withdrawn purged after a configurable window with
  the `drafts.ts` purge pattern. R2's encryption at rest is enough; per-object AES-GCM only if a
  field-level requirement appears.

## UX (what the prototype shows)

`/partner/login`, then a sidebar portal: Dashboard (KPIs, needs-your-action, activity, RM card),
Deals (stage stepper, filters, next-action column), Deal detail (status banner, merchant, files
with required-docs checklist and stips, offers with commission, timeline, notes), Submit (five
steps with a localStorage draft) and Quick package (email-shaped), Commission calculator (live,
side-by-side table), Partner terms, Resources, Team, Developers (keys shown once, webhooks with
delivery log, email intake with accepted senders), Settings (sign-in method opt-ins), Help.
Admin previews: partner approvals and plan editing, intake queue.

## Next phases

1. Auth: organization, api-key, passkey, email-and-password plugins; invitations; middleware guard.
2. `PORTAL_DB` migrations and `createSubmission()`; portal submit and file routes; underwriting email.
3. Resend inbound webhook route and the intake queue.
4. `/api/v1/*` and outbound webhooks; serve `openapi.json`.
5. Admin pages for real: partners, plans, intake, resources.
