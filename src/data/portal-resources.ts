// The broker-only resource library, as the prototype shows it. Gated behind partner sign-in,
// unlike Credibly's public hub. The real version is a `resource` table plus files in R2 under
// resources/<slug>, served through /api/partner/resources/<slug> (docs/partner-portal.md).

export type ResourceCategory = 'Getting started' | 'Underwriting' | 'Products' | 'Portal & tools' | 'Developers' | 'Marketing';

export interface PortalResource {
  slug: string;
  title: string;
  description: string;
  category: ResourceCategory;
  /** "PDF", "Video", "Guide", "Form". Decides the icon and the action label. */
  kind: 'PDF' | 'Video' | 'Guide' | 'Form';
  updatedAt: string;
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = ['Getting started', 'Underwriting', 'Products', 'Portal & tools', 'Developers', 'Marketing'];

export const portalResources: PortalResource[] = [
  { slug: 'partner-guide', title: 'Partner guide', description: 'Products, process and who to call. Start here.', category: 'Getting started', kind: 'PDF', updatedAt: '2026-09-02' },
  { slug: 'submission-checklist', title: 'Submission checklist', description: 'What a complete package contains and how to name files so it clears intake first time.', category: 'Getting started', kind: 'PDF', updatedAt: '2026-09-02' },
  { slug: 'underwriting-guidelines', title: 'Underwriting guidelines', description: 'Minimums per product, how we read statements, what gets a deal put on hold.', category: 'Underwriting', kind: 'PDF', updatedAt: '2026-08-14' },
  { slug: 'industries', title: 'Top and restricted industries', description: 'One page: what we fund readily, what needs a second look, what we do not fund.', category: 'Underwriting', kind: 'PDF', updatedAt: '2026-08-14' },
  { slug: 'stacking-policy', title: 'Open positions and stacking', description: 'How existing advances affect eligibility and why they must be disclosed up front.', category: 'Underwriting', kind: 'Guide', updatedAt: '2026-07-30' },
  { slug: 'mca-one-pager', title: 'Merchant cash advance one-pager', description: 'Amounts, terms, buy rates and best-fit merchants.', category: 'Products', kind: 'PDF', updatedAt: '2026-06-20' },
  { slug: 'term-one-pager', title: 'Term financing one-pager', description: 'Fixed payments, 6 to 60 months, what the file needs.', category: 'Products', kind: 'PDF', updatedAt: '2026-06-20' },
  { slug: 'consolidation-one-pager', title: 'Consolidations one-pager', description: 'How a consolidation is structured and priced, and how to spot a good candidate.', category: 'Products', kind: 'PDF', updatedAt: '2026-06-20' },
  { slug: 'renewals', title: 'Renewals info sheet', description: 'When a merchant qualifies for a renewal and how renewal commission is credited.', category: 'Products', kind: 'PDF', updatedAt: '2026-05-11' },
  { slug: 'portal-guide', title: 'Portal guide', description: 'Submitting, tracking, uploading stips and managing your team in this portal.', category: 'Portal & tools', kind: 'Guide', updatedAt: '2026-10-01' },
  { slug: 'calculator-walkthrough', title: 'Commission calculator walkthrough', description: 'Four minutes on buy rate, points and what the merchant sees.', category: 'Portal & tools', kind: 'Video', updatedAt: '2026-10-01' },
  { slug: 'api-reference', title: 'API reference', description: 'Submit, upload documents, read status and offers, receive webhooks.', category: 'Developers', kind: 'Guide', updatedAt: '2026-10-15' },
  { slug: 'email-intake', title: 'Submitting by email', description: 'Your inbound address, which senders are accepted and what the auto-reply contains.', category: 'Developers', kind: 'Guide', updatedAt: '2026-10-15' },
  { slug: 'marketing-request', title: 'Co-branded marketing materials', description: 'Request flyers and email templates with your logo and contact details.', category: 'Marketing', kind: 'Form', updatedAt: '2026-09-20' },
];
