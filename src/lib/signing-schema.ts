import { z } from 'astro/zod';
import { applyRequest } from './apply-schema';
import { singleLine } from './message-schema';

// The signing page's rules, enforced by /api/sign/[token]. Server-only, like apply-schema.ts: the
// page mirrors the patterns (src/lib/signing-config.ts) for friendly errors before submitting.

/** The application fields the signer confirms, with the same rules as the application itself. */
export const confirmedFields = applyRequest.pick({
  legalBusinessName: true,
  dba: true,
  firstName: true,
  lastName: true,
  mobile: true,
  email: true,
  monthlyRevenue: true,
  homeAddress: true,
  businessAddress: true,
  businessStartDate: true,
  businessIndustry: true,
  ficoScore: true,
  fundingAmount: true,
});

export type ConfirmedFields = z.infer<typeof confirmedFields>;

const digits = (s: string) => s.replace(/[\s-]/g, '');

// The IRS never issues these EIN prefixes.
const INVALID_EIN_PREFIXES = new Set(['00', '07', '08', '09', '17', '18', '19', '28', '29', '49', '69', '70', '78', '79', '89', '96', '97']);

const ein = z
  .string()
  .transform(digits)
  .pipe(z.string().regex(/^\d{9}$/, 'Please enter your 9-digit EIN.'))
  .refine((d) => !INVALID_EIN_PREFIXES.has(d.slice(0, 2)), { message: "That doesn't look like a valid EIN." });

// Area 000, 666 and 900–999, group 00 and serial 0000 are never issued.
const ssn = z
  .string()
  .transform(digits)
  .pipe(z.string().regex(/^\d{9}$/, 'Please enter your 9-digit SSN.'))
  .refine((d) => !/^(000|666|9)/.test(d) && d.slice(3, 5) !== '00' && d.slice(5) !== '0000', { message: "That doesn't look like a valid SSN." });

/** POST /api/sign/[token]. */
export const signRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('consent') }),
  z.object({
    action: z.literal('sign'),
    fields: confirmedFields,
    ein,
    ssn,
    signerName: singleLine('full legal name', 200),
    attest: z.literal(true, { error: 'Please confirm the statement about your details.' }),
    adopt: z.literal(true, { error: 'Please agree to use the signature above as your electronic signature.' }),
  }),
]);
