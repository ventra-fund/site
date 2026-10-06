// Shapes for the apply form's drop-off capture (src/lib/apply-draft.ts in the browser,
// /api/apply/session and /api/apply/draft on the server). Read by both, so the captured fields
// can't drift between them. Keep this module dependency-free: it is shipped to the browser.

/** The /apply inputs a draft snapshot records, by `name`. */
export const DRAFT_FIELDS = [
  'legalBusinessName',
  'dba',
  'firstName',
  'lastName',
  'mobile',
  'email',
  'monthlyRevenue',
  'homeAddress',
  'businessAddress',
  'businessStartDate',
  'businessIndustry',
  'ficoScore',
  'fundingAmount',
] as const;
export type DraftField = (typeof DRAFT_FIELDS)[number];

/** How the admin dashboard and the application email name each field. */
export const DRAFT_FIELD_LABELS: Record<DraftField, string> = {
  legalBusinessName: 'Legal business name',
  dba: 'DBA',
  firstName: 'First name',
  lastName: 'Last name',
  mobile: 'Mobile',
  email: 'Email',
  monthlyRevenue: 'Monthly business revenue',
  homeAddress: 'Home address',
  businessAddress: 'Business address',
  businessStartDate: 'Business start date',
  businessIndustry: 'Business industry',
  ficoScore: 'Estimated FICO score',
  fundingAmount: 'Requested funding amount',
};

/**
 * How long the page waits after the visitor's last change before saving a draft. Lowering it
 * means more saves per visitor: keep DRAFT_RATE_LIMIT in wrangler.jsonc above 60 s / this value.
 */
export const DRAFT_SAVE_DEBOUNCE_MS = 8_000;

/** Longest a change waits to be saved while the visitor keeps typing without a pause. */
export const DRAFT_SAVE_MAX_WAIT_MS = 30_000;

/** Per-value cap for a snapshot; above every input's own maxlength on the page. */
export const MAX_DRAFT_VALUE = 400;

/** Draft ids and document ids (documents.ts) are both server-minted v4 UUIDs. */
export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
