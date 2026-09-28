import type { DraftDb } from './drafts';
import { ESIGN_DISCLOSURE, SIGNATURE_ADOPTION, SIGNATURE_FONT, SIGNING_ATTESTATION, SIGNING_LINK_TTL_DAYS, SIGNING_TERMS_VERSION } from '@/lib/signing-config';
import type { ConfirmedFields } from '@/lib/signing-schema';

// Decisions on applications and the e-signature flow an approval starts (schema in
// migrations-drafts/0003_application_signing.sql, same DRAFTS_DB database as the applications).
//
// Approving creates a signing request and emails its link. The link carries a random token; only
// the token's SHA-256 is stored, so the table alone can't be used to sign. The signer first
// accepts the e-sign disclosure (recorded on its own), then confirms the application fields, gives
// an EIN and SSN, and adopts a typed signature. The EIN and SSN are encrypted with AES-GCM under
// SIGNING_ENCRYPTION_KEY before they are written; the admin page shows the last four digits and
// decrypts the rest only on an explicit, logged reveal.
//
// Every step lands in signing_event with the time and, for the signer's steps, their IP, browser
// and location: the audit trail shown on the admin page next to the signature.

const now = () => Math.floor(Date.now() / 1000);
const DAY = 86_400;

// ── Request signals ───────────────────────────────────────────────────────────────────────────

/** Where a request came from, as recorded against signer events. */
export interface Signals {
  ip: string | null;
  ua: string | null;
  country: string | null;
  city: string | null;
}

export function signalsOf(request: Request): Signals {
  const cf = (request as Request & { cf?: Record<string, unknown> }).cf;
  const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
  return {
    ip: request.headers.get('CF-Connecting-IP'),
    ua: request.headers.get('User-Agent')?.slice(0, 500) ?? null,
    country: str(cf?.country),
    city: str(cf?.city),
  };
}

// ── Crypto ────────────────────────────────────────────────────────────────────────────────────

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (text: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toBase64Url = (bytes: Uint8Array) => toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** A fresh link token (32 random bytes) and the hash that is stored in its place. */
async function newToken(): Promise<{ token: string; hash: string }> {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  return { token, hash: await sha256(token) };
}

const ENCRYPTED_PREFIX = 'v1:';

/** The AES-256-GCM key from SIGNING_ENCRYPTION_KEY (32 bytes, base64). Throws on a malformed key. */
export async function importFieldKey(secret: string): Promise<CryptoKey> {
  const raw = fromBase64(secret.trim());
  if (raw.length !== 32) throw new Error('SIGNING_ENCRYPTION_KEY must be 32 bytes, base64-encoded');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * `v1:` + base64(iv ‖ ciphertext). The request id and field name are bound in as associated data,
 * so a ciphertext copied onto another row or into the other column fails to decrypt.
 */
async function encryptField(key: CryptoKey, requestId: string, field: string, value: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const additionalData = new TextEncoder().encode(`${requestId}:${field}`);
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, new TextEncoder().encode(value)));
  const out = new Uint8Array(iv.length + sealed.length);
  out.set(iv);
  out.set(sealed, iv.length);
  return ENCRYPTED_PREFIX + toBase64(out);
}

async function decryptField(key: CryptoKey, requestId: string, field: string, stored: string): Promise<string> {
  if (!stored.startsWith(ENCRYPTED_PREFIX)) throw new Error('unknown ciphertext format');
  const bytes = fromBase64(stored.slice(ENCRYPTED_PREFIX.length));
  const additionalData = new TextEncoder().encode(`${requestId}:${field}`);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData }, key, bytes.slice(12));
  return new TextDecoder().decode(plain);
}

// ── Decisions ─────────────────────────────────────────────────────────────────────────────────

export type Decision = 'approved' | 'declined';

export interface DecisionRow {
  draft_id: string;
  decision: Decision;
  reason_html: string;
  decided_by: string;
  decided_at: number;
}

export const getDecision = (db: DraftDb, draftId: string) =>
  db.prepare('select * from "application_decision" where "draft_id" = ?').bind(draftId).first<DecisionRow>();

function decideStatement(db: DraftDb, draftId: string, decision: Decision, reasonHtml: string, actor: string) {
  return db
    .prepare(
      `insert into "application_decision" ("draft_id", "decision", "reason_html", "decided_by", "decided_at") values (?, ?, ?, ?, ?)
       on conflict ("draft_id") do update set "decision" = excluded."decision", "reason_html" = excluded."reason_html",
         "decided_by" = excluded."decided_by", "decided_at" = excluded."decided_at"`,
    )
    .bind(draftId, decision, reasonHtml, actor, now());
}

// ── Signing requests ──────────────────────────────────────────────────────────────────────────

export type RequestStatus = 'pending' | 'signed' | 'revoked';

export interface SigningRequestRow {
  id: string;
  draft_id: string;
  email: string;
  status: RequestStatus;
  created_at: number;
  created_by: string;
  expires_at: number;
  email_sent_at: number | null;
  prefill_json: string;
  consented_at: number | null;
  signed_at: number | null;
  confirmed_json: string | null;
  ein_enc: string | null;
  ein_last4: string | null;
  ssn_enc: string | null;
  ssn_last4: string | null;
  signer_name: string | null;
  signature_font: string | null;
  terms_version: string | null;
  signer_ip: string | null;
  signer_ua: string | null;
  signer_country: string | null;
  signer_city: string | null;
  document_hash: string | null;
}

export type EventType = 'sent' | 'send_failed' | 'viewed' | 'consented' | 'signed' | 'revoked' | 'revealed';

export interface SigningEventRow {
  id: number;
  request_id: string;
  type: EventType;
  at: number;
  actor: string | null;
  ip: string | null;
  ua: string | null;
  country: string | null;
  city: string | null;
}

export const isExpired = (row: SigningRequestRow) => row.status === 'pending' && row.expires_at <= now();

/** The application's most recent signing request, whatever its state. */
export const getLatestRequest = (db: DraftDb, draftId: string) =>
  db.prepare('select * from "signing_request" where "draft_id" = ? order by "created_at" desc, rowid desc limit 1').bind(draftId).first<SigningRequestRow>();

export const getRequest = (db: DraftDb, id: string) =>
  db.prepare('select * from "signing_request" where "id" = ?').bind(id).first<SigningRequestRow>();

export async function listEvents(db: DraftDb, requestIds: string[]): Promise<SigningEventRow[]> {
  if (!requestIds.length) return [];
  const { results } = await db
    .prepare(`select * from "signing_event" where "request_id" in (${requestIds.map(() => '?').join(', ')}) order by "at", "id"`)
    .bind(...requestIds)
    .all<SigningEventRow>();
  return results;
}

/** Every request ever made for an application, newest first (their events make up the audit trail). */
export async function listRequestIds(db: DraftDb, draftId: string): Promise<string[]> {
  const { results } = await db.prepare('select "id" from "signing_request" where "draft_id" = ? order by "created_at" desc').bind(draftId).all<{ id: string }>();
  return results.map((r) => r.id);
}

export async function findByToken(db: DraftDb, token: string): Promise<SigningRequestRow | null> {
  return db.prepare('select * from "signing_request" where "token_hash" = ?').bind(await sha256(token)).first<SigningRequestRow>();
}

function eventStatement(db: DraftDb, requestId: string, type: EventType, who: { actor?: string; signals?: Signals }) {
  const s = who.signals;
  return db
    .prepare('insert into "signing_event" ("request_id", "type", "at", "actor", "ip", "ua", "country", "city") values (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(requestId, type, now(), who.actor ?? null, s?.ip ?? null, s?.ua ?? null, s?.country ?? null, s?.city ?? null);
}

/** Revoke the application's pending link, if any, logging who did it. */
async function revokeStatements(db: DraftDb, draftId: string, actor: string) {
  const { results } = await db.prepare(`select "id" from "signing_request" where "draft_id" = ? and "status" = 'pending'`).bind(draftId).all<{ id: string }>();
  return results.flatMap(({ id }) => [
    db.prepare(`update "signing_request" set "status" = 'revoked' where "id" = ? and "status" = 'pending'`).bind(id),
    eventStatement(db, id, 'revoked', { actor }),
  ]);
}

/** True once the application has a signature; its decision is final from then on. */
export async function isSigned(db: DraftDb, draftId: string): Promise<boolean> {
  const row = await db.prepare(`select 1 as "x" from "signing_request" where "draft_id" = ? and "status" = 'signed' limit 1`).bind(draftId).first();
  return row != null;
}

/** Decline: record the decision and revoke any live link. */
export async function decline(db: DraftDb, draftId: string, reasonHtml: string, actor: string): Promise<void> {
  await db.batch([decideStatement(db, draftId, 'declined', reasonHtml, actor), ...(await revokeStatements(db, draftId, actor))]);
}

/**
 * Approve (or re-send): record the decision, revoke any live link and create a new one. Returns the
 * new request's id and the link token, which exists only here and in the email that carries it.
 */
export async function approve(
  db: DraftDb,
  opts: { draftId: string; email: string; prefill: Record<string, string>; reasonHtml: string | null; actor: string },
): Promise<{ requestId: string; token: string; expiresAt: number }> {
  const { token, hash } = await newToken();
  const id = crypto.randomUUID();
  const t = now();
  const expiresAt = t + SIGNING_LINK_TTL_DAYS * DAY;
  // A re-send keeps the decision as it was (null reason); approving writes it.
  const decision = opts.reasonHtml == null ? [] : [decideStatement(db, opts.draftId, 'approved', opts.reasonHtml, opts.actor)];
  await db.batch([
    ...decision,
    ...(await revokeStatements(db, opts.draftId, opts.actor)),
    db
      .prepare(
        `insert into "signing_request" ("id", "draft_id", "token_hash", "email", "created_at", "created_by", "expires_at", "prefill_json")
         values (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, opts.draftId, hash, opts.email, t, opts.actor, expiresAt, JSON.stringify(opts.prefill)),
  ]);
  return { requestId: id, token, expiresAt };
}

/** Record whether the link's email went out. */
export async function recordSend(db: DraftDb, requestId: string, sent: boolean, actor: string): Promise<void> {
  await db.batch([
    ...(sent ? [db.prepare('update "signing_request" set "email_sent_at" = ? where "id" = ?').bind(now(), requestId)] : []),
    eventStatement(db, requestId, sent ? 'sent' : 'send_failed', { actor }),
  ]);
}

// A reload or a tab left open shouldn't flood the audit trail: one view per visitor per half hour.
const VIEW_DEDUPE_SECONDS = 30 * 60;

export async function recordView(db: DraftDb, requestId: string, signals: Signals): Promise<void> {
  const recent = await db
    .prepare(`select 1 as "x" from "signing_event" where "request_id" = ? and "type" = 'viewed' and "ip" is ? and "ua" is ? and "at" > ? limit 1`)
    .bind(requestId, signals.ip, signals.ua, now() - VIEW_DEDUPE_SECONDS)
    .first();
  if (!recent) await eventStatement(db, requestId, 'viewed', { signals }).run();
}

/** Accept the e-sign disclosure. False when the request can no longer be acted on. */
export async function recordConsent(db: DraftDb, requestId: string, signals: Signals): Promise<boolean> {
  const t = now();
  const update = await db
    .prepare(`update "signing_request" set "consented_at" = ? where "id" = ? and "status" = 'pending' and "expires_at" > ? and "consented_at" is null`)
    .bind(t, requestId, t)
    .run();
  if (update.meta.changes) {
    await eventStatement(db, requestId, 'consented', { signals }).run();
    return true;
  }
  // Already consented (a second tab, say): still fine to go on while the request is live.
  const row = await getRequest(db, requestId);
  return row?.status === 'pending' && row.consented_at != null && row.expires_at > t;
}

/**
 * The hash that pins down what was signed: the texts agreed to, the data confirmed, the encrypted
 * identifiers, the signature and where and when it was made. Recomputing it from the row (with the
 * texts of `terms_version`) shows whether anything has changed since.
 */
function documentHash(parts: Record<string, unknown>): Promise<string> {
  return sha256(
    JSON.stringify({
      ...parts,
      termsVersion: SIGNING_TERMS_VERSION,
      disclosure: ESIGN_DISCLOSURE,
      attestation: SIGNING_ATTESTATION,
      adoption: SIGNATURE_ADOPTION,
    }),
  );
}

/**
 * Write the signature. Only a pending, unexpired request that has consented can be signed, and only
 * once: the update is conditional, so a double submit signs at most one time. Returns false when
 * the request was not signable.
 */
export async function recordSignature(
  db: DraftDb,
  key: CryptoKey,
  row: SigningRequestRow,
  input: { fields: ConfirmedFields; ein: string; ssn: string; signerName: string },
  signals: Signals,
): Promise<boolean> {
  const t = now();
  const [einEnc, ssnEnc] = await Promise.all([encryptField(key, row.id, 'ein', input.ein), encryptField(key, row.id, 'ssn', input.ssn)]);
  const confirmedJson = JSON.stringify(input.fields);
  const hash = await documentHash({
    requestId: row.id,
    confirmed: input.fields,
    einEnc,
    ssnEnc,
    signerName: input.signerName,
    signatureFont: SIGNATURE_FONT,
    consentedAt: row.consented_at,
    signedAt: t,
    ip: signals.ip,
    ua: signals.ua,
  });
  const update = await db
    .prepare(
      `update "signing_request" set "status" = 'signed', "signed_at" = ?, "confirmed_json" = ?, "ein_enc" = ?, "ein_last4" = ?,
         "ssn_enc" = ?, "ssn_last4" = ?, "signer_name" = ?, "signature_font" = ?, "terms_version" = ?, "signer_ip" = ?,
         "signer_ua" = ?, "signer_country" = ?, "signer_city" = ?, "document_hash" = ?
       where "id" = ? and "status" = 'pending' and "expires_at" > ? and "consented_at" is not null`,
    )
    .bind(
      t, confirmedJson, einEnc, input.ein.slice(-4), ssnEnc, input.ssn.slice(-4), input.signerName, SIGNATURE_FONT, SIGNING_TERMS_VERSION,
      signals.ip, signals.ua, signals.country, signals.city, hash, row.id, t,
    )
    .run();
  if (!update.meta.changes) return false;
  await eventStatement(db, row.id, 'signed', { signals }).run();
  return true;
}

/** Decrypt a signed request's EIN and SSN for an admin, logging the reveal. */
export async function revealIdentifiers(db: DraftDb, key: CryptoKey, row: SigningRequestRow, actor: string): Promise<{ ein: string; ssn: string } | null> {
  if (!row.ein_enc || !row.ssn_enc) return null;
  const [ein, ssn] = await Promise.all([decryptField(key, row.id, 'ein', row.ein_enc), decryptField(key, row.id, 'ssn', row.ssn_enc)]);
  await eventStatement(db, row.id, 'revealed', { actor }).run();
  return { ein, ssn };
}
