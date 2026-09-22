import { z } from 'astro/zod';
import freeEmailDomains from 'free-email-domains';
import { emailAddress, messageHtml, singleLine, turnstileToken } from './message-schema';

// The partner form's rules, enforced by the /api/partner endpoint. Server-only: the page script
// does its own lightweight checks for friendly errors, so zod (and the domain list below) stay
// out of the client bundle.

export { MESSAGE_MAX_CHARS, messageText } from './message-schema';

// Consumer webmail providers (gmail.com, yahoo.com, ...). Partner inquiries are gated on a
// business email, so anyone typing one of these gets a friendly nudge instead of a silent accept.
const FREE_EMAIL_DOMAINS = new Set(freeEmailDomains);

function isBusinessEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return !!domain && !FREE_EMAIL_DOMAINS.has(domain);
}

// Order matters here: the page's role dropdown and interest groups are both built by iterating
// this list, broker first to match the default selection.
export const PARTNER_ROLES = ['broker', 'lender', 'service_provider'] as const;
export type PartnerRole = (typeof PARTNER_ROLES)[number];

/** Per-role checkboxes, keyed by the value that travels in the request. The page renders these
 *  straight from here, so the options shown to a visitor and the ones the server accepts can't
 *  drift apart. */
export const PARTNER_INTERESTS: Record<PartnerRole, { value: string; label: string }[]> = {
  broker: [
    { value: 'consistent_lender', label: "I'm looking for a consistent lender to fund my deals" },
    { value: 'see_terms', label: 'I want to see your terms' },
  ],
  lender: [
    { value: 'deal_flow', label: "I'm looking for deal flow from you" },
    { value: 'off_criteria', label: "I'm sending out deals that don't fit our criteria" },
  ],
  service_provider: [
    { value: 'fintech_services', label: "I'm looking to offer fintech/technology services" },
    { value: 'sales_tools', label: "I'm looking to offer sales tools or services" },
  ],
};

/** The fields a visitor types. */
export const partnerFields = z.object({
  name: singleLine('name', 200),
  email: emailAddress.refine(isBusinessEmail, { message: 'Please use your business email address.' }),
  role: z.enum(PARTNER_ROLES, { error: 'Please select your role.' }),
  // Optional: a visitor can leave every box unchecked. Cross-checked against the chosen role
  // below, since each role has its own set of checkboxes.
  interests: z.array(z.string().max(64)).max(10).default([]),
});

/** The JSON body POSTed to /api/partner. */
export const partnerRequest = partnerFields.extend({
  html: messageHtml,
  token: turnstileToken,
}).refine(
  (data) => data.interests.every((v) => PARTNER_INTERESTS[data.role].some((o) => o.value === v)),
  { message: 'Invalid interests for the selected role.', path: ['interests'] },
);

export type PartnerRequest = z.infer<typeof partnerRequest>;
