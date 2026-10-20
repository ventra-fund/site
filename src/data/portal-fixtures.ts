// Fixture data for the partner portal prototype. Every page under /partner/* renders from this
// file, so the UX can be walked in `pnpm dev` with no database, auth or bindings.
//
// The interfaces are the row shapes the real tables will have (docs/partner-portal.md, "Data
// model"): when the portal is wired up, the pages swap this module for D1 queries and keep their
// templates. Dates are fixed ISO strings and "now" is a constant, so the prerendered pages are
// deterministic.
import type { PaperGrade } from './commission-plan';

/** The prototype's clock, so "3 days ago" never drifts between builds. */
export const FIXTURE_NOW = '2026-10-20T14:00:00Z';

// ── Statuses ─────────────────────────────────────────────────────────────────────────────────

/** Credibly-compatible subset. v1 of the real portal uses only the first three. */
export type DealStatus =
  | 'received'
  | 'needs_details'
  | 'in_review'
  | 'on_hold'
  | 'offers_ready'
  | 'offer_selected'
  | 'contracts_out'
  | 'final_diligence'
  | 'funded'
  | 'declined'
  | 'withdrawn';

export const DEAL_STATUS: Record<DealStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger'; help: string }> = {
  received: { label: 'Received', tone: 'info', help: 'We have the package. Nothing to do yet.' },
  needs_details: { label: 'Needs details', tone: 'warning', help: 'Some fields or documents are missing. Finish the submission to move it on.' },
  in_review: { label: 'In review', tone: 'info', help: 'Underwriting is on it.' },
  on_hold: { label: 'On hold', tone: 'warning', help: 'Underwriting needs something from you. See the request on the deal.' },
  offers_ready: { label: 'Offers ready', tone: 'success', help: 'Offers are out. Pick one with your merchant.' },
  offer_selected: { label: 'Offer selected', tone: 'info', help: 'Contracts are being prepared.' },
  contracts_out: { label: 'Contracts out', tone: 'info', help: 'Contracts are with the merchant for signature.' },
  final_diligence: { label: 'Final diligence', tone: 'warning', help: 'Signed. Clear the remaining stips to fund.' },
  funded: { label: 'Funded', tone: 'success', help: 'Done. Commission is on its way.' },
  declined: { label: 'Declined', tone: 'danger', help: 'Not a fit this time. See the reasons on the deal.' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral', help: 'Withdrawn by your team.' },
};

/** The pipeline stepper's stages, in order, and which statuses count under each. */
export const PIPELINE_STAGES: { key: string; label: string; statuses: DealStatus[] }[] = [
  { key: 'submitted', label: 'Submitted', statuses: ['received', 'needs_details'] },
  { key: 'review', label: 'In review', statuses: ['in_review', 'on_hold'] },
  { key: 'offers', label: 'Offers', statuses: ['offers_ready', 'offer_selected'] },
  { key: 'contracts', label: 'Contracts', statuses: ['contracts_out', 'final_diligence'] },
  { key: 'funded', label: 'Funded', statuses: ['funded'] },
];

export type DealSource = 'portal' | 'email' | 'api';
export const SOURCE_LABEL: Record<DealSource, string> = { portal: 'Portal', email: 'Email', api: 'API' };

export type Product = 'Merchant Cash Advance' | 'Term Financing' | 'Line of Credit' | 'Consolidation' | 'Cash Credit';

// ── Organisation and people ───────────────────────────────────────────────────────────────────

export interface PartnerOrg {
  id: string;
  name: string;
  slug: string;
  legalName: string;
  /** Masked for display; the real column is encrypted like the signing identifiers. */
  einMasked: string;
  status: 'applied' | 'active' | 'suspended';
  relationshipManager: { name: string; email: string; phone: string };
  /** Where this org emails packages. One alias per org, so the sender's org is never guessed. */
  inboundAlias: string;
  agreementSignedAt: string;
  w9ReceivedAt: string;
}

export type OrgRole = 'owner' | 'admin' | 'member';
export const ROLE_LABEL: Record<OrgRole, { label: string; help: string }> = {
  owner: { label: 'Owner', help: 'Everything, including billing details and deleting the organisation.' },
  admin: { label: 'Admin', help: 'All deals, team, API keys and settings.' },
  member: { label: 'Member', help: 'Submits deals and sees only their own.' },
};

export interface PartnerUser {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
  status: 'active' | 'invited' | 'deactivated';
  lastActiveAt: string | null;
  signInMethod: 'code' | 'password_code' | 'passkey';
}

// ── Deals ─────────────────────────────────────────────────────────────────────────────────────

export interface Deal {
  id: string;
  /** Human reference shown everywhere and used in email subjects. */
  number: string;
  orgId: string;
  submittedBy: string;
  source: DealSource;
  status: DealStatus;
  dba: string;
  legalName: string;
  industry: string;
  state: string;
  product: Product;
  amountRequested: number;
  monthlyRevenue: number | null;
  paperGrade: PaperGrade | null;
  openPositions: number;
  submittedAt: string;
  updatedAt: string;
  /** Reference the partner's CRM attached (API submissions). */
  externalRef?: string;
  declineReasons?: string[];
}

export type FileKind = 'application' | 'bank_statement' | 'id' | 'voided_check' | 'processing' | 'other';
export const FILE_KIND_LABEL: Record<FileKind, string> = {
  application: 'Signed application',
  bank_statement: 'Bank statement',
  id: 'Owner ID',
  voided_check: 'Voided check',
  processing: 'Processing statement',
  other: 'Other',
};

export interface DealFile {
  id: string;
  dealId: string;
  name: string;
  kind: FileKind;
  bytes: number;
  mime: 'application/pdf' | 'image/jpeg' | 'image/png';
  uploadedAt: string;
  /** A user id, or the channel when the file came in by email or API. */
  uploadedBy: string;
  status: 'stored' | 'duplicate' | 'rejected';
}

export interface DealEvent {
  id: string;
  dealId: string;
  at: string;
  type: 'submitted' | 'status' | 'file' | 'stip' | 'offer' | 'note' | 'email';
  /** Who did it: a user id, 'underwriting', 'system'. */
  actor: string;
  text: string;
}

export interface Stip {
  id: string;
  dealId: string;
  shortText: string;
  longText: string;
  status: 'open' | 'received' | 'cleared';
}

export interface Offer {
  id: string;
  dealId: string;
  product: Product;
  amount: number;
  grade: PaperGrade;
  points: number;
  termMonths: number;
  frequency: 'daily' | 'weekly';
  status: 'open' | 'selected' | 'expired';
}

// ── Developers ────────────────────────────────────────────────────────────────────────────────

export type ApiScope = 'submissions:write' | 'submissions:read' | 'documents:write' | 'offers:read' | 'webhooks:manage';
export const API_SCOPES: { key: ApiScope; label: string }[] = [
  { key: 'submissions:write', label: 'Create and amend submissions' },
  { key: 'submissions:read', label: 'Read submissions and status' },
  { key: 'documents:write', label: 'Upload documents' },
  { key: 'offers:read', label: 'Read offers' },
  { key: 'webhooks:manage', label: 'Manage webhook endpoints' },
];

export interface ApiKey {
  id: string;
  name: string;
  /** What is shown after creation: the prefix and the last four, never the key. */
  display: string;
  environment: 'live' | 'test';
  scopes: ApiScope[];
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  status: 'active' | 'revoked';
}

export type WebhookEvent = 'submission.status_changed' | 'offer.created' | 'stip.requested';
export const WEBHOOK_EVENTS: { key: WebhookEvent; label: string }[] = [
  { key: 'submission.status_changed', label: 'Submission status changed' },
  { key: 'offer.created', label: 'Offer created' },
  { key: 'stip.requested', label: 'Stip requested' },
];

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEvent[];
  status: 'active' | 'paused';
  /** Last four of the signing secret; the secret is shown once at creation. */
  secretHint: string;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  dealNumber: string;
  at: string;
  status: 'delivered' | 'failed' | 'retrying';
  attempts: number;
  responseCode: number | null;
}

export interface IntakeEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  receivedAt: string;
  attachments: number;
  status: 'matched' | 'unmatched' | 'rejected';
  orgId: string | null;
  dealId: string | null;
  note: string;
}

// ── The fixtures ──────────────────────────────────────────────────────────────────────────────

export const org: PartnerOrg = {
  id: 'org_summit',
  name: 'Summit Capital Partners',
  slug: 'summit',
  legalName: 'Summit Capital Partners LLC',
  einMasked: '••-•••4821',
  status: 'active',
  relationshipManager: { name: 'Dana Whitfield', email: 'dana@ventrafund.com', phone: '(555) 010-4420' },
  inboundAlias: 'deals+summit@submit.ventrafund.com',
  agreementSignedAt: '2026-03-04',
  w9ReceivedAt: '2026-03-04',
};

export const users: PartnerUser[] = [
  { id: 'usr_maya', name: 'Maya Okafor', email: 'maya@summitcp.com', role: 'owner', status: 'active', lastActiveAt: '2026-10-20T13:10:00Z', signInMethod: 'passkey' },
  { id: 'usr_luis', name: 'Luis Herrera', email: 'luis@summitcp.com', role: 'admin', status: 'active', lastActiveAt: '2026-10-19T21:40:00Z', signInMethod: 'password_code' },
  { id: 'usr_priya', name: 'Priya Natarajan', email: 'priya@summitcp.com', role: 'member', status: 'active', lastActiveAt: '2026-10-20T09:05:00Z', signInMethod: 'code' },
  { id: 'usr_tom', name: 'Tom Reyes', email: 'tom@summitcp.com', role: 'member', status: 'invited', lastActiveAt: null, signInMethod: 'code' },
];

/** The signed-in user the prototype renders as. */
export const currentUser = users[0];

export const deals: Deal[] = [
  { id: 'dl_01', number: 'VF-10241', orgId: org.id, submittedBy: 'usr_priya', source: 'portal', status: 'received', dba: 'Harbor Lights Seafood', legalName: 'Harbor Lights Seafood Grill Inc', industry: 'Restaurants', state: 'FL', product: 'Merchant Cash Advance', amountRequested: 85000, monthlyRevenue: 112000, paperGrade: null, openPositions: 1, submittedAt: '2026-10-20T11:42:00Z', updatedAt: '2026-10-20T11:42:00Z' },
  { id: 'dl_02', number: 'VF-10240', orgId: org.id, submittedBy: 'email', source: 'email', status: 'needs_details', dba: 'Peak Performance Auto', legalName: '', industry: '', state: '', product: 'Merchant Cash Advance', amountRequested: 0, monthlyRevenue: null, paperGrade: null, openPositions: 0, submittedAt: '2026-10-20T08:15:00Z', updatedAt: '2026-10-20T08:16:00Z' },
  { id: 'dl_03', number: 'VF-10236', orgId: org.id, submittedBy: 'usr_luis', source: 'api', status: 'in_review', dba: 'Cedar & Pine Dental', legalName: 'Cedar and Pine Dental PLLC', industry: 'Healthcare', state: 'TX', product: 'Term Financing', amountRequested: 250000, monthlyRevenue: 310000, paperGrade: 'B', openPositions: 0, submittedAt: '2026-10-18T16:20:00Z', updatedAt: '2026-10-19T10:02:00Z', externalRef: 'CRM-88213' },
  { id: 'dl_04', number: 'VF-10233', orgId: org.id, submittedBy: 'usr_priya', source: 'portal', status: 'on_hold', dba: 'Riverbend Trucking', legalName: 'Riverbend Trucking LLC', industry: 'Trucking', state: 'OH', product: 'Merchant Cash Advance', amountRequested: 60000, monthlyRevenue: 74000, paperGrade: 'C', openPositions: 2, submittedAt: '2026-10-17T14:05:00Z', updatedAt: '2026-10-19T15:30:00Z' },
  { id: 'dl_05', number: 'VF-10229', orgId: org.id, submittedBy: 'usr_luis', source: 'portal', status: 'offers_ready', dba: 'Bloom & Co Florist', legalName: 'Bloom and Company LLC', industry: 'Retail', state: 'CA', product: 'Merchant Cash Advance', amountRequested: 40000, monthlyRevenue: 52000, paperGrade: 'B', openPositions: 0, submittedAt: '2026-10-15T09:48:00Z', updatedAt: '2026-10-19T17:12:00Z' },
  { id: 'dl_06', number: 'VF-10225', orgId: org.id, submittedBy: 'usr_maya', source: 'api', status: 'offer_selected', dba: 'Northside Fitness', legalName: 'Northside Fitness Group Inc', industry: 'Fitness', state: 'IL', product: 'Merchant Cash Advance', amountRequested: 120000, monthlyRevenue: 165000, paperGrade: 'B', openPositions: 1, submittedAt: '2026-10-13T12:00:00Z', updatedAt: '2026-10-18T11:45:00Z', externalRef: 'CRM-88107' },
  { id: 'dl_07', number: 'VF-10219', orgId: org.id, submittedBy: 'usr_priya', source: 'email', status: 'contracts_out', dba: 'Lakeside Pediatrics', legalName: 'Lakeside Pediatrics PC', industry: 'Healthcare', state: 'MN', product: 'Line of Credit', amountRequested: 75000, monthlyRevenue: 98000, paperGrade: 'B', openPositions: 0, submittedAt: '2026-10-10T15:22:00Z', updatedAt: '2026-10-17T09:30:00Z' },
  { id: 'dl_08', number: 'VF-10212', orgId: org.id, submittedBy: 'usr_luis', source: 'portal', status: 'final_diligence', dba: 'Metro Electric Services', legalName: 'Metro Electric Services Corp', industry: 'Construction', state: 'NJ', product: 'Consolidation', amountRequested: 180000, monthlyRevenue: 240000, paperGrade: 'C', openPositions: 3, submittedAt: '2026-10-07T10:10:00Z', updatedAt: '2026-10-19T08:20:00Z' },
  { id: 'dl_09', number: 'VF-10198', orgId: org.id, submittedBy: 'usr_maya', source: 'portal', status: 'funded', dba: 'Sunrise Bakery', legalName: 'Sunrise Bakery Holdings LLC', industry: 'Food service', state: 'AZ', product: 'Merchant Cash Advance', amountRequested: 50000, monthlyRevenue: 61000, paperGrade: 'B', openPositions: 0, submittedAt: '2026-09-29T13:30:00Z', updatedAt: '2026-10-06T16:00:00Z' },
  { id: 'dl_10', number: 'VF-10190', orgId: org.id, submittedBy: 'usr_priya', source: 'email', status: 'funded', dba: 'Copperline Plumbing', legalName: 'Copperline Plumbing Inc', industry: 'Construction', state: 'CO', product: 'Merchant Cash Advance', amountRequested: 35000, monthlyRevenue: 44000, paperGrade: 'C', openPositions: 1, submittedAt: '2026-09-24T09:00:00Z', updatedAt: '2026-10-02T14:10:00Z' },
  { id: 'dl_11', number: 'VF-10184', orgId: org.id, submittedBy: 'usr_luis', source: 'portal', status: 'declined', dba: 'Golden Gate Vape', legalName: 'GG Vape LLC', industry: 'Tobacco & vape', state: 'CA', product: 'Merchant Cash Advance', amountRequested: 30000, monthlyRevenue: 28000, paperGrade: null, openPositions: 2, submittedAt: '2026-09-22T17:40:00Z', updatedAt: '2026-09-23T10:15:00Z', declineReasons: ['Restricted industry', 'Two open positions on under $30k monthly deposits'] },
  { id: 'dl_12', number: 'VF-10177', orgId: org.id, submittedBy: 'usr_priya', source: 'portal', status: 'withdrawn', dba: 'Willow Creek Landscaping', legalName: 'Willow Creek Landscaping LLC', industry: 'Landscaping', state: 'GA', product: 'Term Financing', amountRequested: 90000, monthlyRevenue: 70000, paperGrade: null, openPositions: 0, submittedAt: '2026-09-18T11:05:00Z', updatedAt: '2026-09-20T09:00:00Z' },
];

export const files: DealFile[] = [
  { id: 'f_01', dealId: 'dl_01', name: 'HarborLights_Application_signed.pdf', kind: 'application', bytes: 412_000, mime: 'application/pdf', uploadedAt: '2026-10-20T11:40:00Z', uploadedBy: 'usr_priya', status: 'stored' },
  { id: 'f_02', dealId: 'dl_01', name: 'HarborLights_BankStmt_Jul.pdf', kind: 'bank_statement', bytes: 1_840_000, mime: 'application/pdf', uploadedAt: '2026-10-20T11:40:00Z', uploadedBy: 'usr_priya', status: 'stored' },
  { id: 'f_03', dealId: 'dl_01', name: 'HarborLights_BankStmt_Aug.pdf', kind: 'bank_statement', bytes: 1_910_000, mime: 'application/pdf', uploadedAt: '2026-10-20T11:41:00Z', uploadedBy: 'usr_priya', status: 'stored' },
  { id: 'f_04', dealId: 'dl_01', name: 'HarborLights_BankStmt_Sep.pdf', kind: 'bank_statement', bytes: 1_770_000, mime: 'application/pdf', uploadedAt: '2026-10-20T11:41:00Z', uploadedBy: 'usr_priya', status: 'stored' },
  { id: 'f_05', dealId: 'dl_01', name: 'HarborLights_BankStmt_Sep (1).pdf', kind: 'bank_statement', bytes: 1_770_000, mime: 'application/pdf', uploadedAt: '2026-10-20T11:41:30Z', uploadedBy: 'usr_priya', status: 'duplicate' },
  { id: 'f_06', dealId: 'dl_02', name: 'Peak Auto app.pdf', kind: 'application', bytes: 380_000, mime: 'application/pdf', uploadedAt: '2026-10-20T08:15:00Z', uploadedBy: 'email', status: 'stored' },
  { id: 'f_07', dealId: 'dl_02', name: 'statement-july.pdf', kind: 'bank_statement', bytes: 2_100_000, mime: 'application/pdf', uploadedAt: '2026-10-20T08:15:00Z', uploadedBy: 'email', status: 'stored' },
  { id: 'f_08', dealId: 'dl_02', name: 'statement-aug.pdf', kind: 'bank_statement', bytes: 2_050_000, mime: 'application/pdf', uploadedAt: '2026-10-20T08:15:00Z', uploadedBy: 'email', status: 'stored' },
  { id: 'f_09', dealId: 'dl_02', name: 'IMG_4471.heic', kind: 'other', bytes: 3_400_000, mime: 'image/jpeg', uploadedAt: '2026-10-20T08:15:00Z', uploadedBy: 'email', status: 'rejected' },
  { id: 'f_10', dealId: 'dl_04', name: 'Riverbend_Application.pdf', kind: 'application', bytes: 401_000, mime: 'application/pdf', uploadedAt: '2026-10-17T14:00:00Z', uploadedBy: 'usr_priya', status: 'stored' },
  { id: 'f_11', dealId: 'dl_04', name: 'Riverbend_BankStmt_Jun-Sep.pdf', kind: 'bank_statement', bytes: 6_200_000, mime: 'application/pdf', uploadedAt: '2026-10-17T14:02:00Z', uploadedBy: 'usr_priya', status: 'stored' },
  { id: 'f_12', dealId: 'dl_05', name: 'Bloom_Application.pdf', kind: 'application', bytes: 390_000, mime: 'application/pdf', uploadedAt: '2026-10-15T09:45:00Z', uploadedBy: 'usr_luis', status: 'stored' },
  { id: 'f_13', dealId: 'dl_05', name: 'Bloom_BankStmts_Jul-Sep.pdf', kind: 'bank_statement', bytes: 4_800_000, mime: 'application/pdf', uploadedAt: '2026-10-15T09:46:00Z', uploadedBy: 'usr_luis', status: 'stored' },
  { id: 'f_14', dealId: 'dl_05', name: 'Bloom_VoidedCheck.jpg', kind: 'voided_check', bytes: 920_000, mime: 'image/jpeg', uploadedAt: '2026-10-15T09:47:00Z', uploadedBy: 'usr_luis', status: 'stored' },
  { id: 'f_15', dealId: 'dl_08', name: 'MetroElectric_Application.pdf', kind: 'application', bytes: 455_000, mime: 'application/pdf', uploadedAt: '2026-10-07T10:05:00Z', uploadedBy: 'usr_luis', status: 'stored' },
  { id: 'f_16', dealId: 'dl_08', name: 'MetroElectric_BankStmts.pdf', kind: 'bank_statement', bytes: 7_900_000, mime: 'application/pdf', uploadedAt: '2026-10-07T10:06:00Z', uploadedBy: 'usr_luis', status: 'stored' },
  { id: 'f_17', dealId: 'dl_08', name: 'MetroElectric_PayoffLetters.pdf', kind: 'other', bytes: 610_000, mime: 'application/pdf', uploadedAt: '2026-10-16T13:20:00Z', uploadedBy: 'usr_luis', status: 'stored' },
];

export const events: DealEvent[] = [
  { id: 'e_01', dealId: 'dl_01', at: '2026-10-20T11:42:00Z', type: 'submitted', actor: 'usr_priya', text: 'Submitted from the portal with 4 documents.' },
  { id: 'e_02', dealId: 'dl_01', at: '2026-10-20T11:42:05Z', type: 'email', actor: 'system', text: 'Package sent to underwriting. Confirmation emailed to priya@summitcp.com.' },
  { id: 'e_03', dealId: 'dl_02', at: '2026-10-20T08:15:00Z', type: 'email', actor: 'system', text: 'Email received from priya@summitcp.com: "Peak Performance Auto - MCA 45k - Summit". 4 attachments, 1 rejected (IMG_4471.heic is not a PDF or image we accept).' },
  { id: 'e_04', dealId: 'dl_02', at: '2026-10-20T08:16:00Z', type: 'status', actor: 'system', text: 'Set to Needs details: legal name, EIN, owner and requested amount are missing. Auto-reply sent with a link to finish.' },
  { id: 'e_05', dealId: 'dl_03', at: '2026-10-18T16:20:00Z', type: 'submitted', actor: 'usr_luis', text: 'Submitted via API (key "Cloudsquare prod", ref CRM-88213).' },
  { id: 'e_06', dealId: 'dl_03', at: '2026-10-19T10:02:00Z', type: 'status', actor: 'underwriting', text: 'In review. Assigned to the term desk.' },
  { id: 'e_07', dealId: 'dl_04', at: '2026-10-17T14:05:00Z', type: 'submitted', actor: 'usr_priya', text: 'Submitted from the portal with 2 documents.' },
  { id: 'e_08', dealId: 'dl_04', at: '2026-10-19T15:30:00Z', type: 'stip', actor: 'underwriting', text: 'On hold: the September statement is missing pages 3 to 5, and we need the balance letters for both open positions.' },
  { id: 'e_09', dealId: 'dl_05', at: '2026-10-15T09:48:00Z', type: 'submitted', actor: 'usr_luis', text: 'Submitted from the portal with 3 documents.' },
  { id: 'e_10', dealId: 'dl_05', at: '2026-10-19T17:12:00Z', type: 'offer', actor: 'underwriting', text: 'Two offers issued. Valid for 7 days.' },
  { id: 'e_11', dealId: 'dl_08', at: '2026-10-19T08:20:00Z', type: 'status', actor: 'underwriting', text: 'Contracts received. Final diligence: 2 stips open.' },
  { id: 'e_12', dealId: 'dl_09', at: '2026-10-06T16:00:00Z', type: 'status', actor: 'underwriting', text: 'Funded $50,000. Commission $5,000 (10 points) scheduled for Oct 7.' },
  { id: 'e_13', dealId: 'dl_11', at: '2026-09-23T10:15:00Z', type: 'status', actor: 'underwriting', text: 'Declined: restricted industry; two open positions on under $30k monthly deposits.' },
];

export const stips: Stip[] = [
  { id: 's_01', dealId: 'dl_04', shortText: 'September statement, pages 3 to 5', longText: 'The uploaded September statement stops at page 2. Please upload the complete statement.', status: 'open' },
  { id: 's_02', dealId: 'dl_04', shortText: 'Balance letters for open positions', longText: 'A current payoff or balance letter from each of the two funders on file.', status: 'open' },
  { id: 's_03', dealId: 'dl_08', shortText: 'Payoff letters', longText: 'Payoff letters for all three positions being consolidated, dated within 5 days.', status: 'received' },
  { id: 's_04', dealId: 'dl_08', shortText: 'Voided business check', longText: 'A voided check or bank letter for the funding account.', status: 'open' },
  { id: 's_05', dealId: 'dl_08', shortText: 'Owner ID', longText: 'Government-issued ID for the 60% owner.', status: 'cleared' },
];

export const offers: Offer[] = [
  { id: 'o_01', dealId: 'dl_05', product: 'Merchant Cash Advance', amount: 40000, grade: 'B', points: 10, termMonths: 8, frequency: 'daily', status: 'open' },
  { id: 'o_02', dealId: 'dl_05', product: 'Merchant Cash Advance', amount: 32000, grade: 'B', points: 12, termMonths: 6, frequency: 'weekly', status: 'open' },
  { id: 'o_03', dealId: 'dl_06', product: 'Merchant Cash Advance', amount: 110000, grade: 'B', points: 9, termMonths: 10, frequency: 'daily', status: 'selected' },
];

export const apiKeys: ApiKey[] = [
  { id: 'k_01', name: 'Cloudsquare prod', display: 'vf_live_…9f2a', environment: 'live', scopes: ['submissions:write', 'submissions:read', 'documents:write', 'offers:read'], createdAt: '2026-06-02T10:00:00Z', createdBy: 'usr_maya', lastUsedAt: '2026-10-20T13:02:00Z', expiresAt: null, status: 'active' },
  { id: 'k_02', name: 'Staging', display: 'vf_test_…c41d', environment: 'test', scopes: ['submissions:write', 'submissions:read', 'documents:write', 'offers:read', 'webhooks:manage'], createdAt: '2026-05-28T15:30:00Z', createdBy: 'usr_luis', lastUsedAt: '2026-10-14T18:22:00Z', expiresAt: '2027-05-28T00:00:00Z', status: 'active' },
  { id: 'k_03', name: 'Zapier (old)', display: 'vf_live_…0b7e', environment: 'live', scopes: ['submissions:read'], createdAt: '2026-04-11T09:12:00Z', createdBy: 'usr_maya', lastUsedAt: '2026-08-30T11:00:00Z', expiresAt: null, status: 'revoked' },
];

export const webhookEndpoints: WebhookEndpoint[] = [
  { id: 'w_01', url: 'https://hooks.summitcp.com/ventra', events: ['submission.status_changed', 'offer.created', 'stip.requested'], status: 'active', secretHint: '…7d3e', createdAt: '2026-06-02T10:05:00Z' },
];

export const webhookDeliveries: WebhookDelivery[] = [
  { id: 'd_01', endpointId: 'w_01', event: 'submission.status_changed', dealNumber: 'VF-10236', at: '2026-10-19T10:02:03Z', status: 'delivered', attempts: 1, responseCode: 200 },
  { id: 'd_02', endpointId: 'w_01', event: 'stip.requested', dealNumber: 'VF-10233', at: '2026-10-19T15:30:02Z', status: 'delivered', attempts: 1, responseCode: 200 },
  { id: 'd_03', endpointId: 'w_01', event: 'offer.created', dealNumber: 'VF-10229', at: '2026-10-19T17:12:04Z', status: 'delivered', attempts: 2, responseCode: 200 },
  { id: 'd_04', endpointId: 'w_01', event: 'submission.status_changed', dealNumber: 'VF-10240', at: '2026-10-20T08:16:02Z', status: 'retrying', attempts: 3, responseCode: 503 },
  { id: 'd_05', endpointId: 'w_01', event: 'submission.status_changed', dealNumber: 'VF-10241', at: '2026-10-20T11:42:06Z', status: 'failed', attempts: 5, responseCode: 503 },
];

export const intakeEmails: IntakeEmail[] = [
  { id: 'ie_01', from: 'priya@summitcp.com', to: org.inboundAlias, subject: 'Peak Performance Auto - MCA 45k - Summit', receivedAt: '2026-10-20T08:15:00Z', attachments: 4, status: 'matched', orgId: org.id, dealId: 'dl_02', note: 'Sender is a member. Deal VF-10240 created.' },
  { id: 'ie_02', from: 'priya@summitcp.com', to: org.inboundAlias, subject: 'Lakeside Pediatrics LOC', receivedAt: '2026-10-10T15:22:00Z', attachments: 5, status: 'matched', orgId: org.id, dealId: 'dl_07', note: 'Sender is a member. Deal VF-10219 created.' },
  { id: 'ie_03', from: 'j.park@gmail.com', to: org.inboundAlias, subject: 'FW: new deal', receivedAt: '2026-10-19T19:48:00Z', attachments: 3, status: 'unmatched', orgId: org.id, dealId: null, note: 'Sender is not on the team. Held for review; nothing created.' },
  { id: 'ie_04', from: 'noreply@newsletter.example.com', to: 'deals@submit.ventrafund.com', subject: 'Your weekly digest', receivedAt: '2026-10-18T06:00:00Z', attachments: 0, status: 'rejected', orgId: null, dealId: null, note: 'No org alias and no attachments. Dropped.' },
];

// ── Helpers the pages share ───────────────────────────────────────────────────────────────────

export const userById = (id: string) => users.find((u) => u.id === id);
export const userName = (id: string) => userById(id)?.name ?? (id === 'email' ? 'Email intake' : id === 'api' ? 'API' : id === 'underwriting' ? 'Underwriting' : 'System');
export const dealByNumber = (n: string) => deals.find((d) => d.number === n);
export const filesFor = (dealId: string) => files.filter((f) => f.dealId === dealId);
export const eventsFor = (dealId: string) => events.filter((e) => e.dealId === dealId).sort((a, b) => (a.at < b.at ? 1 : -1));
export const stipsFor = (dealId: string) => stips.filter((s) => s.dealId === dealId);
export const offersFor = (dealId: string) => offers.filter((o) => o.dealId === dealId);

/** What the partner should do next on a deal, if anything. The pipeline's "Next action" column. */
export function nextAction(deal: Deal): { label: string; href: string } | null {
  const detail = `/partner/deals/${deal.number}`;
  switch (deal.status) {
    case 'needs_details': return { label: 'Finish submission', href: `${detail}#details` };
    case 'on_hold': return { label: `Upload required docs (${stipsFor(deal.id).filter((s) => s.status === 'open').length})`, href: `${detail}#files` };
    case 'offers_ready': return { label: 'View offers', href: `${detail}#offers` };
    case 'final_diligence': return { label: `Upload stips (${stipsFor(deal.id).filter((s) => s.status === 'open').length})`, href: `${detail}#files` };
    case 'contracts_out': return { label: 'Check contract status', href: detail };
    default: return null;
  }
}

/** Whole days between an ISO time and the fixture clock. */
export const daysSince = (iso: string, now = FIXTURE_NOW) => Math.max(0, Math.floor((Date.parse(now) - Date.parse(iso)) / 86_400_000));

/** "Oct 20, 2026" */
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
/** "Oct 20, 14:00" */
export const formatDateTime = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
/** "3 days ago", "today" */
export function relativeDay(iso: string): string {
  const d = daysSince(iso);
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
}
export const formatBytes = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`);
