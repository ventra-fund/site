// Company facts for the About, Leadership and Careers pages.
import { photos, type Photo } from "@/data/photos";

export const companyFacts = {
  businessesFunded: "3,200+",
  totalFunded: "$475M+",
};

export const values: { title: string; text: string }[] = [
  { title: "Say it plainly", text: "Every offer shows the full cost up front, in plain language, with no surprises at signing." },
  { title: "Move fast, carefully", text: "Speed matters to owners, but never at the cost of getting the fit right." },
  { title: "Own the outcome", text: "We act like the business is ours: accountable, practical and in it for the long run." },
  { title: "Do right by owners", text: "If another product or another lender is a better fit, we'll tell you." },
];

export interface Leader {
  name: string;
  title: string;
  photo: Photo;
  quote?: string;
  linkedin?: string;
}

export const leadership: Leader[] = [
  { name: "Daniel Reyes", title: "Chief Executive Officer", photo: photos.headshot1, quote: "Owners shouldn't have to wait weeks for an answer on capital they need this week." },
  { name: "James Okafor", title: "Chief Operating Officer", photo: photos.headshot2, quote: "Every process we build starts with one question: does this make it easier for the owner?" },
  { name: "Katherine Boyle", title: "Head of Sales & Partnerships", photo: photos.woman1, quote: "Our partners trust us with their clients, and we treat every deal like it carries our own name." },
  { name: "Adrian Cho", title: "Chief Technology Officer", photo: photos.headshot4, quote: "Technology should clear away the paperwork, not the people you call." },
  { name: "Tom Bridger", title: "Chief Financial Officer", photo: photos.headshot5, quote: "We size every offer to what the business can actually carry." },
  { name: "Lena Vasquez", title: "Head of Risk", photo: photos.woman2, quote: "Clear numbers and honest terms protect the owner as much as they protect us." },
];

export const careerBenefits: { title: string; text: string }[] = [
  { title: "Health coverage", text: "100% of medical, dental and vision premiums for employees." },
  { title: "Retirement", text: "401(k) with a 4% company match." },
  { title: "Time off", text: "20 days of PTO plus 10 paid holidays." },
  { title: "Growth", text: "Mentorship, skills assessments and a clear path to your next role." },
  { title: "Flexibility", text: "Hybrid schedule: three days in the office, two remote." },
  { title: "Community", text: "Volunteer days and local small business events." },
];
