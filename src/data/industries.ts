// Industry pages under /who-we-fund/<slug>. `products` are product slugs (product-pages.ts) shown as
// the recommended options, in order.
import { photos, type Photo } from "@/data/photos";

export interface Industry {
  slug: string;
  name: string;
  /** Plural noun for the businesses, used mid-sentence in section headings ("How restaurants use…"). */
  audience: string;
  heading: string;
  intro: string;
  image: Photo;
  /** Beside the "How … use our funding" list; should differ from the hero `image`. */
  usesImage: Photo;
  challenges: { title: string; text: string }[];
  uses: string[];
  products: string[];
  example: string;
}

export const industries: Industry[] = [
  {
    slug: "restaurants",
    name: "Restaurants",
    audience: "restaurants",
    heading: "Restaurant financing that keeps the kitchen running",
    intro: "We fund restaurants, cafés, bars and food trucks based on the sales they're already doing.",
    image: photos.chefPlating,
    usesImage: photos.restaurantServer,
    challenges: [
      { title: "Seasonal traffic", text: "Patio season and holidays bring the rush; January and February don't." },
      { title: "Equipment failures", text: "A walk-in cooler or range going down can't wait for a bank's timeline." },
      { title: "Daily cash needs", text: "Food costs, payroll and rent come due before the weekend's receipts clear." },
    ],
    uses: ["Kitchen equipment repair or replacement", "Renovations and patio build-outs", "Inventory ahead of busy seasons", "Payroll through slow months", "Opening a second location"],
    products: ["merchant-cash-advances", "term-financing", "lines-of-credit"],
    example: "A neighborhood bistro whose walk-in fails in July can replace it within days, with remittances tied to daily card sales so a slow Tuesday doesn't strain the books.",
  },
  {
    slug: "retail",
    name: "Retail",
    audience: "retailers",
    heading: "Retail financing for inventory, storefronts and growth",
    intro: "From boutiques to hardware stores, we fund retailers with capital sized to their sales.",
    image: photos.retailShelves,
    usesImage: photos.boutiqueOwner,
    challenges: [
      { title: "Inventory timing", text: "You pay for holiday stock months before it sells." },
      { title: "Supplier terms", text: "Bulk discounts reward paying upfront, if you have the cash." },
      { title: "Uneven months", text: "Sales spike around holidays and dip after." },
    ],
    uses: ["Seasonal inventory", "Store remodels and fixtures", "Point-of-sale and e-commerce upgrades", "Marketing campaigns", "New locations"],
    products: ["merchant-cash-advances", "lines-of-credit", "cash-credit"],
    example: "A toy store can stock up in September for the holidays, then repay from the November and December sales that stock produces.",
  },
  {
    slug: "construction",
    name: "Construction",
    audience: "contractors",
    heading: "Construction financing that bridges the gap between jobs",
    intro: "We help general contractors and trades keep crews working while they wait on invoices.",
    image: photos.contractorsPlans,
    usesImage: photos.excavatorCrew,
    challenges: [
      { title: "Slow receivables", text: "Net-30 to net-90 terms leave you carrying the cost of every job." },
      { title: "Upfront materials", text: "Lumber, steel and supplies are due before work starts." },
      { title: "Equipment costs", text: "Machinery is expensive to buy, rent or repair." },
    ],
    uses: ["Materials for new contracts", "Payroll while waiting on invoices", "Equipment purchases and repairs", "Bonding and mobilization costs", "Taking on larger projects"],
    products: ["lines-of-credit", "term-financing", "merchant-cash-advances"],
    example: "A roofing contractor waiting 60 days on a commercial job can draw on a line of credit to start the next one, then repay when the first invoice clears.",
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    audience: "healthcare practices",
    heading: "Financing for medical, dental and wellness practices",
    intro: "We fund independent practices, clinics and wellness businesses based on their real cash flow.",
    image: photos.clinicFrontDesk,
    usesImage: photos.practiceFrontOffice,
    challenges: [
      { title: "Reimbursement delays", text: "Insurance claims can take weeks to pay out." },
      { title: "Costly equipment", text: "Imaging, chairs and diagnostic tools are major investments." },
      { title: "Growth costs", text: "Adding a provider or a location needs capital upfront." },
    ],
    uses: ["Medical and dental equipment", "Practice expansion and build-outs", "Hiring providers and staff", "Covering reimbursement gaps", "Technology and software upgrades"],
    products: ["term-financing", "lines-of-credit", "cash-credit"],
    example: "A dental practice adding a second operatory can finance the equipment with a fixed monthly payment it can plan around from day one.",
  },
  {
    slug: "trucking",
    name: "Trucking & Transportation",
    audience: "trucking companies",
    heading: "Trucking and transportation financing",
    intro: "We fund owner-operators and fleets so their trucks stay on the road.",
    image: photos.truckFleet,
    usesImage: photos.semiTruckHighway,
    challenges: [
      { title: "Fuel and maintenance", text: "Costs hit every week, whether or not loads pay on time." },
      { title: "Broker payment terms", text: "Waiting 30 to 60 days for payment strains cash flow." },
      { title: "Unexpected downtime", text: "A truck in the shop earns nothing." },
    ],
    uses: ["Repairs and maintenance", "Fuel and insurance costs", "Adding trucks or trailers", "Covering slow-paying loads", "Consolidating existing advances"],
    products: ["merchant-cash-advances", "consolidations", "lines-of-credit"],
    example: "An owner-operator facing a major engine repair can be back on the road within the week, rather than losing weeks of loads waiting on a bank.",
  },
];

/** Groups shown on the Who We Fund hub, beyond the industries with their own pages. */
export const moreIndustries = [
  "Auto repair", "Beauty & salons", "Cleaning services", "Fitness & gyms", "HVAC & plumbing", "Landscaping",
  "Manufacturing", "Professional services", "Real estate services", "Staffing", "Wholesale & distribution", "E-commerce",
];

/** Businesses we can't fund, shown so applicants don't waste their time. */
export const notFunded = ["Startups under six months old", "Personal loans", "Non-profits", "Grants or government relief programs"];
