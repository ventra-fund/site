// Industry guidelines under /who-we-fund/<slug>, written for the ISO submitting the deal. `products`
// are product slugs (product-pages.ts) shown as the products to submit, in order.
import { photos, type Photo } from "@/data/photos";

export interface Industry {
  slug: string;
  name: string;
  /** Plural noun for the businesses, used mid-sentence in section headings ("How restaurants use…"). */
  audience: string;
  heading: string;
  /** Also the card text on the Who We Fund hub. */
  intro: string;
  image: Photo;
  /** Beside the "How … use the funds" list; should differ from the hero `image`. */
  usesImage: Photo;
  /** What we look at when underwriting files from this industry. */
  underwriting: { title: string; text: string }[];
  uses: string[];
  products: string[];
  /** A deal an ISO might place, told from the ISO's side. */
  example: string;
}

export const industries: Industry[] = [
  {
    slug: "restaurants",
    name: "Restaurants",
    audience: "restaurants",
    heading: "Submitting restaurant deals",
    intro: "Restaurants, cafés, bars and food trucks, funded on the sales they're already doing.",
    image: photos.chefPlating,
    usesImage: photos.restaurantServer,
    underwriting: [
      { title: "Seasonal traffic", text: "Patio season and holidays bring the rush; January and February don't. Steady deposits through the dips count for more than the peak." },
      { title: "Daily card sales", text: "Card volume makes remittances easy to size, which is why advances suit restaurant files so well." },
      { title: "Urgent repairs", text: "A walk-in cooler or range going down can't wait weeks. A decision within a day means it doesn't have to." },
    ],
    uses: ["Kitchen equipment repair or replacement", "Renovations and patio build-outs", "Inventory ahead of busy seasons", "Payroll through slow months", "Opening a second location"],
    products: ["merchant-cash-advances"],
    example: "A bistro you work with loses its walk-in in July. An advance replaces it within days, with remittances tied to daily card sales so a slow Tuesday doesn't strain the merchant.",
  },
  {
    slug: "retail",
    name: "Retail",
    audience: "retailers",
    heading: "Submitting retail deals",
    intro: "Boutiques to hardware stores, funded on their sales history.",
    image: photos.retailShelves,
    usesImage: photos.boutiqueOwner,
    underwriting: [
      { title: "Inventory timing", text: "Retailers pay for holiday stock months before it sells. We size to the sales history, not one month's deposits." },
      { title: "Uneven months", text: "Sales spike around holidays and dip after. We read the pattern across months." },
      { title: "Supplier terms", text: "Bulk discounts reward paying upfront, a clear and common use of funds." },
    ],
    uses: ["Seasonal inventory", "Store remodels and fixtures", "Point-of-sale and e-commerce upgrades", "Marketing campaigns", "New locations"],
    products: ["merchant-cash-advances"],
    example: "A toy store you work with stocks up in September for the holidays, then repays from the November and December sales that stock produces.",
  },
  {
    slug: "construction",
    name: "Construction",
    audience: "contractors",
    heading: "Submitting construction deals",
    intro: "General contractors and trades, funded to keep crews working while invoices clear.",
    image: photos.contractorsPlans,
    usesImage: photos.excavatorCrew,
    underwriting: [
      { title: "Slow receivables", text: "Net-30 to net-90 terms make deposits lumpy. We look at the pattern across jobs, not a single quiet month." },
      { title: "Upfront materials", text: "Lumber, steel and supplies are due before work starts, a clear and common use of funds." },
      { title: "Equipment costs", text: "Machinery is expensive to buy, rent or repair, and a breakdown mid-job can't wait weeks for funding." },
    ],
    uses: ["Materials for new contracts", "Payroll while waiting on invoices", "Equipment purchases and repairs", "Bonding and mobilization costs", "Taking on larger projects"],
    products: ["merchant-cash-advances"],
    example: "A roofing contractor you work with is waiting 60 days on a commercial job. An advance lets them start the next one now, with remittances that ease off while they wait on the first invoice.",
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    audience: "healthcare practices",
    heading: "Submitting healthcare deals",
    intro: "Independent practices, clinics and wellness businesses, funded on their real cash flow.",
    image: photos.clinicFrontDesk,
    usesImage: photos.practiceFrontOffice,
    underwriting: [
      { title: "Reimbursement timing", text: "Insurance claims can take weeks to pay out. We read deposits with that lag in mind." },
      { title: "Costly equipment", text: "Imaging, chairs and diagnostic tools are major purchases, and a broken one stops appointments until it's replaced." },
      { title: "Growth costs", text: "Adding a provider or a location needs capital before the revenue it brings." },
    ],
    uses: ["Medical and dental equipment", "Practice expansion and build-outs", "Hiring providers and staff", "Covering reimbursement gaps", "Technology and software upgrades"],
    products: ["merchant-cash-advances"],
    example: "A dental practice you work with is adding a second operatory. An advance covers the equipment within days, and remittances come from the patient revenue the new room brings in.",
  },
  {
    slug: "trucking",
    name: "Trucking & Transportation",
    audience: "trucking companies",
    heading: "Submitting trucking deals",
    intro: "Owner-operators and fleets, funded to keep trucks on the road.",
    image: photos.truckFleet,
    usesImage: photos.semiTruckHighway,
    underwriting: [
      { title: "Fuel and maintenance", text: "Costs hit every week, whether or not loads pay on time. We look at how deposits cover them." },
      { title: "Freight payment terms", text: "Shippers and freight brokers paying in 30 to 60 days make deposits uneven. We expect it." },
      { title: "Stacked positions", text: "Trucking files often carry several advances. Pre-approval reads the stack, and a consolidation can replace it." },
    ],
    uses: ["Repairs and maintenance", "Fuel and insurance costs", "Adding trucks or trailers", "Covering slow-paying loads", "Consolidating existing advances"],
    products: ["merchant-cash-advances", "consolidations"],
    example: "An owner-operator you work with needs a major engine repair. An advance has the truck back on the road within the week, instead of weeks of lost loads.",
  },
];

/** Groups shown on the Who We Fund hub, beyond the industries with their own pages. */
export const moreIndustries = [
  "Auto repair", "Beauty & salons", "Cleaning services", "Fitness & gyms", "HVAC & plumbing", "Landscaping",
  "Manufacturing", "Professional services", "Real estate services", "Staffing", "Wholesale & distribution", "E-commerce",
];

/** What we can't fund, shown so ISOs don't spend time submitting it. */
export const notFunded = ["Startups under six months old", "Personal or consumer use", "Non-profits"];
