import { z } from 'astro/zod';

// The apply form's rules, enforced by the /api/apply endpoint. Server-only: the page script does
// its own lightweight checks for friendly errors, so zod stays out of the client bundle.

const name = (label: string) => z.string().trim().min(1, `Please enter your ${label}.`).max(200, 'That name is too long.');
const money = (label: string) => z.coerce.number({ error: `Please enter your ${label}.` }).min(0).max(1_000_000_000);
const line = (label: string, max = 300) => z.string().trim().min(1, `Please enter your ${label}.`).max(max, 'That entry is too long.');

/** The JSON body POSTed to /api/apply. */
export const applyRequest = z.object({
  legalBusinessName: line('legal business name'),
  dba: z.string().trim().max(200).default(''),
  firstName: name('first name'),
  lastName: name('last name'),
  mobile: z.string().trim().min(7, 'Please enter a valid mobile number.').max(30, 'Please enter a valid mobile number.'),
  email: z.string().trim().pipe(z.email('Please enter a valid email address.').max(254, 'That email is too long.')),
  monthlyRevenue: money('monthly business revenue'),

  homeAddress: line('home address'),
  businessAddress: line('business address'),

  businessStartDate: z.iso.date({ error: 'Please enter your business start date.' }),
  businessIndustry: line('business industry', 200),
  ficoScore: z.coerce.number({ error: 'Please enter your estimated FICO score.' }).int().min(300).max(850),
  fundingAmount: money('requested funding amount'),

  token: z.string().min(1).max(2048),
});

export type ApplyRequest = z.infer<typeof applyRequest>;
