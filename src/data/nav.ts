// Site navigation. Every link has a page; most are scaffolds with placeholder copy and images
// (see src/data/company.ts and ImagePlaceholder) to be filled in before launch.
import { fundingProducts, productSlug } from "@/data/funding-products";

export interface NavLink {
  href: string;
  label: string;
}

export interface NavMenu {
  label: string;
  links: NavLink[];
}

/** The thin bar above the main nav. The phone reveal sits at its right, after `utilityLinksEnd`. */
export const utilityLinks: NavLink[] = [
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact Us" },
  { href: "/careers", label: "Careers" },
  { href: "/search", label: "Search" },
];

export const utilityLinksEnd: NavLink[] = [{ href: "/partner/login", label: "Partner Login" }];

export const navMenus: NavMenu[] = [
  {
    label: "About Us",
    links: [
      { href: "/about", label: "Our Story" },
      { href: "/about/leadership", label: "Leadership" },
      { href: "/about/reviews", label: "Customer Reviews" },
      { href: "/about/press", label: "Press" },
    ],
  },
  {
    label: "Why Us",
    links: [
      { href: "/why-us", label: "Why Ventra Fund" },
      { href: "/why-us/how-it-works", label: "How It Works" },
      { href: "/why-us/transparent-pricing", label: "Transparent Pricing" },
      { href: "/why-us/faq", label: "FAQ" },
    ],
  },
  {
    label: "Who We Fund",
    links: [
      { href: "/who-we-fund", label: "All Industries" },
      { href: "/who-we-fund/restaurants", label: "Restaurants" },
      { href: "/who-we-fund/retail", label: "Retail" },
      { href: "/who-we-fund/construction", label: "Construction" },
      { href: "/who-we-fund/healthcare", label: "Healthcare" },
      { href: "/who-we-fund/trucking", label: "Trucking & Transportation" },
    ],
  },
  {
    label: "Financing Solutions",
    links: [
      { href: "/capital", label: "Compare All Options" },
      ...fundingProducts.map((p) => ({ href: `/capital/${productSlug(p)}`, label: p.title })),
    ],
  },
  {
    label: "Partners",
    links: [
      { href: "/partner", label: "Become a Partner" },
      { href: "/partners/brokers", label: "Broker & ISO Partners" },
      { href: "/partners/referral", label: "Referral Partners" },
      { href: "/partner/login", label: "Partner Login" },
    ],
  },
];
