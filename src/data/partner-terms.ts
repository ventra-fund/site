// Partner terms as shown on /partner/terms. The numbers come from the commission plan so the
// page and the calculator agree; the policy text is prototype copy for review.
import { DEFAULT_COMMISSION_PLAN as plan, PAPER_GRADE_LABEL } from './commission-plan';

export interface TermsSection {
  id: string;
  title: string;
  /** Short paragraphs, rendered in order. */
  body: string[];
  /** Optional label/value rows under the paragraphs. */
  rows?: { label: string; value: string }[];
}

export const partnerTerms: TermsSection[] = [
  {
    id: 'commission',
    title: 'Commission schedule',
    body: [
      'Every funded deal pays commission on the funded amount, in points. You set the points when you price the deal, up to the maximum below; the merchant’s factor is the buy rate plus your points.',
      'Your plan is set by your relationship manager and can differ from the standard plan shown here. The calculator always uses your plan.',
    ],
    rows: [
      ...(Object.keys(plan.buyRates) as (keyof typeof plan.buyRates)[]).map((g) => ({ label: `Buy rate, ${PAPER_GRADE_LABEL[g]}`, value: plan.buyRates[g].toFixed(2) })),
      { label: 'Maximum upsell', value: `${plan.maxUpsellPoints} points` },
      { label: 'Renewal commission', value: `${plan.renewalPoints} points, credited to the submitting partner` },
    ],
  },
  {
    id: 'payout',
    title: 'Payout timing',
    body: ['Commission is paid by ACH to the account on file once the merchant’s funding has settled.'],
    rows: [
      { label: 'Timing', value: plan.payoutTiming },
      { label: 'Statement', value: 'An itemised remittance is emailed with every payout and listed under each deal' },
    ],
  },
  {
    id: 'clawback',
    title: 'Clawback',
    body: [
      `If a merchant defaults, stops payments, or the advance is reversed within ${plan.clawbackDays} days of funding, the commission on that deal is clawed back from the next payout. Nothing is clawed back after that window.`,
    ],
  },
  {
    id: 'exclusivity',
    title: 'Submitting partner of record',
    body: [
      'The partner that submits a merchant first is the partner of record for 90 days. A second submission of the same merchant in that window is declined back to the sender and the original partner keeps renewal rights.',
    ],
  },
  {
    id: 'conduct',
    title: 'Conduct',
    body: [
      'Disclose every open position on the merchant. Do not promise approval, specific terms or savings before an offer is issued. No double funding: a merchant funded with us may not be placed with another funder on the same statements without telling us.',
      'Merchant data you send us is handled under our privacy policy; you confirm you have the merchant’s consent to share it.',
    ],
  },
  {
    id: 'agreement',
    title: 'Agreement',
    body: ['The signed ISO agreement governs. The copy on file for your organisation is available below, with the W-9 we hold.'],
  },
];
