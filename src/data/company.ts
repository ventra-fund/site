// Company facts for the About, Leadership and Careers pages.
import { photos, type Photo } from "@/data/photos";

export const companyFacts = {
  businessesFunded: "3,200+",
  totalFunded: "$475M+",
};

export const values: { title: string; text: string }[] = [
  { title: "The broker comes first", text: "Every deal we fund comes from an ISO, and the merchant stays theirs." },
  { title: "Say it plainly", text: "Every decline comes with the reason, and every contract shows the full cost in dollars." },
  { title: "Move fast, carefully", text: "Speed matters to brokers and merchants, but never at the cost of getting the fit right." },
  { title: "Pick up the phone", text: "An underwriter you can talk to beats a status page you have to refresh." },
];

export interface Leader {
  name: string;
  title: string;
  photo: Photo;
  quote?: string;
  linkedin?: string;
}

export const leadership: Leader[] = [
  { name: "Daniel Reyes", title: "Chief Executive Officer", photo: photos.headshot1, quote: "We built a funder that only works through brokers, so we never have a reason to go around one." },
  { name: "James Okafor", title: "Chief Operating Officer", photo: photos.headshot2, quote: "Every process we build starts with one question: does this get the broker an answer faster?" },
  { name: "Katherine Boyle", title: "Head of Partnerships", photo: photos.woman1, quote: "ISOs trust us with their merchants, and we treat every deal like it carries their name, because it does." },
  { name: "Adrian Cho", title: "Chief Technology Officer", photo: photos.headshot4, quote: "Technology should clear away the paperwork, not the people you call." },
  { name: "Tom Bridger", title: "Chief Financial Officer", photo: photos.headshot5, quote: "We size every deal to what the merchant can actually carry. That's what makes renewals possible." },
  { name: "Lena Vasquez", title: "Head of Risk", photo: photos.woman2, quote: "A decline without a reason helps no one. Brokers get ours, every time." },
];

export const careerBenefits: { title: string; text: string }[] = [
  { title: "Health coverage", text: "100% of medical, dental and vision premiums for employees." },
  { title: "Retirement", text: "401(k) with a 4% company match." },
  { title: "Time off", text: "20 days of PTO plus 10 paid holidays." },
  { title: "Growth", text: "Mentorship, skills assessments and a clear path to your next role." },
  { title: "Flexibility", text: "Hybrid schedule: three days in the office, two remote." },
  { title: "Community", text: "Volunteer days and local small business events." },
];
