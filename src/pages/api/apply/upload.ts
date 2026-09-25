import type { APIRoute } from 'astro';
import { LLAMA_CLOUD_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import type LlamaCloud from '@llamaindex/llama-cloud';
import { turnstileToken } from '@/lib/message-schema';
import { APPLY_TURNSTILE_ACTION, MAX_FILES_PER_UPLOAD, MAX_UPLOAD_TOTAL_BYTES, type UploadResult } from '@/lib/upload-config';
import { json, methodNotAllowed, readMultipart, requireSecrets } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { verifyTurnstile } from '@/lib/server/turnstile';
import { checkStatementBatch, checkStatementFile, filesOf, type CheckedFile } from '@/lib/server/doc-extract/statement-files';
import { classifyDocument, createDocClient, logProviderError, submitExtraction, uploadStatement, type Classification } from '@/lib/server/doc-extract/llamacloud';

// Bank-statement check + read for the apply form. Multipart: `token` (Turnstile) + `files[]`,
// at most MAX_FILES_PER_UPLOAD of them (the page splits a bigger pick into several requests).
// Each file goes through, in order: size cap → magic-byte sniff → Turnstile (once per batch,
// only if anything survived the free checks) → one LlamaCloud upload → Classify → Extract. Nothing
// is stored here (server-side storage is parked, see src/lib/server/documents.ts): a file that
// passes comes back with its extraction job id, which the browser polls /api/apply/parse-status
// with, and the browser re-sends the file itself with the final submission so it can be
// attached to the email. Results are per file, in input order, so a bad file never sinks its batch.
export const prerender = false;

const TAG = 'apply-upload';

export const POST: APIRoute = async ({ request }) => {
  // First thing, so a rejected client never costs a siteverify or provider call.
  const limited = await enforceRateLimit(TAG, request, 'UPLOAD_RATE_LIMIT');
  if (limited) return limited;

  const env = requireSecrets(TAG, { TURNSTILE_SECRET_KEY, LLAMA_CLOUD_API_KEY });
  if ('response' in env) return env.response;
  const secrets = env.secrets;

  const read = await readMultipart(request, MAX_UPLOAD_TOTAL_BYTES);
  if ('response' in read) return read.response;
  const token = turnstileToken.safeParse(read.form.get('token'));
  if (!token.success) return json(400, { error: 'invalid_form' });
  const files = filesOf(read.form);
  if (!files.length) return json(400, { error: 'no_files' });
  const batchError = checkStatementBatch(files, MAX_FILES_PER_UPLOAD);
  if (batchError) return json(batchError === 'too_large' ? 413 : 400, { error: batchError });

  // The free checks on every file before anything is spent. The extension and declared MIME
  // type are the browser's word; the sniff decides what the bytes actually are.
  const checked = await Promise.all(files.map(checkStatementFile));
  if (!checked.some((c) => c.ok)) return json(200, { ok: true, results: checked.flatMap((c) => (c.ok ? [] : [{ reason: c.reason }])) });

  // A token is single-use, so it is only spent once there is a batch worth spending on.
  const verified = await verifyTurnstile({
    tag: TAG,
    secret: secrets.TURNSTILE_SECRET_KEY,
    token: token.data,
    action: APPLY_TURNSTILE_ACTION,
    ip: request.headers.get('CF-Connecting-IP'),
  });
  if (!verified) return json(403, { error: 'verification_failed' });

  const client = createDocClient(secrets.LLAMA_CLOUD_API_KEY);
  const results = await Promise.all(checked.map((c): Promise<UploadResult> | UploadResult => (c.ok ? processFile(client, c) : { reason: c.reason })));
  return json(200, { ok: true, results });
};

export const ALL: APIRoute = methodNotAllowed;

/**
 * Upload → classify → submit extraction for one file that passed the byte checks. A provider
 * failure during the upload or classification fails closed (the file is refused: an unverified file must not reach
 * the inbox); a failure submitting the extraction keeps the file, since it is a verified
 * statement by then, and just leaves it without pre-fill.
 */
async function processFile(client: LlamaCloud, { file, type, filename }: CheckedFile & { ok: true }): Promise<UploadResult> {
  let fileId: string;
  let classification: Classification;
  try {
    fileId = await uploadStatement(client, file, type.mime, filename);
    classification = await classifyDocument(client, fileId);
  } catch (err) {
    logProviderError(TAG, 'classify', err);
    return { reason: 'read_failed' };
  }
  if (!classification.isBankStatement) return { reason: 'not_a_bank_statement' };

  let jobId: string | null = null;
  try {
    jobId = await submitExtraction(client, fileId);
  } catch (err) {
    logProviderError(TAG, 'extract', err);
  }
  console.log(`[${TAG}] accepted statement (${file.size} bytes, confidence ${classification.confidence.toFixed(2)}, job ${jobId ?? 'none'})`);
  return { jobId };
}
