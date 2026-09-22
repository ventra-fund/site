import { z } from 'astro/zod';
import { emailAddress, singleLine, turnstileToken } from './message-schema';

// The apply form's rules, enforced by the /api/apply endpoint. Server-only: the page script does
// its own lightweight checks for friendly errors, so zod stays out of the client bundle. Keep the
// constraints in step with the inputs in src/pages/apply.astro (minlength/pattern/max there mirror
// the rules here, so a visitor is told before submitting rather than by a 400 afterwards).

const name = (label: string) => z.string().trim().min(1, `Please enter your ${label}.`).max(200, 'That name is too long.');
const money = (label: string) => z.coerce.number({ error: `Please enter your ${label}.` }).min(0).max(1_000_000_000);
const line = (label: string, max = 300) => z.string().trim().min(1, `Please enter your ${label}.`).max(max, 'That entry is too long.');

/** Today as YYYY-MM-DD in UTC; a start date can't be later than this. */
const todayIso = () => new Date().toISOString().slice(0, 10);

/** The JSON body POSTed to /api/apply. */
export const applyRequest = z.object({
  // Goes into the email subject, so newlines are collapsed like the other forms' name fields.
  legalBusinessName: singleLine('legal business name', 300),
  dba: z.string().trim().max(200).default(''),
  firstName: name('first name'),
  lastName: name('last name'),
  mobile: z.string().trim().min(7, 'Please enter a valid mobile number.').max(30, 'Please enter a valid mobile number.'),
  email: emailAddress,
  monthlyRevenue: money('monthly business revenue'),

  homeAddress: line('home address'),
  businessAddress: line('business address'),

  businessStartDate: z.iso.date({ error: 'Please enter your business start date.' })
    .refine((d) => d <= todayIso(), { message: "The start date can't be in the future." }),
  businessIndustry: line('business industry', 200),
  ficoScore: z.coerce.number({ error: 'Please enter your estimated FICO score.' }).int().min(300).max(850),
  fundingAmount: money('requested funding amount'),

  token: turnstileToken,
});

export type ApplyRequest = z.infer<typeof applyRequest>;
