-- Duplicate guard for /api/apply (src/lib/server/drafts.ts): one row per application sent, keyed
-- by a hash of its fields and statement bytes. Claimed before the email goes out, released if
-- sending fails, and purged with converted sessions (convertedTtlDays), so the same application
-- can't be sent twice while its record is kept.

create table "apply_submission" (
  "hash" text not null primary key,
  "created_at" integer not null
);

create index "apply_submission_created_idx" on "apply_submission" ("created_at");
