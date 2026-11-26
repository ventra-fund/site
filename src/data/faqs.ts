// FAQ content, grouped by topic, written for ISOs ("your merchant", never the merchant as "you").
// The FAQ page shows every group; each product page shows its own group (keyed by the product's slug
// in product-pages.ts). Program terms come from iso-program.ts.
import { dayList, isoProgram } from "@/data/iso-program";
import { minimumRequirements } from "@/data/funding-products";

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
    id: "onboarding",
    title: "Onboarding",
    items: [
      {
        q: "Who can partner with Ventra Fund?",
        a: ["ISOs and commercial finance brokers. Lenders, syndicators and service providers can reach us through the same onboarding form."],
      },
      {
        q: "Do you work with merchants directly?",
        a: ["No. We fund only through ISOs and we have no sales floor. A business owner who finds us is asked to go through their broker."],
      },
      {
        q: "Is there a volume minimum?",
        a: [`No. Send one deal a month or fifty. There's a bonus once you reach ${isoProgram.bonusAt} funded.`],
      },
      {
        q: "How do I submit deals?",
        a: ["Once you're onboarded, send files to your relationship manager. Our online partner portal is on its way; until it launches, your relationship manager handles submissions, status updates and commission questions."],
      },
    ],
  },
  {
    id: "submitting",
    title: "Submitting deals",
    items: [
      {
        q: "What do I need to submit a deal?",
        a: [`${isoProgram.stips.length} stips:`],
        list: isoProgram.stips,
      },
      {
        q: "What paper do you fund?",
        a: [`B and C paper, from a ${minimumRequirements.creditScore} credit score, ${minimumRequirements.monthlyRevenue} in monthly revenue and ${minimumRequirements.timeInBusiness} in business. Minimums vary by product; see the deal guidelines for the full picture.`],
      },
      {
        q: "Do you fund merchants with open positions?",
        a: ["Yes, files with existing advances are considered. We look at the whole position stack before we fund, and when the stack is the problem, a consolidation can be the better submission."],
      },
      {
        q: "How fast is a decision?",
        a: ["Automated checks on industry type and position stack give you a quick pre-approval. A person then underwrites the file, and most files get a decision within a day."],
      },
      {
        q: "Does submitting a deal pull the merchant's credit?",
        a: ["No. There's no credit check when you submit. We run a soft inquiry only when the merchant signs an approved contract, and it doesn't affect their score. We never run a hard pull."],
      },
      {
        q: "What happens if you decline a file?",
        a: ["You get the reason with the decision. If we got something wrong, tell us and we'll take another look."],
      },
    ],
  },
  {
    id: "your-merchants",
    title: "Your merchants",
    items: [
      {
        q: "Will you contact my merchant?",
        a: ["Only for the verification call, and we make it in your name. Beyond that, we never contact your merchant on our own or market to them around you."],
      },
      {
        q: "What happens to a merchant you decline?",
        a: ["They stay yours. A decline doesn't free a merchant up for us: we never market to them or contact them on our own, and when their numbers improve, you're the one who brings them back."],
      },
      {
        q: "Do you send my file to other funders?",
        a: ["No. We don't shop your file, and it stays with our team."],
      },
      {
        q: "What can the merchant use the funds for?",
        a: ["Any legitimate business purpose, such as:"],
        list: ["Payroll and operating costs", "Inventory and supplies", "Equipment purchases and repairs", "Marketing and expansion", "Bridging slow-paying customers or seasonal dips"],
      },
    ],
  },
  {
    id: "commission",
    title: "Commission and renewals",
    items: [
      {
        q: "When do I get paid?",
        a: [`Commission runs every ${dayList(isoProgram.commissionDays)} on funded deals.`],
      },
      {
        q: "How do points work?",
        a: [`You can add up to ${isoProgram.maxPoints} points on every deal. Your commission is built into the merchant's total cost, and the merchant sees that cost in dollars before signing.`],
      },
      {
        q: "Do I get paid on renewals?",
        a: [`Yes. Merchants can renew at ${isoProgram.renewAtPercent}% paid in, and every renewal is credited to you at the same commission as the first funding.`],
      },
    ],
  },
  {
    id: "merchant-cash-advances",
    title: "Merchant Cash Advances",
    items: [
      {
        q: "How does a merchant cash advance work?",
        a: ["Your merchant gets a lump sum now and repays it as a fixed percentage of daily or weekly deposits until the agreed amount is delivered. Remittances shrink in slow weeks and grow in busy ones."],
      },
      {
        q: "What are the pros and cons for the merchant?",
        a: ["An advance trades a higher cost for speed and flexibility."],
        pros: ["Remittances move with sales", "Fast decisions, often within a day", "Credit history matters less than revenue"],
        cons: ["A higher total cost, in exchange for speed", "Remittances are frequent, typically daily or weekly", "Built for short-term needs"],
      },
    ],
  },
  {
    id: "consolidations",
    title: "Consolidations",
    items: [
      {
        q: "What does a consolidation do?",
        a: ["It replaces several open advances with one new advance. We pay off the balances and the merchant makes a single payment, often at a lower combined cost."],
      },
      {
        q: "What are the pros and cons for the merchant?",
        a: ["Consolidation simplifies, but compare the totals carefully."],
        pros: ["One payment instead of several", "Often a lower blended cost", "Can free up daily cash flow"],
        cons: ["A longer term can raise total cost", "Requires at least a year in business", "Not every existing position can be paid off"],
      },
    ],
  },
];

export const faqGroup = (id: string) => faqGroups.find((g) => g.id === id);
