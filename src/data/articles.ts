// Resource articles for ISOs, shown at /resources and /resources/<slug>. Swap for a content
// collection when editorial wants CMS-style authoring; the shape here (blocks + FAQ) matches what
// the article template renders.
// NOTE: written for brokers. "You" is the ISO; merchants are "your merchant". We don't publish buy
// rates: talk about points, total cost, advance and financing, never "loan" for what we offer. Program terms (stips,
// commission days, renewal threshold, points cap) come from iso-program.ts and product figures from
// funding-products.ts, so an article can't drift from the rest of the site.
import { photos, type Photo } from "@/data/photos";
import { fundingProducts, minimumRequirements, productSlug } from "@/data/funding-products";
import { dayList, isoProgram, underwriterAvailability } from "@/data/iso-program";

export type ArticleCategory = "Submitting Deals" | "Underwriting";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] };

export interface ArticleFaq {
  q: string;
  a: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  date: string;
  image: Photo;
  /** Article body, rendered top to bottom. Paragraph and list text may contain inline <a> and <strong>. */
  body: ArticleBlock[];
  /** FAQ section rendered under the body, as plain text; good for search result richness. */
  faq: ArticleFaq[];
}

export const articleCategories: ArticleCategory[] = ["Submitting Deals", "Underwriting"];

// ---- figures the articles quote ----

const { commissionDays, renewAtPercent, bonusAt, maxPoints, stips, dealSteps } = isoProgram;

const consolidation = fundingProducts.find((p) => productSlug(p) === "consolidations");
if (!consolidation) throw new Error("articles.ts: no Consolidations product in funding-products.ts");

const statementStip = stips.find((s) => /statement/i.test(s));
if (!statementStip) throw new Error("articles.ts: no bank statement stip in iso-program.ts");

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const joinAnd = (items: string[]) =>
  items.length <= 2 ? items.join(" and ") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const dollars = (n: number) => `$${n.toLocaleString("en-US")}`;

// Worked examples (illustrative, not quoted pricing): points on a $50,000 advance, and the
// paid-in threshold on a $60,000 total repayment.
const exampleFunded = 50_000;
const examplePoints = Math.min(10, maxPoints);
const exampleRepayment = 60_000;

export const articles: Article[] = [
  {
    slug: "packaging-a-deal",
    title: "How to package a deal for a fast decision",
    excerpt: "What a clean submission looks like, the stips we ask for, and the small gaps that slow a file down.",
    category: "Submitting Deals",
    date: "2026-11-18",
    image: photos.requirementsChecklist,
    body: [
      { type: "p", text: "Most delays on a deal have nothing to do with the merchant's numbers. They come from a file that arrives in pieces: a missing month, a license that doesn't match the application, a statement with half its pages. Send a complete file once and an underwriter can work it straight through." },
      { type: "h2", text: "What a complete submission includes" },
      { type: "p", text: "Every deal needs the same short list:" },
      { type: "list", items: stips },
      { type: "p", text: "Send everything together, in one email. A file that comes in over three messages gets reviewed three times." },
      { type: "h2", text: "Check the file before you send it" },
      { type: "list", items: [
        "<strong>Names match.</strong> The legal business name on the application should match the bank statements and the voided check. If the merchant operates under a DBA, say so.",
        "<strong>Statements are complete.</strong> Every page of every month, downloaded from the bank as PDFs. Screenshots and spreadsheet exports can't be verified.",
        "<strong>Months are current.</strong> The latest full month plus month-to-date. A file missing last month is the most common reason we come back with a question.",
        "<strong>Every owner is listed.</strong> Include a license for each owner on the application, not just the one you spoke with.",
        "<strong>Open positions are disclosed.</strong> If the merchant already has an advance, tell us the funder, the balance and the payment. We'll see it on the statements anyway; hearing it from you first saves a round trip.",
      ] },
      { type: "h2", text: "Tell us what you know" },
      { type: "p", text: "A two-line note with the submission goes a long way: what the merchant needs, how much, how soon and anything unusual on the statements. A one-time large deposit, a seasonal dip or a recent change of bank is easy to explain up front and slow to explain later." },
      { type: "h2", text: "What happens next" },
      { type: "p", text: `Once the file is in, you can follow the deal through ${dealSteps.length} statuses: ${joinAnd(dealSteps.map((s) => s.toLowerCase()))}. See <a href="/why-us/how-it-works">how a deal moves from submission to funding</a>.` },
      { type: "p", text: `Questions about a file are faster on the phone. An underwriter is available ${underwriterAvailability}.` },
    ],
    faq: [
      { q: "Do I need to send everything before you start?", a: "A complete file gets the fastest answer. If something is missing, send what you have and tell us what's coming; we'll flag anything else we need." },
      { q: "Who talks to the merchant?", a: "You do. We never contact your merchant on our own, funded or declined; the only call they get is a verification call made in your name." },
      { q: "What are your minimums?", a: `Our lowest minimums are ${minimumRequirements.timeInBusiness} in business, ${minimumRequirements.monthlyRevenue} in monthly revenue and a credit score of ${minimumRequirements.creditScore}. They vary by product; the Who we fund page lists industries and requirements.` },
    ],
  },
  {
    slug: "reading-bank-statements",
    title: "Reading bank statements like an underwriter",
    excerpt: "What we look for in a merchant's statements, and how to spot the issues before you submit.",
    category: "Underwriting",
    date: "2026-11-04",
    image: photos.receiptsCalculator,
    body: [
      { type: "p", text: "Bank statements decide most deals. The application tells us what the merchant says; the statements show what the business does. Read them the way an underwriter will and you'll know which deals are worth sending, and how to set your merchant's expectations." },
      { type: "h2", text: "Start with true revenue" },
      { type: "p", text: "Total deposits are not revenue. Before we size a deal, we take out money that didn't come from customers:" },
      { type: "list", items: [
        "Transfers between the merchant's own accounts",
        "Proceeds from other funding, such as an existing advance",
        "Owner injections and personal deposits",
        "Refunds, reversals and other one-time credits",
      ] },
      { type: "p", text: "What's left, averaged across the months, is the revenue a deal is sized on. A merchant with $60,000 in monthly deposits and $15,000 of transfers is a $45,000-a-month business." },
      { type: "h2", text: "Look at the balance, not just the deposits" },
      { type: "p", text: "Daily balances show how the business actually handles cash. We look at:" },
      { type: "list", items: [
        "<strong>NSFs and returned items.</strong> A few over several months can be explained. Several in the last few weeks usually can't.",
        "<strong>Negative days.</strong> How often the account dips below zero, and how long it stays there.",
        "<strong>Average daily balance.</strong> A business that runs near zero every day has little room for another payment.",
        "<strong>The trend.</strong> Steady or rising deposits read very differently from a business that was stronger six months ago.",
      ] },
      { type: "h2", text: "Find the existing positions" },
      { type: "p", text: "Open advances show up as recurring debits, usually daily or weekly, often under the funder's name. Total them up: the combined payments against true revenue is the first thing we check before adding another position. More on that in <a href=\"/resources/positions-and-stacking\">second and third positions</a>." },
      { type: "h2", text: "Explain the outliers up front" },
      { type: "p", text: "Some things look bad on paper but have a simple explanation: a large one-time job, a seasonal slow month, an insurance payout, a recent change of bank. Put it in your submission note. An explanation that arrives with the file is part of the first review, which is faster than a second look." },
    ],
    faq: [
      { q: "Do you need the statements as PDFs?", a: "Yes: complete PDFs downloaded from the bank, every page. Screenshots, spreadsheets and edited files can't be verified." },
      { q: "How many months do you look at?", a: `Our stips ask for: ${lowerFirst(statementStip)}. That's enough to see the trend and the current month.` },
      { q: "Does a low credit score sink a deal?", a: `Not on its own. We lead with revenue and cash flow, and some products consider scores from ${minimumRequirements.creditScore}.` },
    ],
  },
  {
    slug: "positions-and-stacking",
    title: "Second and third positions: what we look at before we fund",
    excerpt: "A merchant with open advances isn't an automatic decline. Here's how we decide, and when a consolidation is the better deal.",
    category: "Underwriting",
    date: "2026-10-21",
    image: photos.consolidation,
    body: [
      { type: "p", text: "Plenty of good merchants already carry an advance or two. A second or third position is not an automatic decline. The question is simple: can the business carry one more payment without running out of cash?" },
      { type: "h2", text: "What we check first" },
      { type: "list", items: [
        "<strong>Total payments against true revenue.</strong> Add up every daily and weekly debit from existing funders and compare it to revenue after transfers and financing proceeds come out. This number decides more stacked deals than anything else.",
        "<strong>How recently the merchant was funded.</strong> A position funded last week and a new request this week raises the question of where the money went.",
        "<strong>Balances remaining.</strong> A position that's nearly paid off weighs less than one that just funded.",
        "<strong>Payment history since funding.</strong> Returned payments to an existing funder tell us how the next payment will go.",
        "<strong>Disputes with current funders.</strong> A merchant in default or in a dispute with an existing funder is very hard to fund.",
      ] },
      { type: "h2", text: "Disclose every position" },
      { type: "p", text: "List every open advance in the submission: funder, balance, payment and frequency. We'll find them on the statements regardless, and a file that lists them up front reads as a broker who knows the deal." },
      { type: "h2", text: "When a consolidation fits better" },
      { type: "p", text: `If the merchant's payments are already heavy, one more position can make things worse. A <a href="/capital/${productSlug(consolidation)}">consolidation</a> pays off the existing positions and replaces them with a single payment, often at a lower combined cost. It suits merchants with two or more open positions and at least ${consolidation.requirements.timeInBusiness.replace("+", "")} in business.` },
      { type: "p", text: "For you, a consolidation keeps the merchant in business and paying, which is what makes a <a href=\"/resources/renewals\">renewal</a> possible later." },
      { type: "h2", text: "Ask before you shop it" },
      { type: "p", text: `Not sure a stacked deal works? Call before you submit. An underwriter is available ${underwriterAvailability}, and a two-minute conversation can save you a decline.` },
    ],
    faq: [
      { q: "Do I need to list positions the merchant plans to pay off?", a: "Yes. List every open position, including any the merchant plans to pay off with the new funds, and tell us which ones." },
      { q: "Can a consolidation cover positions from several funders?", a: "Yes, that's the usual case: one new advance pays off the existing advances and the merchant makes one payment." },
    ],
  },
  {
    slug: "renewals",
    title: "Renewals: when your merchant qualifies, and how you're credited",
    excerpt: `Your merchant can renew at ${renewAtPercent}% paid in, and every renewal is credited to you at the same commission.`,
    category: "Submitting Deals",
    date: "2026-10-07",
    image: photos.ownerLaptopCelebrating,
    body: [
      { type: "p", text: "The first funding is the hardest deal to close. A merchant who pays well and needs capital again is the easiest. Renewals are where a book of business starts to compound, so here's exactly how they work with us." },
      { type: "h2", text: "When a merchant can renew" },
      { type: "p", text: `A merchant can renew once ${renewAtPercent}% of the current advance has been paid in.` },
      { type: "p", text: `Paid in means the share of the total repayment already delivered. If a merchant's total repayment is ${dollars(exampleRepayment)}, they reach ${renewAtPercent}% at ${dollars(Math.round((exampleRepayment * renewAtPercent) / 100))} delivered.` },
      { type: "p", text: "A renewal typically pays off the remaining balance from the new funding, so the merchant still has one position with us." },
      { type: "h2", text: "Renewals are credited to you" },
      { type: "p", text: `Every renewal on a merchant you brought us is credited to you, at the same commission as the first funding. We never contact your merchant on our own, so when it's time to renew, the call comes from you.` },
      { type: "h2", text: "Watch for the right moment" },
      { type: "list", items: [
        `<strong>Track the paid-in balance.</strong> Ask us where any funded merchant stands and we'll tell you how far they are from ${renewAtPercent}%.`,
        "<strong>Check the payment history.</strong> A merchant with returned payments on the current advance is a harder renewal.",
        "<strong>Send fresh statements.</strong> A renewal is reviewed on current numbers, so include the latest months with the request.",
      ] },
      { type: "p", text: "Then submit it like any other deal. See <a href=\"/resources/packaging-a-deal\">how to package a deal</a>." },
    ],
    faq: [
      { q: "Who gets credit if my merchant calls you directly to renew?", a: "You do. Every renewal on a merchant you submitted is credited to you, at the same commission as the first funding." },
      { q: "Is a renewal underwritten from scratch?", a: "It's reviewed on fresh statements, but a merchant in good standing with us often gets a shorter review the second time." },
    ],
  },
  {
    slug: "points-and-commission",
    title: "Points and your commission",
    excerpt: "How points become your commission, when you get paid, and how to walk a merchant through the total cost.",
    category: "Submitting Deals",
    date: "2026-09-23",
    image: photos.formsAndLaptop,
    body: [
      { type: "p", text: "Your commission comes from the points you add to a deal. Here's how the pieces fit." },
      { type: "h2", text: "Points" },
      { type: "p", text: `You can add up to ${maxPoints} points on any deal. Each point earns you 1% of the funded amount, and it's built into the merchant's total cost.` },
      { type: "p", text: `Say you add ${examplePoints} points to a ${dollars(exampleFunded)} advance. Your commission is ${dollars((exampleFunded * examplePoints) / 100)}, and the merchant sees the full cost, points included, in dollars before signing.` },
      { type: "h2", text: "When you get paid" },
      { type: "p", text: `Commission runs every ${dayList(commissionDays)} on funded deals. There's no volume minimum to work with us, and funded volume earns a bonus at ${bonusAt}.` },
      { type: "p", text: "Renewals pay too: every renewal on your merchant is credited to you at the same commission. See <a href=\"/resources/renewals\">how renewals work</a>." },
      { type: "h2", text: "Explaining the cost to your merchant" },
      { type: "p", text: "Merchants who understand what they're paying come back for a renewal; merchants who feel surprised don't. Walk your merchant through three numbers before they sign:" },
      { type: "list", items: [
        "<strong>The funded amount</strong>, and anything paid off from it, such as an existing balance.",
        "<strong>The total repayment</strong> in dollars.",
        "<strong>The payment</strong>: how much, how often and roughly for how long.",
      ] },
      { type: "p", text: "Points are part of the merchant's rate, so they're part of that total. Price the deal so it still works for the business: a merchant who can carry the payment is one who renews." },
    ],
    faq: [
      { q: "Is there a cap on points?", a: `Yes: up to ${maxPoints} points on a deal.` },
      { q: "When is commission paid?", a: `Commission runs every ${dayList(commissionDays)} on funded deals.` },
      { q: "Is there a minimum volume to work with you?", a: `No. There's no volume minimum, and funded volume earns a bonus at ${bonusAt}.` },
    ],
  },
];
