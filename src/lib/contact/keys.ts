// Client-safe half of the contact reveal: which details exist and what kind each is. The values
// themselves are Worker secrets, read by ./values.ts, which only the reveal endpoint imports.
// docs/contact-reveal.md.

export const CONTACT_KEYS = ['phone'] as const;
export type ContactKey = (typeof CONTACT_KEYS)[number];

export const CONTACT_META: Record<ContactKey, { kind: 'email' | 'phone'; label: string }> = {
  phone: { kind: 'phone', label: 'Phone' },
};
