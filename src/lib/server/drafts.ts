import { getBinding } from './bindings';
import { deleteDocuments, getDocumentBucket, listDocuments, type R2Bucket } from './documents';
import { DRAFT_FIELDS, type DraftField } from '@/lib/draft-config';

// Drop-off capture for /apply: what a visitor typed before (or without) submitting, kept in the
// DRAFTS_DB D1 database (schema in migrations-drafts/). A row is created only by
// /api/apply/session, after a Turnstile check, and its id (a server-minted v4 UUID, 122 random
// bits, only ever told to that browser) is the whole capability for writing to it afterwards.
//
// Retention is decided at purge time, not stored per row: `purgeExpired` reads the settings in
// app_setting and deletes whatever is past them, so changing a setting re-scopes every existing
// row on the next pass. There is no cron; the purge piggybacks on session mints and admin page
// loads and throttles itself to one pass an hour.
//
// Outside the Worker (`pnpm dev`) there is no binding: `getDraftDb` resolves undefined and every
// caller treats that as "capture off". Capture must never cost an applicant their submission.

// The slice of the D1 API used here. The full `wrangler types` output is not pulled in because
// its globals collide with the DOM types the page scripts rely on (html-rewriter.d.ts).
interface D1Result<T> {
  results: T[];
  meta: { changes: number };
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result<unknown>[]>;
}

export type DraftDb = D1Database;

export const getDraftDb = () => getBinding<D1Database>('DRAFTS_DB');

const now = () => Math.floor(Date.now() / 1000);
const DAY = 86_400;

// ── Settings ───────────────────────────────────────────────────────────────────────────────

export interface DraftSettings {
  /** Days an unsubmitted draft is kept after its last save. */
  baseTtlDays: number;
  /** Days a submitted application nobody has decided on is kept after it was submitted. */
  convertedTtlDays: number;
  /** Above this many unsubmitted drafts, the oldest ones without contact details go first. */
  maxDraftRows: number;
}

/**
 * The shortest a submitted application may be kept: 12 months, the record retention period for
 * business credit applications under the Equal Credit Opportunity Act (Regulation B, 12 CFR
 * § 1002.12). A day over 365 so a leap year is covered. Published in the privacy policy
 * (src/pages/privacy.astro, "How long we keep it"); change the two together.
 */
export const APPLICATION_RETENTION_DAYS = 366;
/** Days a stored statement no session ever claimed is kept before the purge deletes it. */
export const UNCLAIMED_DOCUMENT_DAYS = 30;

const DEFAULT_SETTINGS: DraftSettings = { baseTtlDays: 30, convertedTtlDays: APPLICATION_RETENTION_DAYS, maxDraftRows: 5000 };

const SETTING_KEYS: Record<keyof DraftSettings, string> = {
  baseTtlDays: 'base_ttl_days',
  convertedTtlDays: 'converted_ttl_days',
  maxDraftRows: 'max_draft_rows',
};

/**
 * Bounds a stored or submitted value must sit in; anything outside falls back to the default (so
 * a `converted_ttl_days` saved under the old 90-day default reads as the 12-month minimum).
 * Submitted applications can be kept longer than the minimum, never shorter.
 */
export const SETTING_BOUNDS: Record<keyof DraftSettings, [number, number]> = {
  baseTtlDays: [1, 90],
  convertedTtlDays: [APPLICATION_RETENTION_DAYS, 3650],
  maxDraftRows: [100, 100_000],
};

const UPSERT_SETTING = 'insert into "app_setting" ("key", "value") values (?, ?) on conflict ("key") do update set "value" = excluded."value"';
const LAST_PURGE_KEY = 'last_purge_at';
/** Where the unclaimed-statement sweep left off in the bucket listing; '' starts over. */
const UNCLAIMED_CURSOR_KEY = 'unclaimed_cursor';
/** Stored statements looked at per pass. */
const UNCLAIMED_PAGE = 200;
const PURGE_INTERVAL = 3600;
// D1 binds at most 100 parameters per statement, and the delete binds one per row.
const PURGE_BATCH = 100;

function clampSetting(key: keyof DraftSettings, raw: unknown): number {
  const n = Number(raw);
  const [min, max] = SETTING_BOUNDS[key];
  return Number.isInteger(n) && n >= min && n <= max ? n : DEFAULT_SETTINGS[key];
}

/** Current retention settings; code defaults fill anything never set, so nothing needs seeding. */
export async function getSettings(db: D1Database): Promise<DraftSettings> {
  const { results } = await db.prepare('select "key", "value" from "app_setting"').all<{ key: string; value: string }>();
  const stored = new Map(results.map((r) => [r.key, r.value]));
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(SETTING_KEYS) as (keyof DraftSettings)[]) {
    if (stored.has(SETTING_KEYS[key])) settings[key] = clampSetting(key, stored.get(SETTING_KEYS[key]));
  }
  return settings;
}

export async function saveSettings(db: D1Database, settings: DraftSettings): Promise<void> {
  await db.batch(
    (Object.keys(SETTING_KEYS) as (keyof DraftSettings)[]).map((key) =>
      db.prepare(UPSERT_SETTING).bind(SETTING_KEYS[key], String(clampSetting(key, settings[key]))),
    ),
  );
}

// ── Sessions and snapshots ─────────────────────────────────────────────────────────────────

export interface SessionSignals {
  ip: string | null;
  ua: string | null;
  referrer: string | null;
  utm: { source?: string; medium?: string; campaign?: string };
  cf: Record<string, unknown> | undefined;
}

interface DraftSnapshot {
  fields: Partial<Record<DraftField, string>>;
  autofilled: string[];
  jobIds: string[];
  /** Stored statement copies (documents.ts). Left as stored when absent. */
  documentIds?: string[];
}

const str = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Mint a session row and return its id, the capability the browser saves with from now on. */
export async function createDraft(db: D1Database, signals: SessionSignals): Promise<string> {
  const id = crypto.randomUUID();
  const t = now();
  // request.cf may be missing, or hold placeholders, under local preview: every column is nullable.
  const cf = signals.cf;
  await db
    .prepare(
      `insert into "apply_draft" ("id", "created_at", "last_active_at", "ip", "country", "region", "city", "asn", "as_org",
        "ua", "referrer", "utm_source", "utm_medium", "utm_campaign", "fields_total")
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id, t, t, signals.ip,
      str(cf?.country), str(cf?.region), str(cf?.city), num(cf?.asn), str(cf?.asOrganization),
      signals.ua, signals.referrer,
      signals.utm.source ?? null, signals.utm.medium ?? null, signals.utm.campaign ?? null,
      DRAFT_FIELDS.length,
    )
    .run();
  return id;
}

/** Keep only non-empty values of known fields. */
function cleanFields(fields: DraftSnapshot['fields']): Partial<Record<DraftField, string>> {
  const out: Partial<Record<DraftField, string>> = {};
  for (const name of DRAFT_FIELDS) {
    const value = fields[name]?.trim();
    if (value) out[name] = value;
  }
  return out;
}

function snapshotColumns(snapshot: DraftSnapshot, t: number) {
  const fields = cleanFields(snapshot.fields);
  const names = Object.keys(fields);
  return {
    fieldsJson: JSON.stringify(fields),
    autofilledJson: JSON.stringify(snapshot.autofilled),
    jobIdsJson: JSON.stringify(snapshot.jobIds),
    documentIdsJson: snapshot.documentIds ? JSON.stringify(snapshot.documentIds) : null,
    completed: names.length,
    hasContact: fields.email || fields.mobile ? 1 : 0,
    // Timestamps for the fields present now; merged under the stored ones so the first sighting wins.
    progressJson: JSON.stringify(Object.fromEntries(names.map((n) => [n, t]))),
  };
}

/** Write a snapshot over an open draft, converting it when `convert`. True when a row changed. */
async function writeSnapshot(db: D1Database, id: string, snapshot: DraftSnapshot, convert: boolean): Promise<boolean> {
  const t = now();
  const c = snapshotColumns(snapshot, t);
  const res = await db
    .prepare(
      `update "apply_draft" set ${convert ? `"status" = 'converted', "converted_at" = ?1,` : '"save_count" = "save_count" + 1,'}
        "last_active_at" = ?1, "fields_json" = ?2, "autofilled_json" = ?3, "job_ids_json" = ?4,
        "document_ids_json" = coalesce(?5, "document_ids_json"), "fields_completed" = ?6, "has_contact" = ?7,
        "field_progress_json" = json_patch(?8, "field_progress_json")
       where "id" = ?9 and "status" = 'draft'`,
    )
    .bind(t, c.fieldsJson, c.autofilledJson, c.jobIdsJson, c.documentIdsJson, c.completed, c.hasContact, c.progressJson, id)
    .run();
  return res.meta.changes > 0;
}

/**
 * Overwrite the snapshot of an open draft. False when there is no such open draft (never minted,
 * already converted, or purged): the browser should stop saving.
 */
export const saveDraft = (db: D1Database, id: string, snapshot: DraftSnapshot) => writeSnapshot(db, id, snapshot, false);

/**
 * Record a sent application, with what was actually sent (the last debounced save may lag it).
 * Closes the page's open draft when there is one; otherwise (capture hadn't minted a session yet,
 * the draft was purged, or it was already closed by an earlier application from the same page)
 * a session is opened for it here, so every application reaches the dashboard.
 */
export async function recordSubmission(db: D1Database, draftId: string | undefined, snapshot: DraftSnapshot, signals: SessionSignals): Promise<void> {
  if (draftId && (await writeSnapshot(db, draftId, snapshot, true))) return;
  await writeSnapshot(db, await createDraft(db, signals), snapshot, true);
}

// ── Duplicate guard ────────────────────────────────────────────────────────────────────────

/**
 * Claim an application's content hash before it is sent. False when the same application was
 * already sent (and is still within convertedTtlDays); the unique key makes concurrent sends of
 * the same one race safely, exactly one wins.
 */
export async function claimSubmission(db: D1Database, hash: string): Promise<boolean> {
  const res = await db
    .prepare('insert into "apply_submission" ("hash", "created_at") values (?, ?) on conflict ("hash") do nothing')
    .bind(hash, now())
    .run();
  return res.meta.changes > 0;
}

/** Give a claim back when the application didn't go out after all, so it can be retried. */
export async function releaseSubmission(db: D1Database, hash: string): Promise<void> {
  await db.prepare('delete from "apply_submission" where "hash" = ?').bind(hash).run();
}

export type DraftStatus = 'draft' | 'converted';

// ── Admin reads ────────────────────────────────────────────────────────────────────────────

interface FunnelStats {
  sessions: number;
  started: number;
  withContact: number;
  converted: number;
}

/** Funnel counts over sessions opened in the last `days` days. */
export async function getFunnel(db: D1Database, days: number): Promise<FunnelStats> {
  const row = await db
    .prepare(
      `select count(*) as "sessions", coalesce(sum("fields_completed" > 0), 0) as "started",
        coalesce(sum("has_contact"), 0) as "withContact", coalesce(sum("status" = 'converted'), 0) as "converted"
       from "apply_draft" where "created_at" >= ?`,
    )
    .bind(now() - days * DAY)
    .first<FunnelStats>();
  return row ?? { sessions: 0, started: 0, withContact: 0, converted: 0 };
}

interface DraftListRow {
  id: string;
  created_at: number;
  last_active_at: number;
  status: DraftStatus;
  ip: string | null;
  country: string | null;
  city: string | null;
  as_org: string | null;
  fields_completed: number;
  fields_total: number;
  has_contact: number;
  business: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  documents: number;
  /** Sessions from the same IP, this one included. */
  ip_sessions: number;
  /** 1 once the application's signing link has been completed. */
  signed: number;
}

interface DraftListQuery {
  status?: DraftStatus;
  ip?: string;
  page: number;
}

const DRAFT_PAGE_SIZE = 50;

/** Newest activity first; one page, plus whether there's another. */
export async function listDrafts(db: D1Database, q: DraftListQuery): Promise<{ rows: DraftListRow[]; more: boolean }> {
  const where: string[] = [];
  const binds: unknown[] = [];
  if (q.status) { where.push('a."status" = ?'); binds.push(q.status); }
  if (q.ip) { where.push('a."ip" = ?'); binds.push(q.ip); }
  const { results } = await db
    .prepare(
      `select a."id", a."created_at", a."last_active_at", a."status", a."ip", a."country", a."city", a."as_org",
        a."fields_completed", a."fields_total", a."has_contact",
        json_extract(a."fields_json", '$.legalBusinessName') as "business",
        json_extract(a."fields_json", '$.firstName') as "first_name",
        json_extract(a."fields_json", '$.lastName') as "last_name",
        json_extract(a."fields_json", '$.email') as "email",
        json_array_length(a."document_ids_json") as "documents",
        case when a."ip" is null then 1 else (select count(*) from "apply_draft" b where b."ip" = a."ip") end as "ip_sessions",
        exists (select 1 from "signing_request" s where s."draft_id" = a."id" and s."status" = 'signed') as "signed"
       from "apply_draft" a ${where.length ? `where ${where.join(' and ')}` : ''}
       order by a."last_active_at" desc limit ? offset ?`,
    )
    .bind(...binds, DRAFT_PAGE_SIZE + 1, q.page * DRAFT_PAGE_SIZE)
    .all<DraftListRow>();
  return { rows: results.slice(0, DRAFT_PAGE_SIZE), more: results.length > DRAFT_PAGE_SIZE };
}

interface DraftRow {
  id: string;
  created_at: number;
  last_active_at: number;
  status: DraftStatus;
  converted_at: number | null;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  asn: number | null;
  as_org: string | null;
  ua: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  fields_json: string;
  autofilled_json: string;
  job_ids_json: string;
  document_ids_json: string;
  save_count: number;
  fields_completed: number;
  fields_total: number;
  has_contact: number;
  field_progress_json: string;
}

export async function getDraft(db: D1Database, id: string): Promise<DraftRow | null> {
  return db.prepare('select * from "apply_draft" where "id" = ?').bind(id).first<DraftRow>();
}

// ── Retention ──────────────────────────────────────────────────────────────────────────────

/**
 * Delete what the current settings say is past its time. Throttled to one pass an hour across the
 * fleet via app_setting, and bounded per pass, so it is safe to fire from any request. Never throws.
 */
export async function purgeExpired(db: D1Database): Promise<void> {
  try {
    const t = now();
    // Claim the pass before the work, in one statement: the upsert only lands when the last pass
    // is an interval old, so of concurrent requests in the same window exactly one proceeds.
    const claim = await db
      .prepare(`${UPSERT_SETTING} where cast("app_setting"."value" as integer) <= ?`)
      .bind(LAST_PURGE_KEY, String(t), t - PURGE_INTERVAL)
      .run();
    if (!claim.meta.changes) return;

    const [s, bucket] = await Promise.all([getSettings(db), getDocumentBucket()]);
    const [drafts, converted] = await Promise.all([
      purgeRows(db, bucket, `"status" = 'draft' and "last_active_at" < ?`, [t - s.baseTtlDays * DAY]),
      purgeRows(db, bucket, `"status" = 'converted' and "converted_at" < ?`, [t - s.convertedTtlDays * DAY]),
    ]);
    // Duplicate-guard claims live as long as the converted sessions they stand beside.
    await db.prepare('delete from "apply_submission" where "created_at" < ?').bind(t - s.convertedTtlDays * DAY).run();

    // Volume valve: over the cap, drafts nobody could follow up on (no email or mobile) go first.
    const count = await db.prepare(`select count(*) as "n" from "apply_draft" where "status" = 'draft'`).first<{ n: number }>();
    const excess = (count?.n ?? 0) - s.maxDraftRows;
    const evicted = excess > 0
      ? await purgeRows(db, bucket, `"status" = 'draft' and "has_contact" = 0 order by "last_active_at"`, [], Math.min(excess, PURGE_BATCH))
      : 0;
    const unclaimed = bucket ? await purgeUnclaimedDocuments(db, bucket, t) : 0;
    const total = drafts + converted + evicted;
    if (total || unclaimed) console.log(`[drafts] purged ${total} (expired drafts ${drafts}, converted ${converted}, over cap ${evicted}), unclaimed statements ${unclaimed}`);
  } catch (err) {
    console.error('[drafts] purge failed', err);
  }
}

/**
 * Delete stored statements no session lists: an upload whose application was never saved or sent.
 * Walks the bucket one page per pass (the cursor is kept in app_setting) and only touches copies
 * older than UNCLAIMED_DOCUMENT_DAYS, long after the page that uploaded them could still claim
 * them. A statement any session lists, decided or not, is left alone: it goes when its session does.
 */
async function purgeUnclaimedDocuments(db: D1Database, bucket: R2Bucket, t: number): Promise<number> {
  const stored = await db.prepare('select "value" from "app_setting" where "key" = ?').bind(UNCLAIMED_CURSOR_KEY).first<{ value: string }>();
  const page = await listDocuments(bucket, UNCLAIMED_PAGE, stored?.value || undefined);
  const old = page.documents.filter((d) => d.uploadedAt < t - UNCLAIMED_DOCUMENT_DAYS * DAY).map((d) => d.id);

  const claimed = new Set<string>();
  // One bound id per condition, well under D1's 100-parameter cap.
  for (let i = 0; i < old.length; i += 50) {
    const chunk = old.slice(i, i + 50);
    const { results } = await db
      .prepare(`select "document_ids_json" from "apply_draft" where ${chunk.map(() => 'instr("document_ids_json", ?) > 0').join(' or ')}`)
      .bind(...chunk)
      .all<{ document_ids_json: string }>();
    for (const r of results) for (const id of parseIds(r.document_ids_json)) claimed.add(id);
  }
  const unclaimed = old.filter((id) => !claimed.has(id));
  if (unclaimed.length) await deleteDocuments(bucket, unclaimed);
  await db.prepare(UPSERT_SETTING).bind(UNCLAIMED_CURSOR_KEY, page.cursor ?? '').run();
  return unclaimed.length;
}

/**
 * Delete up to `limit` sessions matching `where`, their stored statements first: if the bucket
 * refuses, the rows stay and the next pass tries again rather than orphaning the files. An
 * application an admin has decided on is never purged: the privacy policy promises at least 12
 * months after the decision (APPLICATION_RETENTION_DAYS) and, once signed, at least 7 years
 * (src/lib/server/signing.ts), and keeping it without an end date meets both.
 */
async function purgeRows(db: D1Database, bucket: R2Bucket | undefined, where: string, binds: unknown[], limit = PURGE_BATCH): Promise<number> {
  const { results } = await db
    .prepare(`select "id", "document_ids_json" from "apply_draft" where "id" not in (select "draft_id" from "application_decision") and ${where} limit ?`)
    .bind(...binds, limit)
    .all<{ id: string; document_ids_json: string }>();
  if (!results.length) return 0;
  if (bucket) {
    const docIds = results.flatMap((r) => parseIds(r.document_ids_json));
    if (docIds.length) await deleteDocuments(bucket, docIds);
  }
  const ids = results.map((r) => r.id);
  await db.prepare(`delete from "apply_draft" where "id" in (${ids.map(() => '?').join(', ')})`).bind(...ids).run();
  return ids.length;
}

/** A JSON-object column, or {} when it isn't one. */
export function parseObject(raw: string): Record<string, unknown> {
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function parseIds(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
