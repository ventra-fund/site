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
    description: "An advance against your future sales. You get a lump sum today and repay it automatically as a small slice of each day's deposits, so payments rise and fall with your revenue.",
    bestFor: "Seasonal businesses and high card-volume merchants",
    amountLabel: "Funding Amount",
    amount: "$5K – $1M",
    timeToFund: "As fast as 24 hrs",
    termLength: "3 – 18 months",
    repayment: "% of daily sales",
    rateCost: "from 12%",
    requirements: {
      creditScore: "450",
      monthlyRevenue: "$5k+",
      timeInBusiness: "6+ months",
    },
  },
  {
    title: "Term Loans",
    category: "Fixed Financing",
    description: "A classic loan. You receive the full amount up front and pay it back in equal installments over a set number of months, so your cost is fixed and easy to budget around.",
    bestFor: "Planned investments like equipment or expansion",
    amountLabel: "Funding Amount",
    amount: "$10K – $5M",
    timeToFund: "1 – 3 days",
    termLength: "6 – 60 months",
    repayment: "Fixed monthly",
    rateCost: "from 6%",
    requirements: {
      creditScore: "600",
      monthlyRevenue: "$10k+",
      timeInBusiness: "1+ year",
    },
  },
  {
    title: "Lines of Credit",
    category: "Flexible Capital",
    description: "A revolving pool of capital you can tap whenever you need it. Draw any amount up to your limit, repay it, and draw again. You only pay interest on the balance you are actually using.",
    bestFor: "Managing cash flow gaps and unexpected costs",
    amountLabel: "Credit Limit",
    amount: "Up to $250K",
    timeToFund: "As fast as 24 hrs",
    termLength: "Revolving",
    repayment: "Pay as you draw",
    rateCost: "prime + 1.75%",
    requirements: {
      creditScore: "580",
      monthlyRevenue: "$8k+",
      timeInBusiness: "6+ months",
    },
  },
  {
    title: "Consolidations",
    category: "Debt Restructuring",
    description: "One new facility that pays off several existing advances or loans. Instead of juggling multiple withdrawals, you make a single payment, usually at a lower combined cost.",
    bestFor: "Businesses carrying two or more open positions",
    amountLabel: "Funding Amount",
    amount: "$25K – $2M",
    timeToFund: "2 – 4 days",
    termLength: "6 – 36 months",
    repayment: "Single payment",
    rateCost: "Lower blended cost",
    requirements: {
      creditScore: "500",
      monthlyRevenue: "$10k+",
      timeInBusiness: "1+ year",
    },
  },
  {
    title: "Cash Credit (CC)",
    category: "Revolving Facility",
    description: "A running credit account secured against your business assets. Draw funds up to your sanctioned limit, repay, and draw again, paying interest only on the amount outstanding.",
    bestFor: "Day-to-day working capital and inventory",
    amountLabel: "Funding Amount",
    amount: "$15K – $975k",
    timeToFund: "3 – 5 days",
    termLength: "1 – 12 months",
    repayment: "Interest-only",
    rateCost: "from 10.5%",
    requirements: {
      creditScore: "580",
      monthlyRevenue: "$15k+",
      timeInBusiness: "2+ years",
    },
  },
];

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
