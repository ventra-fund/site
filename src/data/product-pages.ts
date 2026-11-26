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
  /** Singular, used mid-sentence in section headings ("How a merchant cash advance works"). */
  noun: string;
  image: Photo;
  /** How the product works for the merchant, from submission to funding. */
  howItWorks: string;
  /** Why it's an easy product to place. */
  advantages: { title: string; text: string }[];
  /** How it compares with what the merchant may be weighing up; the page skips the section without one. */
  comparison?: { title: string; them: string; rows: { label: string; them: string; us: string }[] };
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
      { title: "Revenue first", text: "Steady deposits can carry a file with a lower credit score." },
      { title: "Fast decisions", text: "Most files get a decision within a day." },
      { title: "Remittances follow revenue", text: "A slow week means a smaller remittance, not a missed payment." },
      { title: "No collateral", text: "Your merchant keeps full ownership and pledges no property." },
    ],
    uses: ["Seasonal slowdowns", "Stocking up before a busy season", "Payroll in a slow month", "Emergency repairs", "Marketing pushes"],
    goodFitIf: ["Your merchant's revenue swings month to month", "They run high card or deposit volume", "They need capital within days", "Their revenue is stronger than their credit"],
    example: "A landscaping company you work with needs crew and materials in early spring. An advance funds it within days, and remittances rise as the busy season pays out.",
  },
  consolidations: {
    heading: "Consolidations for stacked merchants",
    noun: "a consolidation",
    image: photos.consolidation,
    howItWorks: "Send the merchant's open positions: who they owe, the balances and the payment schedules. We structure one advance that pays them off, with a single remittance on a schedule that fits their revenue.",
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
    uses: ["Paying off stacked advances", "Combining positions from several funders", "Reducing daily withdrawals"],
    goodFitIf: ["Your merchant has two or more open advances", "Daily withdrawals are squeezing their cash flow", "They've been in business a year or more"],
    example: "A trucking company you work with carries three advances with daily withdrawals. A consolidation turns them into one weekly payment, and the difference goes toward fuel and maintenance.",
  },
};

export const productPages: ProductPage[] = fundingProducts.map((product) => {
  const slug = productSlug(product);
  const page = content[slug];
  if (!page) throw new Error(`No page content for product "${product.title}" (slug "${slug}") in product-pages.ts`);
  return { slug, product, ...page };
});
