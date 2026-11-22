import { z } from 'astro/zod';
import { emailAddress, singleLine } from './message-schema';
import { isFullAddress } from './address-shape';

// The rules for a merchant application's fields. The public application form (/apply) is gone (the
// site is ISO-only), but the signing page still has the applicant confirm these fields on
// applications received before then, so /api/sign/[token] checks them with the same rules
// (src/lib/signing-schema.ts). Server-only: zod stays out of the client bundle.

const MAX_NAME = 200;
const MAX_LINE = 300;

const name = (label: string) => z.string().trim().min(1, `Please enter your ${label}.`).max(MAX_NAME, 'That name is too long.');
const money = (label: string) => z.coerce.number({ error: `Please enter your ${label}.` }).min(0).max(1_000_000_000);
const line = (label: string, max = MAX_LINE) => z.string().trim().min(1, `Please enter your ${label}.`).max(max, 'That entry is too long.');
// Every part of a full address present (address-shape.ts); nothing checks that it exists.
const address = (label: string) => line(label).refine(isFullAddress, { message: 'Please enter a full address: street number and name, city, state and ZIP code.' });

/** Today as YYYY-MM-DD in UTC; a start date can't be later than this. */
const todayIso = () => new Date().toISOString().slice(0, 10);

/** An application's fields, as the applicant gave them. */
export const applicationFields = z.object({
  // Goes into email subjects, so newlines are collapsed like the other forms' name fields.
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
});
