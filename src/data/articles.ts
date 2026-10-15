// Placeholder articles for the Resources pages. The article pages themselves
// (/resources/<slug>) don't exist yet; swap this for a content collection when they do.
// TODO: replace with real articles before launch.
import { photos, type Photo } from "@/data/photos";

export type ArticleCategory = "Financing Tips" | "Guides";

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  date: string;
  image: Photo;
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
  },
  {
    slug: "preparing-bank-statements",
    title: "What lenders look for in your bank statements",
    excerpt: "The deposits, balances and patterns underwriters notice first, and how to present your business at its best.",
    category: "Guides",
    date: "2026-09-18",
    image: photos.receiptsCalculator,
  },
  {
    slug: "seasonal-cash-flow",
    title: "Planning cash flow for a seasonal business",
    excerpt: "A practical approach to stocking up, staffing and staying solvent through the slow months.",
    category: "Financing Tips",
    date: "2026-09-04",
    image: photos.florist,
  },
  {
    slug: "understanding-factor-rates",
    title: "Factor rates, APR and total cost: reading a funding offer",
    excerpt: "What each number on an offer means, and how to compare offers that are priced differently.",
    category: "Guides",
    date: "2026-08-21",
    image: photos.formsAndLaptop,
  },
];
