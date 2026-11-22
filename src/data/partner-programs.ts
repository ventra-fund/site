// Partner programs, each with a page at /partners/<slug>. The onboarding form itself lives at /partner.
// ISO-only: there is no referral program, because a referral partner hands the merchant to us directly,
// and we don't go direct-to-merchant.
import { photos, type Photo } from "@/data/photos";
import { dayList, isoProgram, underwriterAvailability } from "@/data/iso-program";

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
    name: "ISO Partner Program",
    heading: "A funder that works only through you",
    intro: "Independent sales organizations and brokers send us their B and C paper because we decide fast, explain every decline and never go around them to the merchant.",
    image: photos.brokerCall,
    whoFor: [
      "Independent sales organizations (ISOs)",
      "Commercial finance brokers",
      "Shops placing B and C paper, first positions and beyond",
      "Brokers tired of funders who go quiet on a file",
    ],
    benefits: [
      { title: "Your merchant stays yours", text: "Funded or declined, we never market to your merchant or contact them on our own. The only call they get is the verification call, made in your name." },
      { title: "Reasons, not silence", text: "Every decline comes with the reason, and you can push back if we got something wrong." },
      { title: "Commission twice a week", text: `Commission runs every ${dayList(isoProgram.commissionDays)}, with up to ${isoProgram.maxPoints} points on every deal.` },
      { title: "Renewals credited to you", text: `Merchants can renew at ${isoProgram.renewAtPercent}% paid in, at the same commission as the first funding.` },
      { title: "Live underwriters", text: `Talk to the person underwriting your file, ${underwriterAvailability}.` },
      { title: "No volume minimum", text: `Send one deal a month or fifty. A bonus once you reach ${isoProgram.bonusAt} funded.` },
    ],
    steps: [
      { title: "Onboard", text: "Fill in the short form and take a call with your relationship manager." },
      { title: "Submit deals", text: `Send the file with ${isoProgram.stips.length} stips. Automated pre-approval checks come back fast.` },
      { title: "Track every step", text: `${isoProgram.dealSteps.join(", ")}: you hear from us at each one.` },
      { title: "Get paid", text: `Commission runs every ${dayList(isoProgram.commissionDays)} on funded deals, and again on every renewal.` },
    ],
  },
];
