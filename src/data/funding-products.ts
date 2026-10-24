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
  rateCost: string;
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
    description: "A lump sum today, repaid as a small share of your daily deposits. Payments ease off in slow weeks and pick up when business is busy.",
    bestFor: "Seasonal businesses and high card-volume merchants",
    amountLabel: "Funding Amount",
    amount: "$5K – $1M",
    timeToFund: "As fast as 24 hrs",
    termLength: "3 – 18 months",
    repayment: "% of daily sales",
    rateCost: "Buy rates from 1.15",
    requirements: {
      creditScore: "450",
      monthlyRevenue: "$5k+",
      timeInBusiness: "6+ months",
    },
  },
  {
    title: "Term Financing",
    category: "Fixed Financing",
    description: "The full amount up front, repaid in equal installments over a set term. Your cost is fixed when you sign, so it's easy to budget.",
    bestFor: "Planned investments like equipment or expansion",
    amountLabel: "Funding Amount",
    amount: "$10K – $5M",
    timeToFund: "1 – 3 days",
    termLength: "6 – 60 months",
    repayment: "Fixed monthly",
    rateCost: "Buy rates from 1.09",
    requirements: {
      creditScore: "600",
      monthlyRevenue: "$10k+",
      timeInBusiness: "1+ year",
    },
  },
  {
    title: "Lines of Credit",
    category: "Flexible Capital",
    description: "A credit limit you can draw on whenever you need it. Repay and draw again, paying interest only on what you've used.",
    bestFor: "Managing cash flow gaps and unexpected costs",
    amountLabel: "Credit Limit",
    amount: "Up to $250K",
    timeToFund: "As fast as 24 hrs",
    termLength: "Revolving",
    repayment: "Pay as you draw",
    rateCost: "Buy rates from 1.2",
    requirements: {
      creditScore: "580",
      monthlyRevenue: "$8k+",
      timeInBusiness: "6+ months",
    },
  },
  {
    title: "Consolidations",
    category: "Debt Restructuring",
    description: "One new facility that pays off your existing advances or loans. You make a single payment, usually at a lower combined cost.",
    bestFor: "Businesses carrying two or more open positions",
    amountLabel: "Funding Amount",
    amount: "$25K – $2M",
    timeToFund: "2 – 4 days",
    termLength: "6 – 36 months",
    repayment: "Single payment",
    rateCost: "Lower blended buy rate",
    requirements: {
      creditScore: "500",
      monthlyRevenue: "$10k+",
      timeInBusiness: "1+ year",
    },
  },
  {
    title: "Cash Credit (CC)",
    category: "Revolving Facility",
    description: "A revolving credit account secured by your inventory, receivables or other business assets. You pay interest only on what's outstanding.",
    bestFor: "Day-to-day working capital and inventory",
    amountLabel: "Funding Amount",
    amount: "$15K – $975K",
    timeToFund: "3 – 5 days",
    termLength: "1 – 12 months",
    repayment: "Interest-only",
    rateCost: "Buy rates from 1.12",
    requirements: {
      creditScore: "580",
      monthlyRevenue: "$15k+",
      timeInBusiness: "2+ years",
    },
  },
];

/** URL segment for a product's page under /capital, e.g. "Cash Credit (CC)" → "cash-credit". */
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
