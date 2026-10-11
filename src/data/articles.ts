// Placeholder articles for the Resources and Press pages. The article pages themselves
// (/resources/<slug>) don't exist yet; swap this for a content collection when they do.
// TODO: replace with real articles before launch.

export type ArticleCategory = "Financing Tips" | "Guides" | "Company News";

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  date: string;
  image: string;
}

export const articleCategories: ArticleCategory[] = ["Financing Tips", "Guides", "Company News"];

export const articles: Article[] = [
  {
    slug: "merchant-cash-advance-vs-term-loan",
    title: "Merchant cash advance vs. term loan: which fits your business?",
    excerpt: "How the two most common working capital products differ in cost, speed and repayment, and how to choose.",
    category: "Financing Tips",
    date: "2026-09-30",
    image: "Two paths diverging, or a side-by-side comparison graphic",
  },
  {
    slug: "preparing-bank-statements",
    title: "What lenders look for in your bank statements",
    excerpt: "The deposits, balances and patterns underwriters notice first, and how to present your business at its best.",
    category: "Guides",
    date: "2026-09-18",
    image: "Close-up of a business bank statement with highlighted figures",
  },
  {
    slug: "seasonal-cash-flow",
    title: "Planning cash flow for a seasonal business",
    excerpt: "A practical approach to stocking up, staffing and staying solvent through the slow months.",
    category: "Financing Tips",
    date: "2026-09-04",
    image: "Calendar with busy and slow seasons marked",
  },
  {
    slug: "understanding-factor-rates",
    title: "Factor rates, APR and total cost: reading a funding offer",
    excerpt: "What each number on an offer means, and how to compare offers that are priced differently.",
    category: "Guides",
    date: "2026-08-21",
    image: "Calculator on top of a printed funding offer",
  },
  {
    slug: "ventra-fund-launch",
    title: "[Company news headline]",
    excerpt: "[Short summary of the announcement.]",
    category: "Company News",
    date: "2026-08-01",
    image: "Team photo at the office",
  },
  {
    slug: "community-spotlight",
    title: "[Community or award announcement]",
    excerpt: "[Short summary of the announcement.]",
    category: "Company News",
    date: "2026-07-15",
    image: "Local event or award ceremony photo",
  },
];
