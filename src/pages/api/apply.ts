import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, LLAMA_CLOUD_API_KEY, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { applyRequest } from '@/lib/apply-schema';
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

// One of the three on-demand routes (with /api/contact and /api/partner). Everything else on the
// site is prerendered. Unlike the other two this one is multipart, because the bank statements
// ride along with it: a `payload` field holding the JSON the form used to POST, plus `files[]`.
// Nothing is stored between the upload check and this submission (see src/lib/server/documents.ts),
// so the files go through the same gates as the upload did (statement-files.ts) before they are attached.
export const prerender = false;

const TAG = 'apply';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const AUTOFILL_LABELS: Record<AutofillField, string> = {
  legalBusinessName: 'Legal business name',
  firstName: 'First name',
  lastName: 'Last name',
  businessAddress: 'Business address',
  monthlyRevenue: 'Monthly business revenue',
};

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
  const summaryRows = statementSummaryRows(data.jobIds);

  // Same per-file gates as the upload check (size, actual bytes), so only real PDFs and images
  // ever reach the inbox, whatever the browser claims they are.
  const attachments: EmailAttachment[] = [];
  for (const file of files) {
    const checked = await checkStatementFile(file);
    if (!checked.ok) return json(400, { error: checked.reason === 'too_large' ? 'documents_too_large' : 'documents_invalid' });
    attachments.push({ filename: checked.filename, content: file });
  }

  const applicantName = `${data.firstName} ${data.lastName}`;
  const rows: [string, string][] = [
    ['Legal business name', data.legalBusinessName],
    ['DBA', data.dba || '—'],
    ['Contact name', applicantName],
    ['Mobile', data.mobile],
    ['Email', data.email],
    ['Monthly business revenue', money(data.monthlyRevenue)],
    ['Home address', data.homeAddress],
    ['Business address', data.businessAddress],
    ['Business start date', data.businessStartDate],
    ['Business industry', data.businessIndustry],
    ['Estimated FICO score', String(data.ficoScore)],
    ['Requested funding amount', money(data.fundingAmount)],
    ['Bank statements', attachments.length ? `${attachments.length} attached: ${attachments.map((a) => a.filename).join(', ')}` : 'None uploaded'],
  ];
  if (data.autofilled.length) rows.push(['Pre-filled from statements', data.autofilled.map((f) => AUTOFILL_LABELS[f]).join(', ')]);
  rows.push(...(await summaryRows));

  const sent = await sendEmail(TAG, secrets.RESEND_API_KEY, {
    from: secrets.CONTACT_FROM_EMAIL,
    to: secrets.CONTACT_TO_EMAIL,
    replyTo: data.email,
    subject: `New funding application from ${data.legalBusinessName}`,
    html: `<table>${rows.map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    attachments,
  });
  if (!sent) return json(502, { error: 'send_failed' });
  return json(200, { ok: true });
};

export const ALL: APIRoute = methodNotAllowed;

/**
 * What the reader made of the attached statements, for the reviewer: read here from the
 * provider rather than trusted from the browser. Best effort: any hiccup leaves the rows out,
 * the application still goes.
 */
async function statementSummaryRows(jobIds: string[]): Promise<[string, string][]> {
  if (!jobIds.length || !LLAMA_CLOUD_API_KEY) return [];
  // readExtractions already turns a provider failure into `pending`; this catch is for anything
  // else, since the promise can be left unawaited when a file fails its check.
  const results = await readExtractions(TAG, createDocClient(LLAMA_CLOUD_API_KEY), jobIds).catch((err: unknown) => {
    console.error(`[${TAG}] statement summary failed`, err);
    return [];
  });
  const extractions: StatementExtraction[] = results.flatMap(({ result }) => (result.status === 'done' ? [result.extraction] : []));
  const pending = results.filter(({ result }) => result.status === 'pending').length;
  const rows: [string, string][] = [];
  if (extractions.length) {
    const s = buildSuggestions(extractions);
    if (s.accountHolder) rows.push(['Statements: account holder', s.accountHolder]);
    if (s.bankName) rows.push(['Statements: bank', s.bankName]);
    if (s.monthsCovered.length) rows.push(['Statements: months covered', s.monthsCovered.join(', ')]);
    if (s.averageMonthlyDeposits != null) rows.push(['Statements: average monthly deposits', money(s.averageMonthlyDeposits)]);
  }
  if (pending) rows.push(['Statements: still being read', `${pending} of ${jobIds.length} (submitted before the reader finished)`]);
  return rows;
}
