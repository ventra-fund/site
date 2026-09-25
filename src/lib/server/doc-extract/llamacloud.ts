import LlamaCloud from '@llamaindex/llama-cloud';
import {
  CLASSIFIER_MIN_CONFIDENCE,
  CLASSIFY_POLL_INTERVAL_SECONDS,
  CLASSIFY_POLL_MAX_INTERVAL_SECONDS,
  CLASSIFY_TIMEOUT_SECONDS,
  EXTRACT_MAX_PAGES,
  EXTRACT_TIER,
  PROVIDER_CALLS_PER_REQUEST,
} from './config';
import { BANK_STATEMENT_LABEL, CLASSIFY_RULES, EXTRACTION_JSON_SCHEMA, EXTRACTION_SYSTEM_PROMPT, StatementExtractionSchema, type StatementExtraction } from './schema';

// The LlamaCloud side of the statement reader. The SDK is plain fetch/File/Bearer with no
// Node-native dependencies, so it runs in the Worker; the incoming multipart File is handed to
// it as-is (re-wrapped only to carry the sniffed type and cleaned name), so nothing is copied.
// Each file is uploaded once and the one file id is used for both Classify and Extract.
//
// Classify is polled to completion here, inside the upload request (seconds). Extract is only
// submitted here: it takes minutes, longer than a request should stay open, so the job id goes
// back to the browser and /api/apply/parse-status asks after it on the browser's behalf. Nothing
// is stored on our side: the job id the browser holds IS the parse state.

/**
 * A client for one incoming request. Every call it makes, retries included, counts against
 * `PROVIDER_CALLS_PER_REQUEST` (see config.ts); past that each call fails at once instead of
 * the Worker hitting its subrequest limit and dying mid-request.
 */
export function createDocClient(apiKey: string): LlamaCloud {
  let calls = 0;
  const budgetedFetch = (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (++calls > PROVIDER_CALLS_PER_REQUEST) {
      if (calls === PROVIDER_CALLS_PER_REQUEST + 1) console.warn(`LlamaCloud call budget (${PROVIDER_CALLS_PER_REQUEST}) used up for this request`);
      // Named like an abort so the SDK gives up on the call rather than retrying it.
      return Promise.reject(Object.assign(new Error('provider call budget used up'), { name: 'AbortError' }));
    }
    return fetch(input, init);
  };
  // The SDK reads LLAMA_CLOUD_API_KEY from process.env by default, which Worker secrets aren't on.
  return new LlamaCloud({ apiKey, maxRetries: 2, fetch: budgetedFetch });
}

export interface Classification {
  isBankStatement: boolean;
  confidence: number;
}

export type ExtractionStatus =
  | { status: 'pending' }
  | { status: 'error'; message: string }
  /** The provider finished but what came back wasn't a usable statement extraction. */
  | { status: 'unreadable' }
  | { status: 'done'; extraction: StatementExtraction };

/**
 * Upload a statement once; the returned file id feeds both Classify and Extract. The purpose is
 * `extract` because that is the step that reads the file last (the provider's docs say a file id
 * works across parse, extract and classify; the purpose sets its retention).
 */
export async function uploadStatement(client: LlamaCloud, blob: Blob, mime: string, filename: string): Promise<string> {
  const file = new File([blob], filename, { type: mime });
  const created = await client.files.create({ file, purpose: 'extract' });
  return created.id;
}

export async function classifyDocument(client: LlamaCloud, fileId: string): Promise<Classification> {
  const job = await client.classify.run(
    { file_input: fileId, configuration: { rules: [...CLASSIFY_RULES] } },
    {
      pollingInterval: CLASSIFY_POLL_INTERVAL_SECONDS,
      maxInterval: CLASSIFY_POLL_MAX_INTERVAL_SECONDS,
      backoff: 'exponential',
      timeout: CLASSIFY_TIMEOUT_SECONDS,
    },
  );
  const confidence = job.result?.confidence ?? 0;
  return { isBankStatement: job.result?.type === BANK_STATEMENT_LABEL && confidence >= CLASSIFIER_MIN_CONFIDENCE, confidence };
}

/** Submit the Extract job and return its id; the result is fetched later with `getExtraction`. */
export async function submitExtraction(client: LlamaCloud, fileId: string): Promise<string> {
  const job = await client.extract.create({
    file_input: fileId,
    configuration: {
      data_schema: EXTRACTION_JSON_SCHEMA,
      extraction_target: 'per_doc',
      tier: EXTRACT_TIER,
      max_pages: EXTRACT_MAX_PAGES,
      system_prompt: EXTRACTION_SYSTEM_PROMPT,
    },
  });
  return job.id;
}

export async function getExtraction(client: LlamaCloud, jobId: string): Promise<ExtractionStatus> {
  const job = await client.extract.get(jobId);
  // LlamaExtract statuses: PENDING | RUNNING | COMPLETED | FAILED | CANCELLED.
  const status = (job.status || '').toUpperCase();
  if (status === 'FAILED' || status === 'CANCELLED') return { status: 'error', message: job.error_message ?? status };
  if (status !== 'COMPLETED') return { status: 'pending' };
  // `per_doc` returns one object; anything else (or an object missing required keys) is unusable.
  const parsed = StatementExtractionSchema.safeParse(job.extract_result);
  if (!parsed.success) return { status: 'unreadable' };
  return { status: 'done', extraction: parsed.data };
}

/**
 * Ask after every job at once. A provider error on one job is logged and reported as `pending`
 * (worth another poll) unless the provider doesn't know the job at all (a 404), which is final.
 */
export async function readExtractions(tag: string, client: LlamaCloud, jobIds: string[]): Promise<{ jobId: string; result: ExtractionStatus }[]> {
  return Promise.all(
    jobIds.map(async (jobId) => {
      try {
        return { jobId, result: await getExtraction(client, jobId) };
      } catch (err) {
        logProviderError(tag, 'get', err);
        const status = providerErrorStatus(err);
        return { jobId, result: status === 404 ? { status: 'error', message: 'unknown job' } : { status: 'pending' } };
      }
    }),
  );
}

/** The HTTP status a provider error carried, if any (the SDK's errors expose `.status`). */
function providerErrorStatus(err: unknown): number | undefined {
  const status = (err as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : undefined;
}

/** Log a provider failure without the key or the document; a 401/403 is called out as a config problem. */
export function logProviderError(tag: string, step: string, err: unknown): void {
  const status = providerErrorStatus(err);
  const message = err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300);
  if (status === 401 || status === 403) console.error(`[${tag}] LlamaCloud rejected the API key (${status}); check LLAMA_CLOUD_API_KEY`);
  else console.error(`[${tag}] LlamaCloud ${step} failed`, status ?? '', message);
}
