// Limits and wire shapes for the apply form's bank-statement upload. Read by BOTH the server
// (src/pages/api/apply*.ts) and the page script (src/pages/apply.astro, src/lib/apply-upload.ts),
// so the accepted files, counts, sizes and response shapes can never drift between the two.
// Keep this module dependency-free: it is shipped to the browser.

/** Max statements attached to one application (and so to the outgoing email). */
export const MAX_UPLOAD_FILES = 6;

/**
 * Most statements sent in one /api/apply/upload request; a bigger pick goes up in several
 * requests. Classifying a statement takes the provider 20–30 s, so each file costs about nine
 * provider calls, and four is what fits the Worker's per-request budget on the Workers Free plan
 * (see PROVIDER_CALLS_PER_REQUEST in src/lib/server/doc-extract/config.ts).
 */
export const MAX_FILES_PER_UPLOAD = 4;

/** Per-file cap. A scanned monthly statement is typically 1–3 MB; a phone photo 2–5 MB. */
export const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Cap on the sum of every attached file. Resend refuses an email over 40 MB and base64 adds a
 * third, so 20 MB raw (≈ 27 MB encoded plus the body) keeps every application deliverable.
 */
export const MAX_UPLOAD_TOTAL_BYTES = 20 * 1024 * 1024;

/** Lowercase extensions (no dot) the upload accepts: downloaded statements and photos of them. */
export const UPLOAD_ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png']);

/** The `accept` attribute for the file input, derived from the same list. */
export const UPLOAD_ACCEPT = [...UPLOAD_ALLOWED_EXTENSIONS].map((ext) => `.${ext}`).join(',');

/** How the accepted types are named in copy, on the page and in error messages. */
export const UPLOAD_TYPE_LABEL = 'PDF, JPG or PNG';

/** Lowercase extension of a filename without the dot, or '' when it has none. */
export const fileExtension = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '');

/** A byte count as whole megabytes, for copy ("10 MB"). */
export const formatMb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

/** The Turnstile `action` the apply page's widget is rendered with; every apply endpoint checks it. */
export const APPLY_TURNSTILE_ACTION = 'apply';

/**
 * Shape of a LlamaCloud Extract job id: `ext-` and then an id body. LlamaCloud's other ids are a
 * prefix plus a UUID (`dfl-…`, `pjb-…`), so hyphens and either case are allowed; the check only
 * has to keep the value a safe single path segment. The browser holds these between the upload
 * and the submit (nothing is stored server-side), so every endpoint that takes them back checks
 * the shape before asking the provider about them.
 */
export const EXTRACT_JOB_ID = /^ext-[A-Za-z0-9-]{8,64}$/;

/** Form fields the statement reader may pre-fill. Shared with the server so the payload is validated. */
export const AUTOFILL_FIELDS = ['legalBusinessName', 'firstName', 'lastName', 'businessAddress', 'monthlyRevenue'] as const;
export type AutofillField = (typeof AUTOFILL_FIELDS)[number];

// ── Wire shapes ───────────────────────────────────────────────────────────────────────────────

/**
 * One entry per file sent to /api/apply/upload, in input order. `jobId` null means the file is
 * a verified statement (attach it) but the reader couldn't take it, so nothing will be pre-filled.
 * `documentId` is the stored copy (src/lib/server/documents.ts), absent when storage is off or failed.
 */
export type UploadResult = { jobId: string | null; documentId?: string } | { reason: string };

/** Where one statement is in the reader, as /api/apply/parse-status reports it. */
export type JobStatus = 'reading' | 'done' | 'unreadable' | 'failed';

/** What the statements suggest for the form, aggregated over every one read so far. */
export interface Suggestions {
  /** Values to put in the form. Keys are form field names. */
  fields: Partial<Record<AutofillField, string | number>>;
  /** Distinct 'YYYY-MM' months the statements cover, sorted. */
  monthsCovered: string[];
  /** Mean of the per-month deposit totals, rounded to the dollar. */
  averageMonthlyDeposits?: number;
}

export interface ParseStatusResponse {
  documents: { jobId: string; status: JobStatus; monthsCovered?: string[] }[];
  suggestions: Suggestions;
}
