// Long-form content for each product's page at /capital/<slug>. Figures (amounts, terms,
// requirements) come from funding-products.ts so the pages can't drift from the comparison table;
// this file only holds the prose. FAQs live in faqs.ts under the same slug.
import { fundingProducts, productSlug, type FundingProduct } from "@/data/funding-products";
import { photos, type Photo } from "@/data/photos";

export interface ProductPage {
  slug: string;
  product: FundingProduct;
  /** H1; defaults to the product title. */
  heading: string;
  intro: string[];
  image: Photo;
  howItWorks: string[];
  advantages: { title: string; text: string }[];
  comparison: { title: string; intro: string; them: string; rows: { label: string; them: string; us: string }[] };
  uses: string[];
  goodFitIf: string[];
  stories: string[];
}

type Content = Omit<ProductPage, "slug" | "product">;

const content: Record<string, Content> = {
  "merchant-cash-advances": {
    heading: "Merchant cash advances for small businesses",
    intro: [
      "A merchant cash advance gives you a lump sum today in exchange for a share of your future sales. Remittances come out as a fixed percentage of your deposits, so they ease off in slow weeks and pick up when business is busy.",
      "It's built for owners who need capital fast and whose revenue doesn't follow a straight line.",
    ],
    image: photos.grocerStorefront,
    howItWorks: [
      "We look at your recent deposits to size an advance you can comfortably carry. Once you accept, the funds land in your business account, and an agreed percentage of each day's or week's deposits goes toward the total until it's delivered.",
      "There's no fixed term and no set monthly payment. If sales dip, the remittance dips with them. Our underwriting weighs your revenue alongside your credit, which is why owners with imperfect credit still qualify.",
    ],
    advantages: [
      { title: "Remittances that follow revenue", text: "A slow month means a smaller remittance, not a missed payment." },
      { title: "Decisions in about a day", text: "Most applicants hear back within 24 hours, with funding soon after." },
      { title: "Credit isn't the whole story", text: "Strong, steady deposits can outweigh a lower score." },
      { title: "No equity, no collateral", text: "You keep full ownership and don't pledge property." },
    ],
    comparison: {
      title: "How an advance compares to a bank loan",
      intro: "Owners weighing an advance are usually comparing it with a traditional bank loan. Here's how the two differ.",
      them: "Bank loan",
      rows: [
        { label: "Speed", them: "Weeks to months of underwriting.", us: "A decision in about a day, funding shortly after." },
        { label: "Payments", them: "Fixed monthly payment, whatever your sales.", us: "A percentage of deposits that moves with revenue." },
        { label: "Qualifying", them: "Strong credit and often collateral required.", us: "Driven by revenue; credit from 450 considered." },
        { label: "Cost", them: "Usually lower.", us: "Usually higher, in exchange for speed and flexibility." },
      ],
    },
    uses: ["Bridging a seasonal slowdown", "Stocking up before a busy season", "Covering payroll during a slow month", "Emergency repairs", "Marketing pushes"],
    goodFitIf: ["Your revenue swings month to month", "You run high card or deposit volume", "You need capital within days, not weeks", "Your credit would hold you back at a bank"],
    stories: [
      "A landscaping company that earns most of its revenue between April and October can take an advance in early spring to hire crew and stock materials, then remit more as the busy season pays out.",
      "A restaurant between holiday rushes can cover payroll and inventory through a quiet stretch, with remittances that stay small until covers pick back up.",
    ],
  },
  "term-loans": {
    heading: "Term loans with fixed, predictable payments",
    intro: [
      "A term loan puts the full amount in your account up front, repaid in equal installments over a set number of months. Your cost is fixed when you sign, so every payment is known in advance.",
      "It's the straightforward choice for a planned investment with a clear payoff.",
    ],
    image: photos.mechanicWorkshop,
    howItWorks: [
      "Tell us how much you need and what it's for. We review your revenue, cash flow and credit, then offer an amount, term and fixed payment. Once you accept, the full amount is deposited and payments begin on a regular schedule.",
      "Because the payment never changes, a term loan is easy to build into a budget. Many of our term loans also carry prepayment discounts, so paying early costs less.",
    ],
    advantages: [
      { title: "Fixed payments", text: "The same amount every period, so planning is simple." },
      { title: "Larger amounts", text: "Sized for real investments like equipment or a second location." },
      { title: "Longer terms", text: "Spread repayment over as long as five years." },
      { title: "Prepayment discounts", text: "Pay off early and lower your total cost." },
    ],
    comparison: {
      title: "How a term loan compares to an SBA loan",
      intro: "SBA loans are often the cheapest option on paper, but they come with trade-offs in time and paperwork.",
      them: "SBA loan",
      rows: [
        { label: "Speed", them: "Often six weeks to several months.", us: "Funding in one to three days after approval." },
        { label: "Paperwork", them: "Business plan, tax returns, personal financial statements.", us: "A short application and recent bank statements." },
        { label: "Down payment", them: "Usually at least 10%.", us: "None required." },
        { label: "Use of funds", them: "Restricted to the purpose in your plan.", us: "Any legitimate business purpose." },
      ],
    },
    uses: ["Buying equipment or vehicles", "Opening a new location", "Renovations and build-outs", "Hiring ahead of growth", "Large inventory orders"],
    goodFitIf: ["You have a specific, one-time investment in mind", "Your revenue is steady and predictable", "You want a fixed cost you can plan around", "You've been in business a year or more"],
    stories: [
      "A dental practice adding a second operatory can finance the chair, imaging and build-out with one loan and a payment it knows from day one.",
      "A bakery buying a delivery van can match the loan term to the vehicle's useful life, keeping the monthly cost in line with the revenue it brings in.",
    ],
  },
  "lines-of-credit": {
    heading: "Business lines of credit",
    intro: [
      "A line of credit is a pool of capital you can draw on whenever you need it. Take any amount up to your limit, repay it, and draw again, paying interest only on what you've used.",
      "It's a standing safety net for cash flow gaps and costs you can't schedule.",
    ],
    image: photos.warehouseOwner,
    howItWorks: [
      "We set a credit limit based on your revenue and history. Draw what you need, when you need it, and the funds arrive in your account. As you repay, that amount becomes available again.",
      "You only pay interest on the outstanding balance, so an unused line costs little or nothing to keep open.",
    ],
    advantages: [
      { title: "Draw on demand", text: "Capital is ready before you need it, not after." },
      { title: "Pay for what you use", text: "Interest applies only to the balance you've drawn." },
      { title: "Reusable", text: "Repaid amounts become available to draw again." },
      { title: "Fits uneven costs", text: "Handles surprises without a new application each time." },
    ],
    comparison: {
      title: "How a line of credit compares to a business credit card",
      intro: "Both let you borrow as you go. The differences show up in cost and in what you can pay for.",
      them: "Business credit card",
      rows: [
        { label: "Cost", them: "Often 20%+ APR, plus cash advance fees.", us: "From prime + 1.75% on the drawn balance." },
        { label: "Cash access", them: "Cash and checks cost extra.", us: "Draws go straight to your bank account." },
        { label: "Limits", them: "Often low for newer businesses.", us: "Up to $250K based on revenue." },
        { label: "Personal credit", them: "Utilization can hit your personal score.", us: "Doesn't touch your card utilization." },
      ],
    },
    uses: ["Smoothing cash flow between invoices", "Unexpected repairs", "Taking advantage of supplier discounts", "Short-term payroll gaps"],
    goodFitIf: ["Your costs are irregular or hard to predict", "You want capital ready before you need it", "You'd rather pay only for what you use"],
    stories: [
      "A contractor waiting 45 days on a commercial client can draw on the line to cover materials for the next job, then repay when the invoice clears.",
      "A retailer offered a bulk discount by a supplier can draw for the order and repay from the margin it earns.",
    ],
  },
  consolidations: {
    heading: "Consolidate your business debt into one payment",
    intro: [
      "If you're carrying two or more advances or loans, consolidation replaces them with a single facility. We pay off the existing balances and you make one payment, usually at a lower combined cost.",
      "It's a way to take back control of your daily cash flow.",
    ],
    image: photos.ownerDeskPaperwork,
    howItWorks: [
      "Share your current positions with us: who you owe, the balances and the payment schedules. We structure one new facility that pays them off, then you make a single payment on a schedule that fits your revenue.",
      "We'll show you the total cost side by side with what you pay today, so you can see whether consolidating actually saves money.",
    ],
    advantages: [
      { title: "One payment", text: "Replace several withdrawals with a single, predictable one." },
      { title: "Lower blended cost", text: "Often cheaper than the positions it replaces." },
      { title: "More breathing room", text: "Free up daily cash flow for running the business." },
      { title: "Clear numbers", text: "A side-by-side comparison before you commit." },
    ],
    comparison: {
      title: "Consolidating vs. keeping multiple positions",
      intro: "Stacked advances can quietly eat into cash flow. Here's what changes when you consolidate.",
      them: "Multiple positions",
      rows: [
        { label: "Payments", them: "Several withdrawals, often daily.", us: "One payment on one schedule." },
        { label: "Cost", them: "Each priced separately, often high.", us: "A single, usually lower, blended cost." },
        { label: "Tracking", them: "Different terms and payoff dates.", us: "One balance and one payoff date." },
      ],
    },
    uses: ["Paying off stacked merchant cash advances", "Combining high-cost short-term loans", "Reducing daily withdrawals"],
    goodFitIf: ["You have two or more open advances or loans", "Daily withdrawals are squeezing cash flow", "You've been in business a year or more"],
    stories: [
      "A trucking company carrying three advances with daily withdrawals can consolidate into one weekly payment and put the difference toward fuel and maintenance.",
    ],
  },
  "cash-credit": {
    heading: "Cash credit for day-to-day working capital",
    intro: [
      "Cash credit is a running credit account secured against your business assets, like inventory or receivables. Draw up to your sanctioned limit, repay, and draw again, paying interest only on what's outstanding.",
      "It's designed for established businesses that turn inventory and receivables into cash every day.",
    ],
    image: photos.stockroomTablet,
    howItWorks: [
      "We set a limit based on the value of your inventory, receivables or other business assets. Draw as needed for day-to-day operations, and repay as cash comes in.",
      "Interest is charged only on the amount drawn, and the facility runs for a set term with the option to renew.",
    ],
    advantages: [
      { title: "Interest on usage only", text: "Pay for the balance you carry, nothing more." },
      { title: "Asset-backed limits", text: "Larger limits for businesses with inventory or receivables." },
      { title: "Built for operations", text: "Covers the gap between buying stock and getting paid." },
      { title: "Renewable", text: "Roll the facility into a new term as you grow." },
    ],
    comparison: {
      title: "Cash credit vs. a line of credit",
      intro: "Both are revolving. The difference is what backs them and how large they can go.",
      them: "Line of credit",
      rows: [
        { label: "Security", them: "Usually unsecured.", us: "Secured against business assets." },
        { label: "Limits", them: "Up to $250K.", us: "Up to $975K, based on asset value." },
        { label: "Requirements", them: "6+ months in business.", us: "2+ years in business." },
      ],
    },
    uses: ["Inventory purchases", "Covering receivables cycles", "Day-to-day operating costs", "Supplier payments"],
    goodFitIf: ["You hold significant inventory or receivables", "You need ongoing working capital, not a one-time sum", "You've been in business two years or more"],
    stories: [
      "A wholesale distributor can draw against its stock to pay suppliers upfront, then repay as retailers settle their invoices.",
    ],
  },
};

export const productPages: ProductPage[] = fundingProducts.map((product) => {
  const slug = productSlug(product);
  const page = content[slug];
  if (!page) throw new Error(`No page content for product "${product.title}" (slug "${slug}") in product-pages.ts`);
  return { slug, product, ...page };
});
