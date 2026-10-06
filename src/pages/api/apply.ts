import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, LLAMA_CLOUD_API_KEY, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { applyRequest, type ApplyRequest } from '@/lib/apply-schema';
import { escapeHtml } from '@/lib/sanitize';
import { APPLY_TURNSTILE_ACTION, MAX_UPLOAD_TOTAL_BYTES, type AutofillField } from '@/lib/upload-config';
import { MAX_BODY_BYTES, invalidBody, json, methodNotAllowed, parseJsonText, readMultipart, requireSecrets } from '@/lib/server/http';
import { sendEmail, type EmailAttachment } from '@/lib/server/email';
import { verifyTurnstile } from '@/lib/server/turnstile';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { checkStatementBatch, checkStatementFile, filesOf } from '@/lib/server/doc-extract/statement-files';
import { createDocClient, readExtractions } from '@/lib/server/doc-extract/llamacloud';
import { buildSuggestions } from '@/lib/server/doc-extract/autofill';
import type { StatementExtraction } from '@/lib/server/doc-extract/schema';
import { runInBackground } from '@/lib/server/bindings';
import { claimSubmission, getDraftDb, type DraftDb, recordSubmission, releaseSubmission } from '@/lib/server/drafts';
import { DRAFT_FIELDS, DRAFT_FIELD_LABELS } from '@/lib/draft-config';

// One of the three on-demand routes (with /api/contact and /api/partner). Everything else on the
// site is prerendered. Unlike the other two this one is multipart, because the bank statements
// ride along with it: a `payload` field holding the JSON the form used to POST, plus `files[]`.
// The upload's stored copies (src/lib/server/documents.ts) belong to the drop-off record, not to
// this path: the browser re-sends the files, so they go through the same gates as the upload did
// (statement-files.ts) before they are attached.
// A sent application is recorded as a converted session (src/lib/server/drafts.ts), closing the
// page's drop-off draft when it has one, and the exact same application can't be sent twice.
export const prerender = false;

const TAG = 'apply';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

/** What the reader made of the attached statements by the time the application was sent. */
interface StatementReading {
  rows: [string, string][];
  /** Values the statements read so far suggest, over the ones that finished. */
  suggested: Partial<Record<AutofillField, string | number>>;
  /** Statements still being read at submission: nothing from them reached the form. */
  pending: number;
}

export const POST: APIRoute = async ({ request }) => {
  // First thing, so a rejected client never costs a siteverify or Resend call.
  const limited = await enforceRateLimit(TAG, request);
  if (limited) return limited;

  const read = await readMultipart(request, MAX_UPLOAD_TOTAL_BYTES + MAX_BODY_BYTES);
  if ('response' in read) return read.response;
  const payloadRaw = read.form.get('payload');
  if (typeof payloadRaw !== 'string') return json(400, { error: 'invalid_form' });
  const payload = parseJsonText(payloadRaw);
  if ('response' in payload) return payload.response;
  // The form runs friendly checks client-side, but anyone can POST here directly.
  const parsed = applyRequest.safeParse(payload.payload);
  if (!parsed.success) return invalidBody(parsed.error);
  const data = parsed.data;

  // The cheap statement checks (count, total size) before anything is spent; the bytes are
  // looked at only once the sender has verified.
  const files = filesOf(read.form);
  const batchError = checkStatementBatch(files);
  if (batchError) return json(400, { error: batchError === 'too_large' ? 'documents_too_large' : 'too_many_documents' });

  // Shares the contact inbox and sender identity; there's only one team address configured.
  const env = requireSecrets(TAG, { TURNSTILE_SECRET_KEY, RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL });
  if ('response' in env) return env.response;
  const secrets = env.secrets;

  const verified = await verifyTurnstile({
    tag: TAG,
    secret: secrets.TURNSTILE_SECRET_KEY,
    token: data.token,
    action: APPLY_TURNSTILE_ACTION,
    ip: request.headers.get('CF-Connecting-IP'),
  });
  if (!verified) return json(403, { error: 'verification_failed' });

  // The provider round trip for the summary doesn't depend on the files, so it runs while they're checked.
  const readingPromise = readStatements(data.jobIds);

  // Same per-file gates as the upload check (size, actual bytes), so only real PDFs and images
  // ever reach the inbox, whatever the browser claims they are.
  const attachments: EmailAttachment[] = [];
  for (const file of files) {
    const checked = await checkStatementFile(file);
    if (!checked.ok) return json(400, { error: checked.reason === 'too_large' ? 'documents_too_large' : 'documents_invalid' });
    attachments.push({ filename: checked.filename, content: file });
  }

  // The same application (fields and statement bytes) goes out once. Claimed before sending so
  // two concurrent submits can't both pass; a database hiccup lets it through rather than lose it.
  const db = await getDraftDb();
  const hash = db ? await applicationHash(data, files) : undefined;
  if (db && hash) {
    const claimed = await claimSubmission(db, hash).catch((err: unknown) => {
      console.error(`[${TAG}] duplicate check failed`, err);
      return true;
    });
    if (!claimed) return json(409, { error: 'duplicate_application' });
  }
  const release = async () => {
    if (db && hash) await releaseSubmission(db, hash).catch((err: unknown) => console.error(`[${TAG}] could not release claim`, err));
  };

  const reading = await readingPromise;
  const source = sourceLabeler(data, reading);
  const labelled = (value: string, note: string | null) => (note ? `${value} (${note})` : value);
  const firstSource = source('firstName');
  const lastSource = source('lastName');
  const nameSource = firstSource === lastSource ? firstSource : `first name ${firstSource ?? 'entered by applicant'}; last name ${lastSource ?? 'entered by applicant'}`;

  const applicantName = `${data.firstName} ${data.lastName}`;
  const L = DRAFT_FIELD_LABELS;
  const rows: [string, string][] = [
    [L.legalBusinessName, labelled(data.legalBusinessName, source('legalBusinessName'))],
    [L.dba, data.dba || '—'],
    ['Contact name', labelled(applicantName, nameSource)],
    [L.mobile, data.mobile],
    [L.email, data.email],
    [L.monthlyRevenue, labelled(money(data.monthlyRevenue), source('monthlyRevenue'))],
    [L.homeAddress, data.homeAddress],
    [L.businessAddress, labelled(data.businessAddress, source('businessAddress'))],
    [L.businessStartDate, data.businessStartDate],
    [L.businessIndustry, data.businessIndustry],
    [L.ficoScore, String(data.ficoScore)],
    [L.fundingAmount, money(data.fundingAmount)],
    ['Bank statements', attachments.length ? `${attachments.length} attached: ${attachments.map((a) => a.filename).join(', ')}` : 'None uploaded'],
  ];
  rows.push(...reading.rows);

  const sent = await sendEmail(TAG, secrets.RESEND_API_KEY, {
    from: secrets.CONTACT_FROM_EMAIL,
    to: secrets.CONTACT_TO_EMAIL,
    replyTo: data.email,
    subject: `New funding application from ${data.legalBusinessName}`,
    html: `<table>${rows.map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    attachments,
  });
  if (!sent) {
    await release();
    return json(502, { error: 'send_failed' });
  }
  if (db) void runInBackground(recordApplication(db, request, data));
  return json(200, { ok: true });
};

export const ALL: APIRoute = methodNotAllowed;

/** Put the sent application on the admin dashboard, closing the visitor's draft if any. Best effort. */
async function recordApplication(db: DraftDb, request: Request, data: ApplyRequest): Promise<void> {
  try {
    const fields = Object.fromEntries(DRAFT_FIELDS.map((name) => [name, String(data[name] ?? '')]));
    await recordSubmission(
      db,
      data.draftId,
      { fields, autofilled: data.autofilled, jobIds: data.jobIds, documentIds: data.documentIds },
      {
        ip: request.headers.get('CF-Connecting-IP'),
        ua: request.headers.get('User-Agent')?.slice(0, 500) ?? null,
        referrer: null,
        utm: {},
        cf: (request as Request & { cf?: Record<string, unknown> }).cf,
      },
    );
  } catch (err) {
    console.error(`[${TAG}] could not record application`, err);
  }
}

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (data: BufferSource) => hex(await crypto.subtle.digest('SHA-256', data));

/**
 * What makes two applications "the same": every field (whitespace collapsed, case ignored) plus
 * the bytes of each statement, in any order. Filenames don't count; a re-picked copy of the same
 * file is the same statement.
 */
async function applicationHash(data: ApplyRequest, files: File[]): Promise<string> {
  const fields = DRAFT_FIELDS.map((name) => collapse(String(data[name] ?? '')));
  const statements = (await Promise.all(files.map(async (f) => sha256(await f.arrayBuffer())))).sort();
  return sha256(new TextEncoder().encode(JSON.stringify([fields, statements])));
}

/**
 * Where each pre-fillable value in the email came from. The applicant's entry always stands: a
 * value is "from statement" only if they left the reader's suggestion untouched, and anything a
 * statement says that differs from what they typed (or would have said, when it was still being
 * read at submission) is noted, never applied. Null when no statements were attached.
 */
function sourceLabeler(data: ApplyRequest, reading: StatementReading) {
  const autofilled = new Set(data.autofilled);
  return (field: AutofillField): string | null => {
    if (!data.jobIds.length) return null;
    if (autofilled.has(field)) return 'from statement';
    const suggested = reading.suggested[field];
    if (suggested != null && suggested !== '') {
      const submitted = data[field];
      const same = typeof suggested === 'number'
        ? Math.round(Number(submitted)) === Math.round(suggested)
        : collapse(String(submitted)) === collapse(suggested);
      if (same) return 'entered by applicant, matches statement';
      return `entered by applicant; statement read ${typeof suggested === 'number' ? money(suggested) : `"${suggested}"`}`;
    }
    if (reading.pending) return 'entered by applicant; statements were still being read';
    return 'entered by applicant';
  };
}

/**
 * What the reader made of the attached statements, for the reviewer: read here from the
 * provider rather than trusted from the browser. Best effort: any hiccup leaves the rows out,
 * the application still goes.
 */
async function readStatements(jobIds: string[]): Promise<StatementReading> {
  const none: StatementReading = { rows: [], suggested: {}, pending: 0 };
  if (!jobIds.length || !LLAMA_CLOUD_API_KEY) return none;
  // readExtractions already turns a provider failure into `pending`; this catch is for anything
  // else, since the promise can be left unawaited when a file fails its check.
  const results = await readExtractions(TAG, createDocClient(LLAMA_CLOUD_API_KEY), jobIds).catch((err: unknown) => {
    console.error(`[${TAG}] statement summary failed`, err);
    return [];
  });
  const extractions: StatementExtraction[] = results.flatMap(({ result }) => (result.status === 'done' ? [result.extraction] : []));
  const pending = results.filter(({ result }) => result.status === 'pending').length;
  const rows: [string, string][] = [];
  let suggested: StatementReading['suggested'] = {};
  if (extractions.length) {
    const s = buildSuggestions(extractions);
    suggested = s.fields;
    if (s.accountHolder) rows.push(['Statements: account holder', s.accountHolder]);
    if (s.bankName) rows.push(['Statements: bank', s.bankName]);
    if (s.monthsCovered.length) rows.push(['Statements: months covered', s.monthsCovered.join(', ')]);
    if (s.averageMonthlyDeposits != null) rows.push(['Statements: average monthly deposits', money(s.averageMonthlyDeposits)]);
  }
  if (pending) {
    rows.push([
      'Statements: not yet read',
      `${pending} of ${jobIds.length} were still being read when the application was sent. Nothing from ${pending === 1 ? 'it' : 'them'} was pre-filled or applied; each value above is labelled with where it came from. ${pending === 1 ? 'It is' : 'They are'} attached for manual review.`,
    ]);
  }
  return { rows, suggested, pending };
}
