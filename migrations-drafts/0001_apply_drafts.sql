-- Drop-off capture for /apply (src/lib/server/drafts.ts). One row per verified visitor session:
-- the last snapshot of what they typed, the signals it arrived with, and funnel progress. Rows
-- are purged lazily against the retention settings in app_setting, so there is no expiry column.

create table "apply_draft" (
  "id" text not null primary key,
  "created_at" integer not null,
  "last_active_at" integer not null,
  "status" text not null default 'draft' check ("status" in ('draft', 'converted')),
  "converted_at" integer,

  -- Recorded once, when the session is minted. All nullable: CF-Connecting-IP and request.cf are
  -- absent (or placeholders) under local preview.
  "ip" text,
  "country" text,
  "region" text,
  "city" text,
  "asn" integer,
  "as_org" text,
  "ua" text,
  "referrer" text,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,

  -- Last-write-wins snapshot, kept after conversion too.
  "fields_json" text not null default '{}',
  "autofilled_json" text not null default '[]',
  "job_ids_json" text not null default '[]',
  "document_ids_json" text not null default '[]',

  "save_count" integer not null default 0,
  "fields_completed" integer not null default 0,
  "fields_total" integer not null default 13,
  "has_contact" integer not null default 0,
  -- {fieldName: unix seconds it was first seen non-empty}
  "field_progress_json" text not null default '{}'
);

create index "apply_draft_status_active_idx" on "apply_draft" ("status", "last_active_at");
create index "apply_draft_ip_idx" on "apply_draft" ("ip");

create table "app_setting" (
  "key" text not null primary key,
  "value" text not null
);
