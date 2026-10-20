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
        q: "Will checking my options affect my credit score?",
        a: ["No. We use a soft credit pull while you apply, which doesn't show up to other lenders or change your score. A hard pull only happens if you accept an offer and move to funding, and we tell you before it does."],
      },
      {
        q: "What do I need to apply?",
        a: ["A few minutes and some basics about your business: legal name, time in business, average monthly revenue and your business bank account. Most applicants also share their last three to four months of business bank statements so we can see cash flow directly."],
      },
      {
        q: "How fast can I get funded?",
        a: ["Many applicants get a decision within 24 hours, and some products can fund the same or next business day once you accept an offer. Timing depends on how complete your application is and on your bank's processing times."],
      },
      {
        q: "Do you fund startups?",
        a: ["Not yet. We fund established businesses with at least six months of operating history and steady deposits. If you're earlier than that, our resources section has guides on building a track record that lenders look for."],
      },
      {
        q: "What can I use the funds for?",
        a: ["Almost any legitimate business purpose. Customers commonly use funding for:"],
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
        a: ["An advance against your future sales. You receive a lump sum now, and a fixed percentage of your daily or weekly deposits goes toward it until the agreed amount is delivered. Because remittances follow your revenue, they shrink in slow weeks and grow in busy ones."],
      },
      {
        q: "What are the pros and cons?",
        a: ["An advance trades a higher cost for speed and flexibility."],
        pros: ["Remittances move with your sales", "Fast decisions, often within 24 hours", "Credit history matters less than revenue"],
        cons: ["Usually costs more than term financing", "Remittances are frequent, typically daily or weekly", "Not designed for long-term financing"],
      },
      {
        q: "When does an advance make sense?",
        a: ["When you need capital quickly and your revenue swings with the season, or when your card volume is strong but your credit history would hold you back at a bank."],
      },
    ],
  },
  {
    id: "term-financing",
    title: "Term Financing",
    items: [
      {
        q: "How does term financing work?",
        a: ["You receive the full amount up front and repay it in equal installments over a set term. The cost is fixed when you sign, so every payment is the same and easy to plan around."],
      },
      {
        q: "What are the pros and cons?",
        a: ["Term financing suits planned, one-time investments."],
        pros: ["Predictable fixed payments", "Lower cost than most short-term options", "Longer terms available"],
        cons: ["Payments don't flex with revenue", "Stricter credit and time-in-business requirements", "May require collateral for larger amounts"],
      },
      {
        q: "Can I pay term financing off early?",
        a: ["Yes. Many of our term financing products carry prepayment discounts, so settling early lowers your total cost. Your offer spells out exactly how."],
      },
    ],
  },
  {
    id: "lines-of-credit",
    title: "Lines of Credit",
    items: [
      {
        q: "How is a line of credit different from term financing?",
        a: ["Term financing pays out once. A line of credit gives you a limit you can draw from, repay and draw again, and you only pay interest on what you've drawn."],
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
        a: ["It replaces several open advances or financing positions with one new facility. We pay off the existing balances and you make a single payment, often at a lower combined cost and with more breathing room in your cash flow."],
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
        a: ["A running credit account secured against your business assets, such as inventory or receivables. You draw up to your sanctioned limit, repay and draw again, paying interest only on what's outstanding."],
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
