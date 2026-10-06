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
import { getDocumentBucket, putDocument, type R2Bucket } from '@/lib/server/documents';

// Bank-statement check + read for the apply form. Multipart: `token` (Turnstile) + `files[]`,
// at most MAX_FILES_PER_UPLOAD of them (the page splits a bigger pick into several requests).
// Each file goes through, in order: size cap → magic-byte sniff → Turnstile (once per batch,
// only if anything survived the free checks) → one LlamaCloud upload → Classify → Extract (only
// when Classify calls it a bank statement) → a copy in R2 (src/lib/server/documents.ts), so a
// statement from an application that is never submitted still reaches the drop-off record. The
// classifier never refuses a file; it only gates the pre-fill. A file that passes comes back with its extraction job id,
// which the browser polls /api/apply/parse-status with, and its document id, which the drop-off
// capture records. The browser still re-sends the file itself with the final submission to be
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
  const bucket = await getDocumentBucket();
  const results = await Promise.all(checked.map((c): Promise<UploadResult> | UploadResult => (c.ok ? processFile(client, bucket, c) : { reason: c.reason })));
  return json(200, { ok: true, results });
};

export const ALL: APIRoute = methodNotAllowed;

/**
 * Upload → classify → submit extraction → store, for one file that passed the byte checks. Every
 * such file is attached and read, whatever the classifier says: Classify only reads a PDF's text
 * layer, so a photographed statement that a forwarder stamped a text watermark on comes back as
 * "other" even though Extract (which OCRs the pages) reads it fine. Whether anything is pre-filled
 * is decided on the extraction instead (see `looksLikeStatement` in llamacloud.ts); the classifier's
 * verdict is only logged and kept on the stored copy. A provider failure at any step just leaves
 * the file without pre-fill (`jobId: null`)
 * or without a drop-off copy.
 */
async function processFile(client: LlamaCloud, bucket: R2Bucket | undefined, { file, type, filename }: CheckedFile & { ok: true }): Promise<UploadResult> {
  let classification: Classification | null = null;
  let jobId: string | null = null;
  let fileId: string | null = null;
  try {
    fileId = await uploadStatement(client, file, type.mime, filename);
  } catch (err) {
    logProviderError(TAG, 'upload', err);
  }
  if (fileId) {
    // Independent of each other, so a classifier hiccup never costs the read.
    const [classified, submitted] = await Promise.allSettled([classifyDocument(client, fileId), submitExtraction(client, fileId)]);
    if (classified.status === 'fulfilled') classification = classified.value;
    else logProviderError(TAG, 'classify', classified.reason);
    if (submitted.status === 'fulfilled') jobId = submitted.value;
    else logProviderError(TAG, 'extract', submitted.reason);
  }

  let documentId: string | undefined;
  if (bucket) {
    const id = crypto.randomUUID();
    try {
      await putDocument(bucket, id, await file.arrayBuffer(), {
        filename,
        mime: type.mime,
        uploadedAt: new Date().toISOString(),
        jobId: jobId ?? '',
        classifierConfidence: classification?.confidence ?? 0,
      });
      documentId = id;
    } catch (err) {
      console.error(`[${TAG}] could not store statement`, err);
    }
  }
  const verdict = classification ? `${classification.isBankStatement ? 'statement' : 'not a statement'}, confidence ${classification.confidence.toFixed(2)}` : 'unclassified';
  console.log(`[${TAG}] accepted file (${file.size} bytes, ${verdict}, job ${jobId ?? 'none'}, stored ${documentId ? 'yes' : 'no'})`);
  return { jobId, documentId };
}
