// Long-form content for each product's page at /capital/<slug>. Figures (amounts, terms,
// requirements) and the one-line definition come from funding-products.ts so the pages can't drift
// from the comparison table; this file only holds the prose. FAQs live in faqs.ts under the same slug.
import { fundingProducts, productSlug, type FundingProduct } from "@/data/funding-products";
import { photos, type Photo } from "@/data/photos";

export interface ProductPage {
  slug: string;
  product: FundingProduct;
  /** H1; defaults to the product title. */
  heading: string;
  /** Singular, used mid-sentence in section headings ("How a line of credit works"). */
  noun: string;
  image: Photo;
  howItWorks: string;
  advantages: { title: string; text: string }[];
  comparison: { title: string; them: string; rows: { label: string; them: string; us: string }[] };
  uses: string[];
  goodFitIf: string[];
  example: string;
}

type Content = Omit<ProductPage, "slug" | "product">;

const content: Record<string, Content> = {
  "merchant-cash-advances": {
    heading: "Merchant cash advances for small businesses",
    noun: "a merchant cash advance",
    image: photos.grocerStorefront,
    howItWorks: "We size the advance from your recent deposits. Once you accept, the funds land in your account and a set percentage of each day's or week's deposits goes toward the total. There's no fixed term and no monthly payment.",
    advantages: [
      { title: "Payments follow revenue", text: "A slow month means a smaller remittance, not a missed payment." },
      { title: "Fast decisions", text: "Most applicants hear back within 24 hours." },
      { title: "Credit isn't everything", text: "Steady deposits can outweigh a lower score." },
      { title: "No collateral", text: "You keep full ownership and pledge no property." },
    ],
    comparison: {
      title: "Advance vs. bank loan",
      them: "Bank loan",
      rows: [
        { label: "Speed", them: "Weeks to months.", us: "A decision in about a day." },
        { label: "Payments", them: "Fixed monthly, whatever your sales.", us: "A share of deposits that moves with revenue." },
        { label: "Qualifying", them: "Strong credit, often collateral.", us: "Revenue first; credit from 450 considered." },
        { label: "Cost", them: "Usually lower.", us: "Usually higher, for speed and flexibility." },
      ],
    },
    uses: ["Seasonal slowdowns", "Stocking up before a busy season", "Payroll in a slow month", "Emergency repairs", "Marketing pushes"],
    goodFitIf: ["Your revenue swings month to month", "You run high card or deposit volume", "You need capital within days", "Your credit would hold you back at a bank"],
    example: "A landscaping company can take an advance in early spring to hire crew and buy materials, then remit more as the busy season pays out.",
  },
  "term-financing": {
    heading: "Term financing with fixed, predictable payments",
    noun: "term financing",
    image: photos.newCafeInterior,
    howItWorks: "Tell us how much you need and what it's for. We review your revenue, cash flow and credit, then offer an amount, a term and a fixed payment. Once you accept, the full amount is deposited and payments start on schedule.",
    advantages: [
      { title: "Fixed payments", text: "The same amount every period." },
      { title: "Larger amounts", text: "Sized for equipment, build-outs or a new location." },
      { title: "Longer terms", text: "Up to five years to repay." },
      { title: "Prepayment discounts", text: "Pay off early and pay less." },
    ],
    comparison: {
      title: "Term financing vs. SBA loan",
      them: "SBA loan",
      rows: [
        { label: "Speed", them: "Six weeks to several months.", us: "One to three days after approval." },
        { label: "Paperwork", them: "Business plan, tax returns, personal financials.", us: "A short application and bank statements." },
        { label: "Down payment", them: "Usually 10% or more.", us: "None." },
        { label: "Use of funds", them: "Limited to your stated plan.", us: "Any legitimate business purpose." },
      ],
    },
    uses: ["Equipment or vehicles", "A new location", "Renovations and build-outs", "Hiring ahead of growth", "Large inventory orders"],
    goodFitIf: ["You have a specific, one-time investment in mind", "Your revenue is steady", "You want a fixed cost to plan around", "You've been in business a year or more"],
    example: "A bakery buying a delivery van can match the term to the van's useful life, keeping payments in line with the revenue it brings in.",
  },
  "lines-of-credit": {
    heading: "Business lines of credit",
    noun: "a line of credit",
    image: photos.warehouseOwner,
    howItWorks: "We set your limit from your revenue and history. Draw any amount up to it, whenever you need, and the funds go straight to your bank account.",
    advantages: [
      { title: "Ready before you need it", text: "No new application for each surprise." },
      { title: "Pay for what you use", text: "An unused line costs little or nothing." },
      { title: "Reusable", text: "Repaid amounts are available to draw again." },
      { title: "Fits uneven costs", text: "Covers gaps between invoices and unplanned bills." },
    ],
    comparison: {
      title: "Line of credit vs. business credit card",
      them: "Business credit card",
      rows: [
        { label: "Cost", them: "High APRs plus cash advance fees.", us: "Buy rates from 1.2 on what you draw." },
        { label: "Cash access", them: "Cash and checks cost extra.", us: "Draws go straight to your bank." },
        { label: "Limits", them: "Often low for newer businesses.", us: "Up to $250K, based on revenue." },
        { label: "Personal credit", them: "Utilization can hit your personal score.", us: "No effect on card utilization." },
      ],
    },
    uses: ["Cash flow between invoices", "Unexpected repairs", "Supplier discounts", "Short-term payroll gaps"],
    goodFitIf: ["Your costs are irregular", "You want capital ready before you need it", "You'd rather pay only for what you use"],
    example: "A retailer offered a bulk discount by a supplier can draw for the order, then repay from the margin it earns.",
  },
  consolidations: {
    heading: "Consolidate your business debt into one payment",
    noun: "consolidation",
    image: photos.consolidation,
    howItWorks: "Share who you owe, the balances and the payment schedules. We structure one facility that pays them off, with a single payment on a schedule that fits your revenue.",
    advantages: [
      { title: "One payment", text: "A single withdrawal instead of several." },
      { title: "Lower blended cost", text: "Often cheaper than the positions it replaces." },
      { title: "More breathing room", text: "Frees up daily cash flow." },
      { title: "Clear numbers", text: "See the total cost next to what you pay today before you commit." },
    ],
    comparison: {
      title: "Consolidating vs. multiple positions",
      them: "Multiple positions",
      rows: [
        { label: "Payments", them: "Several withdrawals, often daily.", us: "One payment on one schedule." },
        { label: "Cost", them: "Each priced separately, often high.", us: "One blended cost, usually lower." },
        { label: "Tracking", them: "Different terms and payoff dates.", us: "One balance, one payoff date." },
      ],
    },
    uses: ["Paying off stacked advances", "Combining high-cost short-term loans", "Reducing daily withdrawals"],
    goodFitIf: ["You have two or more open advances or loans", "Daily withdrawals are squeezing cash flow", "You've been in business a year or more"],
    example: "A trucking company carrying three advances with daily withdrawals can consolidate into one weekly payment and put the difference toward fuel and maintenance.",
  },
  "cash-credit": {
    heading: "Cash credit for day-to-day working capital",
    noun: "cash credit",
    image: photos.stockroomTablet,
    howItWorks: "We set your limit from the value of your inventory, receivables or other business assets. Draw for day-to-day costs, repay as cash comes in, and renew when the term ends.",
    advantages: [
      { title: "Interest on usage only", text: "Pay for the balance you carry, nothing more." },
      { title: "Asset-backed limits", text: "Larger limits for businesses with stock or receivables." },
      { title: "Built for operations", text: "Covers the gap between buying stock and getting paid." },
      { title: "Renewable", text: "Roll into a new term as you grow." },
    ],
    comparison: {
      title: "Cash credit vs. line of credit",
      them: "Line of credit",
      rows: [
        { label: "Security", them: "Usually unsecured.", us: "Secured against business assets." },
        { label: "Limits", them: "Up to $250K.", us: "Up to $975K, based on asset value." },
        { label: "Requirements", them: "6+ months in business.", us: "2+ years in business." },
      ],
    },
    uses: ["Inventory purchases", "Receivables cycles", "Day-to-day operating costs", "Supplier payments"],
    goodFitIf: ["You hold significant inventory or receivables", "You need ongoing working capital, not a one-time sum", "You've been in business two years or more"],
    example: "A wholesale distributor can draw against its stock to pay suppliers upfront, then repay as retailers settle their invoices.",
  },
};

export const productPages: ProductPage[] = fundingProducts.map((product) => {
  const slug = productSlug(product);
  const page = content[slug];
  if (!page) throw new Error(`No page content for product "${product.title}" (slug "${slug}") in product-pages.ts`);
  return { slug, product, ...page };
});
