// Site map: the search page lists these. Every link has a page. (The site header, SiteHeader.astro,
// keeps its own links, copied from Main Capital's nav.) The site is written for ISOs and brokers; merchants come to us only through them.
import { fundingProducts, productSlug } from "@/data/funding-products";
import { industries } from "@/data/industries";

export interface NavLink {
  href: string;
  label: string;
}

export interface NavMenu {
  label: string;
  links: NavLink[];
}

/** Secondary pages, outside the menus below. */
export const utilityLinks: NavLink[] = [
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact Us" },
  { href: "/careers", label: "Careers" },
  { href: "/search", label: "Search" },
];

/** Sign-in for existing partners. */
export const utilityLinksEnd: NavLink[] = [{ href: "/partner/login", label: "Partner Login" }];

export const navMenus: NavMenu[] = [
  {
    label: "For ISOs",
    links: [
      { href: "/why-us", label: "Why Ventra Fund" },
      { href: "/why-us/how-it-works", label: "How Submissions Work" },
      { href: "/why-us/transparent-pricing", label: "Commission" },
      { href: "/partners/brokers", label: "ISO Partner Program" },
      { href: "/why-us/faq", label: "FAQ" },
      { href: "/partner", label: "Onboard Now" },
    ],
  },
  {
    label: "What We Fund",
    links: [
      { href: "/who-we-fund", label: "Deal Guidelines" },
      ...industries.map((i) => ({ href: `/who-we-fund/${i.slug}`, label: i.name })),
    ],
  },
  {
    label: "Products",
    links: [
      { href: "/capital", label: "Compare Products" },
      ...fundingProducts.map((p) => ({ href: `/capital/${productSlug(p)}`, label: p.title })),
    ],
  },
  {
    label: "About Us",
    links: [
      { href: "/about", label: "Our Story" },
      { href: "/about/leadership", label: "Leadership" },
      { href: "/careers", label: "Careers" },
    ],
  },
];
