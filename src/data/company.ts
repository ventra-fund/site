// Company facts for the About, Leadership and Careers pages.
// TODO: every value in brackets or written as X is a placeholder. Replace it with the real figure
// before launch; don't publish invented numbers or people.

export const companyFacts = {
  founded: "[Year]",
  headquarters: "[City, State]",
  businessesFunded: "X,XXX+",
  totalFunded: "$XXM+",
  industriesServed: "XXX+",
  fundingRange: "$5,000 to $5M",
};

export const atAGlance: { label: string; value: string }[] = [
  { label: "Founded", value: companyFacts.founded },
  { label: "Headquarters", value: companyFacts.headquarters },
  { label: "Total funded", value: companyFacts.totalFunded },
  { label: "Funding range", value: companyFacts.fundingRange },
  { label: "Businesses funded", value: companyFacts.businessesFunded },
  { label: "Recognition", value: "[Awards or ratings, e.g. BBB rating]" },
];

export const values: { title: string; text: string }[] = [
  { title: "Say it plainly", text: "Every offer shows the full cost up front, in plain language, with no surprises at signing." },
  { title: "Move fast, carefully", text: "Speed matters to owners, but never at the cost of getting the fit right." },
  { title: "Own the outcome", text: "We act like the business is ours: accountable, practical and in it for the long run." },
  { title: "Do right by owners", text: "If another product or another lender is a better fit, we'll tell you." },
];

export interface Leader {
  name: string;
  title: string;
  quote?: string;
  linkedin?: string;
}

export const leadership: Leader[] = [
  { name: "[Full name]", title: "Chief Executive Officer", quote: "[A sentence on why Ventra Fund exists.]" },
  { name: "[Full name]", title: "Chief Operating Officer", quote: "[A sentence on how we serve customers.]" },
  { name: "[Full name]", title: "Chief Financial Officer", quote: "[A sentence on responsible underwriting.]" },
  { name: "[Full name]", title: "Chief Technology Officer", quote: "[A sentence on technology and speed.]" },
  { name: "[Full name]", title: "Head of Sales & Partnerships" },
  { name: "[Full name]", title: "Head of Risk" },
];

export const careerBenefits: { title: string; text: string }[] = [
  { title: "Health coverage", text: "[Medical, dental and vision details]" },
  { title: "Retirement", text: "[401(k) and matching details]" },
  { title: "Time off", text: "[PTO and holiday policy]" },
  { title: "Growth", text: "Mentorship, skills assessments and a clear path to your next role." },
  { title: "Flexibility", text: "[Hybrid or remote policy]" },
  { title: "Community", text: "Volunteer days and local small business events." },
];
