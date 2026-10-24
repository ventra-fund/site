// Resource articles shown at /resources and /resources/<slug>. Swap for a content collection
// when editorial wants CMS-style authoring; the shape here (blocks + FAQ) matches what the
// article template renders.
// NOTE: titles double as search targets; bodies use buy rate for our pricing and
// financing/factoring (not "loan") when describing what we offer.
import { photos, type Photo } from "@/data/photos";

export type ArticleCategory = "Financing Tips" | "Guides";

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
  /** Article body, rendered top to bottom. Paragraph text may contain inline <a> tags. */
  body: ArticleBlock[];
  /** FAQ section rendered under the body; good for search result richness. */
  faq: ArticleFaq[];
}

export const articleCategories: ArticleCategory[] = ["Financing Tips", "Guides"];

export const articles: Article[] = [
  {
    slug: "merchant-cash-advance-vs-term-loan",
    title: "Merchant cash advance vs. term loan: which fits your business?",
    excerpt: "How the two most common working capital products differ in cost, speed and repayment, and how to choose.",
    category: "Financing Tips",
    date: "2026-09-30",
    image: photos.signingAtDesk,
    body: [
      { type: "p", text: "If you need capital in days rather than weeks, you are usually choosing between a merchant cash advance and term financing. Both fund established businesses quickly, but they are priced differently, repaid differently and suit different moments. Here is how to tell which one fits yours." },
      { type: "h2", text: "What a merchant cash advance does" },
      { type: "p", text: "An advance is a purchase against your future sales. You receive a lump sum, then repay it as a small, fixed share of each day's or week's deposits. Because the share is fixed, payments rise in busy weeks and shrink in slow ones, so the product flexes with your revenue instead of fighting it." },
      { type: "p", text: "Pricing is expressed as a <strong>buy rate</strong>: a multiplier on what you receive. A buy rate of 1.15 on a $20,000 advance means $23,000 total, and that figure is the number that matters. You know your full cost in dollars before you sign, and we show the estimated APR alongside it so you can compare offers honestly." },
      { type: "h2", text: "What term financing does" },
      { type: "p", text: "Term financing pays out once, in a lump sum, and you repay it in equal monthly installments over a set number of months. The payment never changes, which makes it easy to build into a budget, and the cost is fixed the day you sign. It is the cleaner fit for planned investments: equipment, a build-out, a vehicle, hiring ahead of a known busy season." },
      { type: "p", text: "Buy rates on term financing start lower than advances because the payments are predictable and the requirements are a little stricter. You can also usually <a href=\"/why-us/transparent-pricing\">pay term financing off early with a prepayment discount</a>, which lowers the total." },
      { type: "h2", text: "Side-by-side: the differences that matter" },
      { type: "list", items: [
        "<strong>Repayment:</strong> an advance takes a share of daily or weekly deposits; term financing takes the same fixed payment every month.",
        "<strong>Speed:</strong> advances can fund in as little as 24 hours; term financing typically funds in one to three days.",
        "<strong>Cost:</strong> advances carry a higher buy rate in exchange for flexibility; term financing starts lower but expects steadier revenue.",
        "<strong>Credit:</strong> both weigh revenue first, but advances are more forgiving on credit history than term financing.",
        "<strong>Best moment:</strong> use an advance when revenue is uneven or speed is critical; use term financing when you know what the money is for and can plan the payment.",
      ] },
      { type: "h2", text: "How to choose" },
      { type: "p", text: "Ask yourself two questions. First, does my revenue swing week to week? If yes, the advance's remittances will protect you in slow periods, and the higher buy rate buys real flexibility. Second, is this a planned, one-time investment? If yes, fixed payments at a lower buy rate usually cost less over the life of the facility." },
      { type: "p", text: "And you do not have to guess alone. <a href=\"/apply\">Apply in minutes</a> with no credit check, and a funding advisor will walk you through the amount, the buy rate and the payment schedule for every option you qualify for, in plain language, before you commit to anything." },
    ],
    faq: [
      { q: "Is a merchant cash advance more expensive than term financing?", a: "Usually, yes. An advance carries a higher buy rate because it is priced for speed and for revenue that swings. If your revenue is steady and you can commit to fixed payments, term financing typically costs less overall." },
      { q: "Which option funds faster?", a: "Merchant cash advances can fund in as fast as 24 hours. Term financing usually funds in one to three days after approval. Both are far faster than a bank's timeline." },
      { q: "Can I get both?", a: "Many businesses carry an advance for seasonal gaps and term financing for a planned investment at the same time. What you can carry is decided during review, based on your revenue and existing positions." },
    ],
  },
  {
    slug: "preparing-bank-statements",
    title: "What lenders look for in your bank statements",
    excerpt: "The deposits, balances and patterns underwriters notice first, and how to present your business at its best.",
    category: "Guides",
    date: "2026-09-18",
    image: photos.receiptsCalculator,
    body: [
      { type: "p", text: "Bank statements are the fastest way for an underwriter to see how your business really runs. Revenue on a tax return tells you what happened last year; deposits tell you what is happening now. Here is what we read when we open your statements, and how to present your business at its best." },
      { type: "h2", text: "Deposits: consistency beats size" },
      { type: "p", text: "We are looking for steady, recurring deposits that clearly come from your business: customer payments, card settlements, invoice transfers. Consistent deposits from ordinary activity are the strongest evidence a business can show, because they prove demand is ongoing rather than a single lucky month. A few large deposits with no visible source raise questions we will have to resolve with extra documentation." },
      { type: "h2", text: "Trends: flat, growing, or declining" },
      { type: "p", text: "Underwriters compare month to month and look at direction. Flat or growing deposits make for an easy read. A visible decline does not automatically sink an application, but expect questions: seasonality, a lost client, a one-time event, or a shift from cash to another account all have reasonable answers. The explanation matters more than the dip." },
      { type: "h2", text: "Balances and red flags" },
      { type: "p", text: "Ending balances show how much cushion your business keeps. Frequent overdrafts, negative balances, returned payments or constant movement between personal and business accounts all raise questions about stability. None of these are automatic noes, but cleaning them up before you apply makes the review shorter." },
      { type: "h2", text: "What to have ready" },
      { type: "list", items: [
        "Your last three to four months of business bank statements. The <a href=\"/apply\">application</a> accepts three to six.",
        "One account, used consistently. If revenue lands in two accounts, tell us upfront so nothing looks like it is being hidden.",
        "A short explanation for anything unusual: a seasonal dip, a big one-time expense, a recently opened account.",
        "Clear ownership. Statements should be in the business's name for anyone with 20% or more ownership.",
      ] },
      { type: "h2", text: "How we use them" },
      { type: "p", text: "Deposits drive our underwriting more than any single number. We size an offer to what your cash flow can actually carry, which is why <a href=\"/who-we-fund\">owners across hundreds of industries</a> with imperfect credit still qualify. Clean statements do not just speed up a decision; they often improve the terms you are offered." },
    ],
    faq: [
      { q: "How many months of bank statements do I need?", a: "You can apply with three to six months. Your last three full months plus month-to-date is optimal, and some larger facilities call for six." },
      { q: "Do you need statements from every account?", a: "We need the account your revenue lands in. If you use more than one, share both and explain the split; consistency matters more than which one you pick." },
      { q: "Will a low ending balance hurt my application?", a: "Not on its own. We care most about deposits and how they trend. A thin balance alongside steady revenue usually matters less than you would expect." },
    ],
  },
  {
    slug: "seasonal-cash-flow",
    title: "Planning cash flow for a seasonal business",
    excerpt: "A practical approach to stocking up, staffing and staying solvent through the slow months.",
    category: "Financing Tips",
    date: "2026-09-04",
    image: photos.florist,
    body: [
      { type: "p", text: "Payroll does not care that January is slow. Rent does not care that your busiest quarter is still six weeks away. Seasonal businesses live with revenue that arrives in waves while costs arrive on schedule, and the businesses that thrive are the ones that plan for the trough while they are still riding the crest." },
      { type: "h2", text: "Map your cycle before you manage it" },
      { type: "p", text: "Start with the basics: in which months does revenue peak, and in which months does it sag? Pull twelve months of deposits and mark them. Once you can see the shape of your year, every other decision (when to buy inventory, when to hire, when to schedule big expenses) has a right answer built in." },
      { type: "h2", text: "Bank the peak, budget the trough" },
      { type: "p", text: "The single most valuable habit a seasonal owner can build is paying the slow season out of the busy one. Set a reserve target that covers your fixed costs for one slow month, then two, then three, and treat funding that reserve as a non-negotiable line item before discretionary spending in peak months." },
      { type: "h2", text: "Time your buying and hiring" },
      { type: "list", items: [
        "Buy inventory ahead of the rush, but only as far as your reserve comfortably allows; dead stock in a slow month is cash you cannot recover.",
        "Hire and train before the season starts. Payroll committed early costs less than overtime and turnover mid-rush.",
        "Move big discretionary spend (equipment, renovations, marketing pushes) into the shoulder months when crews and cash are both free.",
        "Negotiate payment terms with suppliers so due dates land after your receivables, not before.",
      ] },
      { type: "h2", text: "Line up capital before you need it" },
      { type: "p", text: "The worst time to look for capital is the week payroll comes up short. Businesses that plan arrange a facility in the shoulder season, when their records look calm and there is no pressure. A <a href=\"/capital/lines-of-credit\">line of credit</a> works well as a seasonal buffer: it sits unused, costs little to keep open, and is there when deposits dip. An <a href=\"/capital/merchant-cash-advances\">advance</a> fits owners who need the money now and prefer payments that shrink along with a slow month." },
      { type: "h2", text: "Watch the signals weekly" },
      { type: "p", text: "Compare deposits against the same week last year, not just last week. A soft week against a soft season is normal; a soft week against a strong one is a signal worth acting on early. Owners who check weekly while the season is good tend to arrive at the slow months with options instead of urgency." },
    ],
    faq: [
      { q: "When should a seasonal business apply for financing?", a: "In the shoulder season, before the dip. Your statements look steadier, there is no deadline pressure, and a facility arranged early is ready the day deposits slow down." },
      { q: "How much reserve should I aim for?", a: "Start with one month of fixed costs (rent, payroll, insurance), then build toward two or three depending on how long your slow season runs." },
      { q: "Can payments flex with a slow month?", a: "Yes. Advances repay as a share of deposits, so remittances naturally shrink when sales slow. Fixed-payment products suit businesses whose trough is still predictable enough to budget around." },
    ],
  },
  {
    slug: "understanding-factor-rates",
    title: "Factor rates, APR and total cost: reading a funding offer",
    excerpt: "What each number on an offer means, and how to compare offers that are priced differently.",
    category: "Guides",
    date: "2026-08-21",
    image: photos.formsAndLaptop,
    body: [
      { type: "p", text: "Two offers can look completely different on paper and cost the same, or look similar and differ by thousands of dollars. Understanding the three numbers on an offer (the buy rate, the total repayment and the APR) is the difference between comparing prices and guessing. Here is how to read each one." },
      { type: "h2", text: "The buy rate: cost in one multiplier" },
      { type: "p", text: "Short-term products, including merchant cash advances, are priced with a buy rate: a multiplier applied to the amount you receive. A buy rate of 1.15 on $20,000 means you repay $23,000. That is the whole calculation. The industry also calls this a factor rate; Ventra Fund quotes it as a buy rate, and either way the meaning is identical: total cost expressed as one number, fixed the day you sign." },
      { type: "p", text: "The buy rate does not account for time. Two advances with the same buy rate cost the same in dollars whether they are repaid in six months or twelve, which means the faster one costs you more per month. That is why it is not the only number to read." },
      { type: "h2", text: "The APR: cost adjusted for time" },
      { type: "p", text: "An APR expresses the cost of borrowing over a year, including fees and the effect of how quickly you repay. It exists so that products priced differently (a buy rate here, an interest rate there) can finally be compared on the same scale. A modest total cost spread over two years can be a far lower APR than the same dollars paid back over six months." },
      { type: "p", text: "We show an estimated APR alongside the buy rate on every offer precisely so you are never comparing apples to oranges. If a funder will not give you both numbers, that is a reason to keep looking." },
      { type: "h2", text: "The total repayment: the number you actually pay" },
      { type: "p", text: "Under every formula sits one figure: the total dollars leaving your account between today and payoff. Ask for it in writing, in dollars, before you sign. Ours appears on the first page of every offer, because a total you cannot see is a total you cannot compare." },
      { type: "h2", text: "How to compare two offers" },
      { type: "list", items: [
        "Put the total repayment of both offers side by side, in dollars, over the same period.",
        "Check the payment schedule: does it match how your revenue actually arrives?",
        "Read the buy rate for short-term products and the estimated APR for anything longer; never compare one against the other.",
        "Ask about prepayment: on eligible products, paying early lowers your total cost.",
        "Confirm there are no fees outside the quoted cost, and get the answer in writing.",
      ] },
      { type: "h2", text: "What good transparency looks like" },
      { type: "p", text: "A trustworthy offer is boring to read: one total, one schedule, one buy rate, no surprises at signing. That is the standard we hold ourselves to on <a href=\"/why-us/transparent-pricing\">every offer we make</a>, and it is a fair standard to hold any funder to. If any number on the page cannot be explained in a sentence, ask until it can." },
    ],
    faq: [
      { q: "Is a buy rate the same as a factor rate?", a: "Yes. They are two names for the same multiplier applied to your advance. Ventra Fund uses 'buy rate'; you will see 'factor rate' used across the industry." },
      { q: "Why do short-term products show an APR as well?", a: "A buy rate shows total cost but ignores time. The APR adjusts for time so you can compare a six-month advance against a two-year facility on equal footing." },
      { q: "Does paying off early lower my cost?", a: "On eligible products, yes. Prepayment discounts reduce your total when you settle early. Your offer spells out exactly how before you sign." },
    ],
  },
];
