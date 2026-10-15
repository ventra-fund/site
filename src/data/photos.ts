// Every content-page photo, with its alt text, in one place so data files and pages can share them.
// Rendered by src/components/page/Photo.astro. `position: "top"` keeps a tall photo's subject (a
// face, usually) in frame when the slot crops it to a wider shape.
import type { ImageMetadata } from "astro";

import advisorClientDesk from "@/assets/photos/advisor-client-desk.jpg";
import advisorMeeting from "@/assets/photos/advisor-meeting.jpg";
import advisorPhone from "@/assets/photos/advisor-phone.jpg";
import barista from "@/assets/photos/barista.jpg";
import brokerCall from "@/assets/photos/broker-call.jpg";
import chefPlating from "@/assets/photos/chef-plating.jpg";
import clinicFrontDesk from "@/assets/photos/clinic-front-desk.jpg";
import communityEvent from "@/assets/photos/community-event.jpg";
import constructionSite from "@/assets/photos/construction-site.jpg";
import contractorsPlans from "@/assets/photos/contractors-plans.jpg";
import crewBreak from "@/assets/photos/crew-break.jpg";
import deskLaptopNotes from "@/assets/photos/desk-laptop-notes.jpg";
import deskStatementsCoffee from "@/assets/photos/desk-statements-coffee.jpg";
import florist from "@/assets/photos/florist.jpg";
import formsAndLaptop from "@/assets/photos/forms-and-laptop.jpg";
import grocerStorefront from "@/assets/photos/grocer-storefront.jpg";
import headshot1 from "@/assets/photos/headshot-1.jpg";
import headshot2 from "@/assets/photos/headshot-2.jpg";
import headshot3 from "@/assets/photos/headshot-3.jpg";
import headshot4 from "@/assets/photos/headshot-4.jpg";
import headshot5 from "@/assets/photos/headshot-5.jpg";
import headshot6 from "@/assets/photos/headshot-6.jpg";
import leadersConversation from "@/assets/photos/leaders-conversation.jpg";
import mechanicWorkshop from "@/assets/photos/mechanic-workshop.jpg";
import openOfficeTeam from "@/assets/photos/open-office-team.jpg";
import ownerDeskPaperwork from "@/assets/photos/owner-desk-paperwork.jpg";
import ownerLaptopCelebrating from "@/assets/photos/owner-laptop-celebrating.jpg";
import ownerPhoneDesk from "@/assets/photos/owner-phone-desk.jpg";
import receiptsCalculator from "@/assets/photos/receipts-calculator.jpg";
import retailShelves from "@/assets/photos/retail-shelves.jpg";
import signingAtDesk from "@/assets/photos/signing-at-desk.jpg";
import stockroomTablet from "@/assets/photos/stockroom-tablet.jpg";
import teamMeeting from "@/assets/photos/team-meeting.jpg";
import teamWhiteboard from "@/assets/photos/team-whiteboard.jpg";
import warehouseOwner from "@/assets/photos/warehouse-owner.jpg";
import warehouseRacking from "@/assets/photos/warehouse-racking.jpg";

export interface Photo {
  src: ImageMetadata;
  alt: string;
  position?: "top";
}

export const photos = {
  advisorClientDesk: { src: advisorClientDesk, alt: "Advisor going over figures on a laptop with a client across the desk" },
  advisorMeeting: { src: advisorMeeting, alt: "Funding advisor talking with a business owner at a bright office table" },
  advisorPhone: { src: advisorPhone, alt: "Funding advisor on a call at her desk, reviewing an offer on screen" },
  barista: { src: barista, alt: "Café owner pouring steamed milk behind the counter" },
  brokerCall: { src: brokerCall, alt: "Broker on a call with a client in a high-rise office" },
  chefPlating: { src: chefPlating, alt: "Chef plating a dish in a busy restaurant kitchen", position: "top" },
  clinicFrontDesk: { src: clinicFrontDesk, alt: "Medical staff checking in a patient on a tablet at a clinic front desk" },
  communityEvent: { src: communityEvent, alt: "Team members talking with visitors at an outdoor community event" },
  constructionSite: { src: constructionSite, alt: "Construction crew at work on an active job site" },
  contractorsPlans: { src: contractorsPlans, alt: "Contractors reviewing plans pinned to a wall on a job site" },
  crewBreak: { src: crewBreak, alt: "Smiling work crew in high-visibility gear on a break" },
  deskLaptopNotes: { src: deskLaptopNotes, alt: "Business owner filling out paperwork beside a laptop" },
  deskStatementsCoffee: { src: deskStatementsCoffee, alt: "Organized desk with a laptop, notebooks, a spreadsheet and a coffee" },
  florist: { src: florist, alt: "Florist arranging fresh flowers in her shop" },
  formsAndLaptop: { src: formsAndLaptop, alt: "Hands marking up a printed offer next to a laptop" },
  grocerStorefront: { src: grocerStorefront, alt: "Grocer smiling outside his neighborhood shop" },
  // Headshots take their alt text from the person shown (leadership in company.ts).
  headshot1: { src: headshot1, alt: "", position: "top" },
  headshot2: { src: headshot2, alt: "" },
  headshot3: { src: headshot3, alt: "" },
  headshot4: { src: headshot4, alt: "" },
  headshot5: { src: headshot5, alt: "" },
  headshot6: { src: headshot6, alt: "", position: "top" },
  leadersConversation: { src: leadersConversation, alt: "Two leaders in conversation at a table" },
  mechanicWorkshop: { src: mechanicWorkshop, alt: "Mechanic working on a vehicle in his workshop" },
  openOfficeTeam: { src: openOfficeTeam, alt: "Team gathered around a whiteboard in a bright, open office" },
  ownerDeskPaperwork: { src: ownerDeskPaperwork, alt: "Business owner smiling at his desk while working through paperwork" },
  ownerLaptopCelebrating: { src: ownerLaptopCelebrating, alt: "Business owners celebrating news on a laptop at their counter" },
  ownerPhoneDesk: { src: ownerPhoneDesk, alt: "Business owner on a call at his desk with financial reports" },
  receiptsCalculator: { src: receiptsCalculator, alt: "Receipts and statements beside a calculator" },
  retailShelves: { src: retailShelves, alt: "Shop owner arranging stock on store shelves" },
  signingAtDesk: { src: signingAtDesk, alt: "Business owner signing a document at his desk" },
  stockroomTablet: { src: stockroomTablet, alt: "Staff checking stock levels on shelving with a tablet" },
  teamMeeting: { src: teamMeeting, alt: "Ventra Fund team in a meeting at the office" },
  teamWhiteboard: { src: teamWhiteboard, alt: "Team collaborating around a table in front of a whiteboard" },
  warehouseOwner: { src: warehouseOwner, alt: "Owner smiling in his stockroom beside a stack of boxes", position: "top" },
  warehouseRacking: { src: warehouseRacking, alt: "Loaded warehouse racking with a forklift in the aisle" },
} satisfies Record<string, Photo>;
