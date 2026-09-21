import { z } from 'astro/zod';
import freeEmailDomains from 'free-email-domains';

// The partner form's rules, enforced by the /api/partner endpoint. Server-only: the page script
// does its own lightweight checks for friendly errors, so zod (and the domain list below) stay
// out of the client bundle.

export const MESSAGE_MAX_CHARS = 10_000;

// Consumer webmail providers (gmail.com, yahoo.com, ...). Partner inquiries are gated on a
// business email, so anyone typing one of these gets a friendly nudge instead of a silent accept.
const FREE_EMAIL_DOMAINS = new Set(freeEmailDomains);

function isBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return !!domain && !FREE_EMAIL_DOMAINS.has(domain);
}

export const PARTNER_ROLES = ['lender', 'broker', 'service_provider'] as const;
export type PartnerRole = (typeof PARTNER_ROLES)[number];

/** The fields a visitor types. */
export const partnerFields = z.object({
  // Collapse newlines so the name is safe to place in an email subject.
  name: z.string().transform((s) => s.replace(/[\r\n]+/g, ' ').trim()).pipe(
    z.string().min(1, 'Please enter your name.').max(200, 'That name is too long.'),
  ),
  email: z.string().trim().pipe(
    z.email('Please enter a valid email address.').max(254, 'That email is too long.'),
  ).refine(isBusinessEmail, { message: 'Please use your business email address.' }),
  role: z.enum(PARTNER_ROLES),
});

/** The message as plain text: what the visitor sees, and what the limit is measured against. */
export const messageText = z
  .string()
  .trim()
  .min(1, 'Please enter a message.')
  .max(MESSAGE_MAX_CHARS, 'Your message is too long.');

/** The JSON body POSTed to /api/partner. */
export const partnerRequest = partnerFields.extend({
  // Raw editor HTML. Capped generously here; the real limit is `messageText` after sanitizing.
  html: z.string().min(1).max(MESSAGE_MAX_CHARS * 10),
  token: z.string().min(1).max(2048),
});

export type PartnerRequest = z.infer<typeof partnerRequest>;
