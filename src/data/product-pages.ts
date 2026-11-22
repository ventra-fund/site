// Long-form content for each product's page at /capital/<slug>. Figures (amounts, terms,
// requirements) and the one-line definition come from funding-products.ts so the pages can't drift
// from the comparison table; this file only holds the prose. FAQs live in faqs.ts under the same slug.
// Written for the ISO submitting the deal: "you" is the ISO, the business is "your merchant".
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
  /** How the product works for the merchant, from submission to funding. */
  howItWorks: string;
  /** Why it's an easy product to place. */
  advantages: { title: string; text: string }[];
  /** How it compares with what the merchant may be weighing up. */
  comparison: { title: string; them: string; rows: { label: string; them: string; us: string }[] };
  uses: string[];
  /** When to submit it: each item describes the merchant. */
  goodFitIf: string[];
  /** A deal you might place it on. */
  example: string;
}

type Content = Omit<ProductPage, "slug" | "product">;

const content: Record<string, Content> = {
  "merchant-cash-advances": {
    heading: "Merchant cash advances for B and C paper",
    noun: "a merchant cash advance",
    image: photos.grocerStorefront,
    howItWorks: "We size the advance from the merchant's recent deposits, not their credit score alone. Once they accept, the funds land in their account and a set share of each day's or week's deposits goes toward the total. There's no fixed term and no monthly payment.",
    advantages: [
      { title: "Revenue first", text: "Steady deposits can carry a file that a lower score would sink at a bank." },
      { title: "Fast decisions", text: "Most files get a decision within a day." },
      { title: "Remittances follow revenue", text: "A slow week means a smaller remittance, not a missed payment." },
      { title: "No collateral", text: "Your merchant keeps full ownership and pledges no property." },
    ],
    comparison: {
      title: "Advance vs. bank loan",
      them: "Bank loan",
      rows: [
        { label: "Speed", them: "Weeks to months.", us: "A decision in about a day." },
        { label: "Payments", them: "Fixed monthly, whatever the sales.", us: "A share of deposits that moves with revenue." },
        { label: "Qualifying", them: "Strong credit, often collateral.", us: "Revenue first; credit from 450 considered." },
        { label: "Cost", them: "Usually lower.", us: "Usually higher, for speed and flexibility." },
      ],
    },
    uses: ["Seasonal slowdowns", "Stocking up before a busy season", "Payroll in a slow month", "Emergency repairs", "Marketing pushes"],
    goodFitIf: ["Your merchant's revenue swings month to month", "They run high card or deposit volume", "They need capital within days", "Their credit would hold them back at a bank"],
    example: "A landscaping company you work with needs crew and materials in early spring. An advance funds it within days, and remittances rise as the busy season pays out.",
  },
  "term-financing": {
    heading: "Term financing for planned purchases",
    noun: "term financing",
    image: photos.newCafeInterior,
    howItWorks: "Send the amount your merchant needs and what it's for. We review revenue, cash flow and credit, then offer an amount, a term and a fixed payment. Once the merchant accepts, the full amount is deposited and payments start on schedule.",
    advantages: [
      { title: "Fixed payments", text: "The same amount every period, so the offer is easy to explain." },
      { title: "Larger amounts", text: "Sized for equipment, build-outs or a new location." },
      { title: "Longer terms", text: "Up to five years to repay." },
      { title: "Prepayment discounts", text: "Your merchant pays less if they pay off early." },
    ],
    comparison: {
      title: "Term financing vs. SBA loan",
      them: "SBA loan",
      rows: [
        { label: "Speed", them: "Six weeks to several months.", us: "One to three days after approval." },
        { label: "Paperwork", them: "Business plan, tax returns, personal financials.", us: "A signed application and bank statements." },
        { label: "Down payment", them: "Usually 10% or more.", us: "None." },
        { label: "Use of funds", them: "Limited to the stated plan.", us: "Any legitimate business purpose." },
      ],
    },
    uses: ["Equipment or vehicles", "A new location", "Renovations and build-outs", "Hiring ahead of growth", "Large inventory orders"],
    goodFitIf: ["Your merchant has a specific, one-time investment in mind", "Their revenue is steady", "They want a fixed cost to plan around", "They've been in business a year or more"],
    example: "A bakery you work with is buying a delivery van. Term financing matches the term to the van's useful life, so the payment lines up with the revenue the van brings in.",
  },
  "lines-of-credit": {
    heading: "Business lines of credit",
    noun: "a line of credit",
    image: photos.warehouseOwner,
    howItWorks: "We set the limit from the merchant's revenue and history. They draw any amount up to it, whenever they need, and each draw goes straight to their bank account.",
    advantages: [
      { title: "Ready before it's needed", text: "No new submission for every surprise bill." },
      { title: "Pay for what's used", text: "An unused line costs your merchant little or nothing." },
      { title: "Reusable", text: "Repaid amounts are available to draw again." },
      { title: "Fits uneven costs", text: "Covers gaps between invoices and unplanned bills." },
    ],
    comparison: {
      title: "Line of credit vs. business credit card",
      them: "Business credit card",
      rows: [
        { label: "Cost", them: "High APRs plus cash advance fees.", us: "Priced only on what's drawn." },
        { label: "Cash access", them: "Cash and checks cost extra.", us: "Draws go straight to the merchant's bank." },
        { label: "Limits", them: "Often low for newer businesses.", us: "Up to $250K, based on revenue." },
        { label: "Personal credit", them: "Utilization can hit the owner's personal score.", us: "No effect on card utilization." },
      ],
    },
    uses: ["Cash flow between invoices", "Unexpected repairs", "Supplier discounts", "Short-term payroll gaps"],
    goodFitIf: ["Your merchant's costs are irregular", "They want capital ready before they need it", "They'd rather pay only for what they use"],
    example: "A retailer you work with is offered a bulk discount by a supplier. They draw on the line for the order, then repay from the margin it earns.",
  },
  consolidations: {
    heading: "Consolidations for stacked merchants",
    noun: "a consolidation",
    image: photos.consolidation,
    howItWorks: "Send the merchant's open positions: who they owe, the balances and the payment schedules. We structure one facility that pays them off, with a single payment on a schedule that fits their revenue.",
    advantages: [
      { title: "One payment", text: "A single withdrawal instead of several." },
      { title: "Lower blended cost", text: "Often cheaper than the positions it replaces." },
      { title: "Stack checked up front", text: "Pre-approval reads the position stack automatically, before an underwriter picks up the file." },
      { title: "Clear numbers", text: "Your merchant sees the total cost next to what they pay today before committing." },
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
    goodFitIf: ["Your merchant has two or more open advances or loans", "Daily withdrawals are squeezing their cash flow", "They've been in business a year or more"],
    example: "A trucking company you work with carries three advances with daily withdrawals. A consolidation turns them into one weekly payment, and the difference goes toward fuel and maintenance.",
  },
  "cash-credit": {
    heading: "Cash credit for day-to-day working capital",
    noun: "cash credit",
    image: photos.stockroomTablet,
    howItWorks: "We set the limit from the value of the merchant's inventory, receivables or other business assets. They draw for day-to-day costs, repay as cash comes in, and renew when the term ends.",
    advantages: [
      { title: "Pay on usage only", text: "Your merchant pays for the balance they carry, nothing more." },
      { title: "Asset-backed limits", text: "Larger limits for merchants with stock or receivables." },
      { title: "Built for operations", text: "Covers the gap between buying stock and getting paid." },
      { title: "Renewable", text: "Rolls into a new term as the merchant grows." },
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
    goodFitIf: ["Your merchant holds significant inventory or receivables", "They need ongoing working capital, not a one-time sum", "They've been in business two years or more"],
    example: "A wholesale distributor you work with draws against its stock to pay suppliers upfront, then repays as retailers settle their invoices.",
  },
};

export const productPages: ProductPage[] = fundingProducts.map((product) => {
  const slug = productSlug(product);
  const page = content[slug];
  if (!page) throw new Error(`No page content for product "${product.title}" (slug "${slug}") in product-pages.ts`);
  return { slug, product, ...page };
});
