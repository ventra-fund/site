// Partner programs, each with a page at /partners/<slug>. The inquiry form itself lives at /partner.
import { photos, type Photo } from "@/data/photos";

export interface PartnerProgram {
  slug: string;
  name: string;
  heading: string;
  intro: string;
  image: Photo;
  whoFor: string[];
  benefits: { title: string; text: string }[];
  steps: { title: string; text: string }[];
}

export const partnerPrograms: PartnerProgram[] = [
  {
    slug: "brokers",
    name: "Broker & ISO Partners",
    heading: "A funding partner your clients can count on",
    intro: "Independent sales organizations and brokers send us deals because we decide quickly, communicate clearly and pay commissions on time.",
    image: photos.brokerCall,
    whoFor: ["Independent sales organizations (ISOs)", "Commercial finance brokers", "Loan advisors and consultants"],
    benefits: [
      { title: "Fast decisions", text: "Most submissions get a decision within a day, so you can keep your clients moving." },
      { title: "Competitive commissions", text: "Transparent compensation, paid promptly on funded deals." },
      { title: "A dedicated contact", text: "One relationship manager who knows your book and answers the phone." },
      { title: "Range of products", text: "Advances, term loans, lines, consolidations and cash credit under one roof." },
    ],
    steps: [
      { title: "Apply to partner", text: "Tell us about your business and the clients you serve." },
      { title: "Get set up", text: "Sign the partner agreement and meet your relationship manager." },
      { title: "Submit deals", text: "Send applications and track them from submission to funding." },
      { title: "Get paid", text: "Commissions are paid as your deals fund." },
    ],
  },
  {
    slug: "referral",
    name: "Referral Partners",
    heading: "Refer a business owner, help them grow",
    intro: "Accountants, bookkeepers, consultants and vendors refer clients to us when they need capital. We take it from there and keep you in the loop.",
    image: photos.advisorClientDesk,
    whoFor: ["Accountants and bookkeepers", "Business consultants", "Equipment and software vendors", "Industry associations"],
    benefits: [
      { title: "Help your clients", text: "Give owners a trusted option when they need working capital." },
      { title: "Referral fees", text: "Earn a fee on referrals that fund. [Confirm program terms.]" },
      { title: "No selling required", text: "Make the introduction; our advisors handle the rest." },
      { title: "Status updates", text: "Know where every referral stands." },
    ],
    steps: [
      { title: "Join the program", text: "A short form and a quick call to get to know each other." },
      { title: "Make an introduction", text: "Share a referral link or connect us directly." },
      { title: "We take care of it", text: "An advisor works with your client from application to funding." },
      { title: "Get rewarded", text: "Receive your referral fee when the deal funds." },
    ],
  },
];
