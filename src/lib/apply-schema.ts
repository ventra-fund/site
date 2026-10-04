import { z } from 'astro/zod';
import { emailAddress, singleLine, turnstileToken } from './message-schema';
import { AUTOFILL_FIELDS, EXTRACT_JOB_ID, MAX_UPLOAD_FILES } from './upload-config';
import { DRAFT_FIELDS, UUID_V4, MAX_DRAFT_VALUE } from './draft-config';
import { isFullAddress } from './address-shape';

// The apply form's rules, enforced by the /api/apply endpoint. Server-only: the page script does
// its own lightweight checks for friendly errors, so zod stays out of the client bundle. Keep the
// constraints in step with the inputs in src/pages/apply.astro (minlength/pattern/max there mirror
// the rules here, so a visitor is told before submitting rather than by a 400 afterwards).

/** Length caps, exported so a value the statement reader suggests is cut to fit before it is offered. */
export const MAX_NAME = 200;
export const MAX_LINE = 300;

const name = (label: string) => z.string().trim().min(1, `Please enter your ${label}.`).max(MAX_NAME, 'That name is too long.');
const money = (label: string) => z.coerce.number({ error: `Please enter your ${label}.` }).min(0).max(1_000_000_000);
const line = (label: string, max = MAX_LINE) => z.string().trim().min(1, `Please enter your ${label}.`).max(max, 'That entry is too long.');
// The same shape check the page falls back on (address-shape.ts): every suggested address passes
// it, and so does one typed in full while the suggestion provider is down.
const address = (label: string) => line(label).refine(isFullAddress, { message: 'Please enter a full address: street number and name, city, state and ZIP code.' });

/** Today as YYYY-MM-DD in UTC; a start date can't be later than this. */
const todayIso = () => new Date().toISOString().slice(0, 10);

/** The JSON body POSTed to /api/apply. */
export const applyRequest = z.object({
  // Goes into the email subject, so newlines are collapsed like the other forms' name fields.
  legalBusinessName: singleLine('legal business name', MAX_LINE),
  dba: z.string().trim().max(200).default(''),
  firstName: name('first name'),
  lastName: name('last name'),
  mobile: z.string().trim().min(7, 'Please enter a valid mobile number.').max(30, 'Please enter a valid mobile number.'),
  email: emailAddress,
  monthlyRevenue: money('monthly business revenue'),

  homeAddress: address('home address'),
  businessAddress: address('business address'),

  businessStartDate: z.iso.date({ error: 'Please enter your business start date.' })
    .refine((d) => d <= todayIso(), { message: "The start date can't be in the future." }),
  businessIndustry: line('business industry', 200),
  ficoScore: z.coerce.number({ error: 'Please enter your estimated FICO score.' }).int().min(300).max(850),
  fundingAmount: money('requested funding amount'),

  // The Terms / Privacy Policy tick beside the submit button: no application is sent without it.
  consent: z.literal(true, { error: 'Please agree to the Terms of Service and Privacy Policy.' }),

  // Extraction job ids handed out by /api/apply/upload, for the "Statements:" summary in the
  // email. The statements themselves travel as files next to this payload (see /api/apply).
  jobIds: z.array(z.string().regex(EXTRACT_JOB_ID)).max(MAX_UPLOAD_FILES, `You can attach up to ${MAX_UPLOAD_FILES} statements.`).default([]),
  // Which fields still held a value the statement reader put there at submit time; informational,
  // it goes into the email so the reviewer knows what was read rather than typed.
  autofilled: z.array(z.enum(AUTOFILL_FIELDS)).max(AUTOFILL_FIELDS.length).default([]),

  // The drop-off session this submission closes, when capture got as far as minting one.
  draftId: z.string().regex(UUID_V4).optional(),
  // Stored statement copies from /api/apply/upload, so the submission's record lists them even
  // when no draft had been saved with them.
  documentIds: z.array(z.string().regex(UUID_V4)).max(MAX_UPLOAD_FILES).optional(),

  token: turnstileToken,
});

export type ApplyRequest = z.infer<typeof applyRequest>;

// ── Drop-off capture (src/lib/apply-draft.ts) ─────────────────────────────────────────────────

const shortText = z.string().trim().max(300).optional();

/** POST /api/apply/session: one Turnstile token buys a draft id. */
export const draftSessionRequest = z.object({
  token: turnstileToken,
  referrer: shortText,
  utm: z.object({ source: shortText, medium: shortText, campaign: shortText }).default({}),
});

/**
 * POST /api/apply/draft: a snapshot of the form as it stands. Deliberately lenient, since a draft
 * is incomplete by definition: any subset of the known fields, each just capped in length.
 */
export const draftSaveRequest = z.object({
  draftId: z.string().regex(UUID_V4),
  fields: z.partialRecord(z.enum(DRAFT_FIELDS), z.string().max(MAX_DRAFT_VALUE)).default({}),
  autofilled: z.array(z.enum(AUTOFILL_FIELDS)).max(AUTOFILL_FIELDS.length).default([]),
  jobIds: z.array(z.string().regex(EXTRACT_JOB_ID)).max(MAX_UPLOAD_FILES).default([]),
  // Stored statement copies from /api/apply/upload; same uuid shape as a draft id.
  documentIds: z.array(z.string().regex(UUID_V4)).max(MAX_UPLOAD_FILES).optional(),
});
