-- Decisions on applications and the e-signature flow that follows an approval
-- (src/lib/server/signing.ts). A decided application is kept out of the retention purge
-- (src/lib/server/drafts.ts), so the cascades below only matter for a manual delete.

-- One row per application an admin has decided on; a later decision overwrites it.
create table "application_decision" (
  "draft_id" text not null primary key references "apply_draft" ("id") on delete cascade,
  "decision" text not null check ("decision" in ('approved', 'declined')),
  -- Sanitized rich text (src/lib/sanitize.ts), '' when none was given.
  "reason_html" text not null default '',
  "decided_by" text not null,
  "decided_at" integer not null
);

-- One row per signing link sent. Approving again, resending or declining revokes the pending one,
-- so an application has at most one live link. The link's token is never stored, only its SHA-256.
create table "signing_request" (
  "id" text not null primary key,
  "draft_id" text not null references "apply_draft" ("id") on delete cascade,
  "token_hash" text not null unique,
  "email" text not null,
  "status" text not null default 'pending' check ("status" in ('pending', 'signed', 'revoked')),
  "created_at" integer not null,
  "created_by" text not null,
  "expires_at" integer not null,
  "email_sent_at" integer,
  -- The application fields as they stood when the link was sent: what the signer is asked to confirm.
  "prefill_json" text not null,

  -- When the signer accepted the electronic records and signatures disclosure (a step of its own).
  "consented_at" integer,

  -- The signature, written once, when status becomes 'signed'.
  "signed_at" integer,
  -- The application fields as the signer confirmed (and possibly corrected) them.
  "confirmed_json" text,
  -- AES-GCM ciphertexts (SIGNING_ENCRYPTION_KEY); the last four digits are kept apart for display.
  "ein_enc" text,
  "ein_last4" text,
  "ssn_enc" text,
  "ssn_last4" text,
  "signer_name" text,
  "signature_font" text,
  "terms_version" text,
  "signer_ip" text,
  "signer_ua" text,
  "signer_country" text,
  "signer_city" text,
  -- SHA-256 over everything above that was signed, disclosure texts included (see signing.ts).
  "document_hash" text
);

create index "signing_request_draft_idx" on "signing_request" ("draft_id", "created_at");

-- The audit trail: every step of a signing request, with where it came from. `actor` is the admin
-- for admin-side events (sent, revoked, revealed); signer events carry the signer's IP and browser.
create table "signing_event" (
  "id" integer primary key autoincrement,
  "request_id" text not null references "signing_request" ("id") on delete cascade,
  "type" text not null check ("type" in ('sent', 'send_failed', 'viewed', 'consented', 'signed', 'revoked', 'revealed')),
  "at" integer not null,
  "actor" text,
  "ip" text,
  "ua" text,
  "country" text,
  "city" text
);

create index "signing_event_request_idx" on "signing_event" ("request_id", "at");
