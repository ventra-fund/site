// The commission plan the partner portal prices with. One implementation for the calculator
// page (client), the deal and offer views (server render), and later the server-side offer
// math, so the three can never disagree.
//
// Model (standard MCA broker compensation): the funder sets a buy rate per paper grade; the
// partner may sell the deal above it by up to `maxUpsellPoints` points. Each point is 1% of the
// funded amount and goes to the partner as commission. The merchant's payback is funded amount ×
// sell rate.
//
// This default plan is the placeholder agreed for the prototype. Per-partner plans (set from an
// admin session) will override it: see `commission_plan` in docs/partner-portal.md.
// Keep this module dependency-free: it is shipped to the browser.

export type PaperGrade = 'B' | 'C';

export interface CommissionPlan {
  /** Plan name shown on the calculator ("Standard plan"). */
  name: string;
  /** Buy rate (factor) per paper grade, e.g. 1.32. */
  buyRates: Record<PaperGrade, number>;
  /** Most points a partner can add on top of the buy rate. */
  maxUpsellPoints: number;
  /** Points paid on a renewal of a deal this partner funded. */
  renewalPoints: number;
  /** Days after funding during which a default claws the commission back. */
  clawbackDays: number;
  /** When commission is paid, in words. */
  payoutTiming: string;
}

export const DEFAULT_COMMISSION_PLAN: CommissionPlan = {
  name: 'Standard plan',
  buyRates: { B: 1.32, C: 1.36 },
  maxUpsellPoints: 12,
  renewalPoints: 4,
  clawbackDays: 30,
  payoutTiming: 'Next business day after funding',
};

export const PAPER_GRADE_LABEL: Record<PaperGrade, string> = {
  B: 'B paper',
  C: 'C paper',
};

/** Factor the merchant pays: buy rate plus the partner's points (1 point = 0.01). */
export const sellRate = (plan: CommissionPlan, grade: PaperGrade, upsellPoints: number) =>
  round(plan.buyRates[grade] + clampPoints(plan, upsellPoints) / 100, 4);

/** Total the merchant repays. */
export const payback = (fundedAmount: number, rate: number) => round(fundedAmount * rate, 2);

/** The partner's commission in dollars: points on the funded amount. */
export const commission = (plan: CommissionPlan, fundedAmount: number, upsellPoints: number) =>
  round(fundedAmount * (clampPoints(plan, upsellPoints) / 100), 2);

/** Estimated periodic payment for a term in months and a payment frequency. */
export function paymentFor(total: number, termMonths: number, frequency: 'daily' | 'weekly'): number {
  const periods = frequency === 'daily' ? termMonths * 21 : Math.round(termMonths * 4.33);
  return periods > 0 ? round(total / periods, 2) : 0;
}

/** Everything the calculator shows, from the inputs. */
export function quote(plan: CommissionPlan, input: { fundedAmount: number; grade: PaperGrade; upsellPoints: number; termMonths: number; frequency: 'daily' | 'weekly' }) {
  const points = clampPoints(plan, input.upsellPoints);
  const rate = sellRate(plan, input.grade, points);
  const total = payback(input.fundedAmount, rate);
  return {
    points,
    buyRate: plan.buyRates[input.grade],
    sellRate: rate,
    payback: total,
    commission: commission(plan, input.fundedAmount, points),
    payment: paymentFor(total, input.termMonths, input.frequency),
    periods: input.frequency === 'daily' ? input.termMonths * 21 : Math.round(input.termMonths * 4.33),
  };
}

export const clampPoints = (plan: CommissionPlan, points: number) =>
  Math.min(plan.maxUpsellPoints, Math.max(0, Number.isFinite(points) ? points : 0));

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;

/** "$12,000" (whole dollars) or "$1,234.56" when cents matter. */
export const formatMoney = (n: number, cents = false) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
