// Tunables for the statement reader (LlamaCloud Classify + Extract). Server-only; the upload
// size/type limits the browser also needs live in src/lib/upload-config.ts.

/**
 * Classifier confidence floor. At or above this a file labelled `bank_statement` is accepted and
 * sent to the (costlier) Extract step; below it the file is treated as not-a-statement and refused.
 */
export const CLASSIFIER_MIN_CONFIDENCE = 0.5;

/**
 * Classify is polled to completion inside the upload request (it resolves in seconds). The
 * timeout bounds how long a stuck job can hold the request open (the SDK's default is two
 * hours); the interval starts short and doubles up to the max, so a stuck job costs about eight
 * polls rather than thirty.
 */
export const CLASSIFY_TIMEOUT_SECONDS = 60;
export const CLASSIFY_POLL_INTERVAL_SECONDS = 2;
export const CLASSIFY_POLL_MAX_INTERVAL_SECONDS = 8;

/**
 * Most provider calls (SDK retries included) one request may make. Workers Free allows 50
 * external subrequests per invocation and the upload route also spends one on Turnstile. A
 * statement costs about nine calls (upload, classify create, ~6 polls over its 20–30 s, extract
 * create), so the four-file upload request (MAX_FILES_PER_UPLOAD) uses about 36; a slower one
 * has its last files fail as "try again" instead of the Worker being killed. On Workers Paid
 * (10,000 per invocation) this and MAX_FILES_PER_UPLOAD can both go up.
 */
export const PROVIDER_CALLS_PER_REQUEST = 45;

/**
 * Extract tier. `agentic` reasons about which printed name/address belongs to the account
 * holder and reads summary tables reliably; `cost_effective` is a third of the price and
 * noticeably faster but guesses more on the name/address fields.
 */
export const EXTRACT_TIER: 'agentic' | 'cost_effective' = 'agentic';

/**
 * Page cap per statement. The summary and the addressee are on the first pages; this stops a
 * 200-page account history from costing 200 pages of extraction.
 */
export const EXTRACT_MAX_PAGES = 25;
