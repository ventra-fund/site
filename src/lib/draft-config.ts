// Shapes for the drop-off records the old public application form (/apply, since removed: the
// site is ISO-only) captured, read by the admin pages and the signing flow for the applications
// already stored. Keep this module dependency-free: it is shipped to the browser.

/** The application fields a draft snapshot records, by input `name`. */
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

/** Draft ids and document ids (documents.ts) are both server-minted v4 UUIDs. */
export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
