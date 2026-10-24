// FAQ content, grouped by topic. The FAQ page shows every group; each product page shows its own
// group (keyed by the product's slug in product-pages.ts).

export interface Faq {
  q: string;
  /** Answer paragraphs. */
  a: string[];
  list?: string[];
  pros?: string[];
  cons?: string[];
}

export interface FaqGroup {
  id: string;
  title: string;
  items: Faq[];
}

export const faqGroups: FaqGroup[] = [
  {
    id: "general",
    title: "Applying with Ventra Fund",
    items: [
      {
        q: "Will applying affect my credit score?",
        a: ["No. Applying doesn't involve a credit check. We run a soft inquiry only when you sign an approved offer, and it doesn't affect your score. We never run a hard pull."],
      },
      {
        q: "What do I need to apply?",
        a: ["A few minutes, basic business details (legal name, time in business, monthly revenue) and your business bank account. Most applicants also upload three to six months of bank statements; your last three full months plus month-to-date is optimal."],
      },
      {
        q: "How fast can I get funded?",
        a: ["Most applicants get a decision within 24 hours. Some products fund the next business day after you accept an offer."],
      },
      {
        q: "Do you fund startups?",
        a: ["Not yet. We fund businesses with at least six months of history and steady deposits."],
      },
      {
        q: "What can I use the funds for?",
        a: ["Any legitimate business purpose, such as:"],
        list: ["Payroll and operating costs", "Inventory and supplies", "Equipment purchases and repairs", "Marketing and expansion", "Bridging slow-paying customers or seasonal dips"],
      },
    ],
  },
  {
    id: "merchant-cash-advances",
    title: "Merchant Cash Advances",
    items: [
      {
        q: "What is a merchant cash advance?",
        a: ["A lump sum now, repaid as a fixed percentage of your daily or weekly deposits until the agreed amount is delivered. Remittances shrink in slow weeks and grow in busy ones."],
      },
      {
        q: "What are the pros and cons?",
        a: ["An advance trades a higher cost for speed and flexibility."],
        pros: ["Remittances move with your sales", "Fast decisions, often within 24 hours", "Credit history matters less than revenue"],
        cons: ["Usually costs more than term financing", "Remittances are frequent, typically daily or weekly", "Not designed for long-term financing"],
      },
    ],
  },
  {
    id: "term-financing",
    title: "Term Financing",
    items: [
      {
        q: "How does term financing work?",
        a: ["You get the full amount up front and repay it in equal installments over a set term. The cost is fixed when you sign."],
      },
      {
        q: "What are the pros and cons?",
        a: ["Term financing suits planned, one-time investments."],
        pros: ["Predictable fixed payments", "Lower cost than most short-term options", "Longer terms available"],
        cons: ["Payments don't flex with revenue", "Stricter credit and time-in-business requirements", "May require collateral for larger amounts"],
      },
      {
        q: "Can I pay term financing off early?",
        a: ["Yes. Many term products carry prepayment discounts, so paying early lowers your total cost. Your offer spells out how."],
      },
    ],
  },
  {
    id: "lines-of-credit",
    title: "Lines of Credit",
    items: [
      {
        q: "How is a line of credit different from term financing?",
        a: ["Term financing pays out once. A line gives you a limit to draw from, repay and draw again, with interest only on what you've drawn."],
      },
      {
        q: "What are the pros and cons?",
        a: ["A line works best as a standing safety net."],
        pros: ["Draw only what you need, when you need it", "Interest only on the outstanding balance", "Reusable as you repay"],
        cons: ["Smaller limits than term financing", "Buy rates can change over time", "Easy to lean on for costs that should be planned"],
      },
    ],
  },
  {
    id: "consolidations",
    title: "Consolidations",
    items: [
      {
        q: "What does consolidation do?",
        a: ["It replaces several open advances or loans with one new facility. We pay off the balances and you make a single payment, often at a lower combined cost."],
      },
      {
        q: "What are the pros and cons?",
        a: ["Consolidation simplifies, but read the totals carefully."],
        pros: ["One payment instead of several", "Often a lower blended cost", "Can free up daily cash flow"],
        cons: ["A longer term can raise total cost", "Requires at least a year in business", "Not every existing position can be paid off"],
      },
    ],
  },
  {
    id: "cash-credit",
    title: "Cash Credit",
    items: [
      {
        q: "What is cash credit?",
        a: ["A revolving credit account secured by business assets like inventory or receivables. Draw up to your limit, repay and draw again, paying interest only on what's outstanding."],
      },
      {
        q: "What are the pros and cons?",
        a: ["Cash credit is built for steady, day-to-day working capital."],
        pros: ["Interest only on the amount used", "Large limits for asset-backed businesses", "Reusable throughout the term"],
        cons: ["Secured against business assets", "Longer underwriting than an advance", "Requires two or more years in business"],
      },
    ],
  },
];

export const faqGroup = (id: string) => faqGroups.find((g) => g.id === id);
