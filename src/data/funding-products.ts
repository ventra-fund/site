export interface FundingProduct {
  title: string;
  category: string;
  description: string;
  bestFor: string;
  amountLabel: string;
  amount: string;
  timeToFund: string;
  termLength: string;
  repayment: string;
  requirements: {
    creditScore: string;
    monthlyRevenue: string;
    timeInBusiness: string;
  };
}

export const fundingProducts: FundingProduct[] = [
  {
    title: "Merchant Cash Advances",
    category: "Working Capital",
    description: "Your merchant gets a lump sum and remits a small share of daily deposits. Remittances ease off in slow weeks and pick up when business is busy.",
    bestFor: "Seasonal and high card-volume merchants",
    amountLabel: "Funding Amount",
    amount: "$5K – $1M",
    timeToFund: "As fast as 24 hrs",
    termLength: "3 – 18 months",
    repayment: "% of daily sales",
    requirements: {
      creditScore: "450",
      monthlyRevenue: "$5k+",
      timeInBusiness: "6+ months",
    },
  },
  {
    title: "Consolidations",
    category: "Stacked Positions",
    description: "One new advance that pays off your merchant's open positions. They make a single remittance, usually at a lower combined cost.",
    bestFor: "Merchants carrying two or more open positions",
    amountLabel: "Funding Amount",
    amount: "$25K – $2M",
    timeToFund: "2 – 4 days",
    termLength: "6 – 36 months",
    repayment: "Single remittance",
    requirements: {
      creditScore: "500",
      monthlyRevenue: "$10k+",
      timeInBusiness: "1+ year",
    },
  },
];

/** URL segment for a product's page under /capital, e.g. "Merchant Cash Advances" → "merchant-cash-advances". */
export const productSlug = (p: Pick<FundingProduct, "title">) =>
  p.title.toLowerCase().replace(/\([^)]*\)/g, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The loosest requirement across all products, for the "Minimum requirements" summary on the
// capital page. Derived here so the summary can't drift from the per-product figures above.
const firstNumber = (s: string) => Number(s.match(/[\d.]+/)?.[0] ?? Infinity);
const months = (s: string) => (/year/i.test(s) ? 12 : 1) * firstNumber(s);
const minBy = <T,>(items: T[], score: (item: T) => number) =>
  items.reduce((best, item) => (score(item) < score(best) ? item : best));

export const minimumRequirements = {
  creditScore: minBy(fundingProducts, (p) => firstNumber(p.requirements.creditScore)).requirements.creditScore,
  monthlyRevenue: minBy(fundingProducts, (p) => firstNumber(p.requirements.monthlyRevenue)).requirements.monthlyRevenue,
  timeInBusiness: minBy(fundingProducts, (p) => months(p.requirements.timeInBusiness)).requirements.timeInBusiness,
};
