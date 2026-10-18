// Every content-page photo, with its alt text, in one place so data files and pages can share them.
// Rendered by src/components/page/Photo.astro. `position: "top"` keeps a tall photo's subject (a
// face, usually) in frame when the slot crops it to a wider shape.
import type { ImageMetadata } from "astro";

import advisorClientDesk from "@/assets/photos/advisor-client-desk.jpg";
import advisorMeeting from "@/assets/photos/advisor-meeting.jpg";
import barista from "@/assets/photos/barista.jpg";
import boutiqueOwner from "@/assets/photos/boutique-owner.jpg";
import brokerCall from "@/assets/photos/broker-call.jpg";
import chefPlating from "@/assets/photos/chef-plating.jpg";
import clinicFrontDesk from "@/assets/photos/clinic-front-desk.jpg";
import communityEvent from "@/assets/photos/community-event.jpg";
import consolidation from "@/assets/photos/consolidation.jpeg";
import constructionSite from "@/assets/photos/construction-site.jpg";
import contractorsPlans from "@/assets/photos/contractors-plans.jpg";
import deskLaptopNotes from "@/assets/photos/desk-laptop-notes.jpg";
import excavatorCrew from "@/assets/photos/excavator-crew.jpg";
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
import newCafeInterior from "@/assets/photos/new-cafe-interior.jpg";
import ownerLaptopCelebrating from "@/assets/photos/owner-laptop-celebrating.jpg";
import ownerReviewingStatements from "@/assets/photos/owner-reviewing-statements.jpg";
import practiceFrontOffice from "@/assets/photos/practice-front-office.jpg";
import receiptsCalculator from "@/assets/photos/receipts-calculator.jpg";
import requirementsChecklist from "@/assets/media/requirements.jpg";
import restaurantServer from "@/assets/photos/restaurant-server.jpg";
import retailShelves from "@/assets/photos/retail-shelves.jpg";
import semiTruckHighway from "@/assets/photos/semi-truck-highway.jpg";
import signingAtDesk from "@/assets/photos/signing-at-desk.jpg";
import stockroomTablet from "@/assets/photos/stockroom-tablet.jpg";
import teamMeeting from "@/assets/photos/team-meeting.jpg";
import teamWhiteboard from "@/assets/photos/team-whiteboard.jpg";
import truckFleet from "@/assets/photos/truck-fleet.jpg";
import warehouseOwner from "@/assets/photos/warehouse-owner.jpg";
import woman1 from "@/assets/photos/w-1.jpeg";
import woman2 from "@/assets/photos/w-2.jpeg";

export interface Photo {
  src: ImageMetadata;
  alt: string;
  position?: "top";
}

export const photos = {
  advisorClientDesk: { src: advisorClientDesk, alt: "Advisor going over figures on a laptop with a client across the desk" },
  advisorMeeting: { src: advisorMeeting, alt: "Funding advisor talking with a business owner at a bright office table" },
  barista: { src: barista, alt: "Café owner pouring steamed milk behind the counter" },
  boutiqueOwner: { src: boutiqueOwner, alt: "Boutique owner holding a tablet among the clothing racks in her shop" },
  brokerCall: { src: brokerCall, alt: "Broker on a call with a client in a high-rise office" },
  chefPlating: { src: chefPlating, alt: "Chef plating a dish in a busy restaurant kitchen", position: "top" },
  clinicFrontDesk: { src: clinicFrontDesk, alt: "Medical staff checking in a patient on a tablet at a clinic front desk" },
  communityEvent: { src: communityEvent, alt: "Team members talking with visitors at an outdoor community event" },
  consolidation: { src: consolidation, alt: "Hand underlining the word consolidation with a marker" },
  constructionSite: { src: constructionSite, alt: "Construction crew at work on an active job site" },
  contractorsPlans: { src: contractorsPlans, alt: "Contractors reviewing plans pinned to a wall on a job site" },
  deskLaptopNotes: { src: deskLaptopNotes, alt: "Business owner filling out paperwork beside a laptop" },
  excavatorCrew: { src: excavatorCrew, alt: "Construction crew working beside an excavator and concrete pump on a job site" },
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
  newCafeInterior: { src: newCafeInterior, alt: "Newly finished café dining room with pendant lights over the tables" },
  ownerLaptopCelebrating: { src: ownerLaptopCelebrating, alt: "Business owners celebrating news on a laptop at their counter" },
  ownerReviewingStatements: { src: ownerReviewingStatements, alt: "Business owner going through financial statements at his desk beside a laptop" },
  practiceFrontOffice: { src: practiceFrontOffice, alt: "Practice coordinator on a call at a medical office front desk" },
  receiptsCalculator: { src: receiptsCalculator, alt: "Receipts and statements beside a calculator" },
  requirementsChecklist: { src: requirementsChecklist, alt: "Hand ticking off boxes on a checklist" },
  restaurantServer: { src: restaurantServer, alt: "Restaurant server smiling as he carries a dish out to a table" },
  retailShelves: { src: retailShelves, alt: "Shop owner arranging stock on store shelves" },
  semiTruckHighway: { src: semiTruckHighway, alt: "Semi truck hauling a load down a two-lane highway" },
  signingAtDesk: { src: signingAtDesk, alt: "Business owner signing a document at his desk" },
  stockroomTablet: { src: stockroomTablet, alt: "Staff checking stock levels on shelving with a tablet" },
  teamMeeting: { src: teamMeeting, alt: "Ventra Fund team in a meeting at the office" },
  teamWhiteboard: { src: teamWhiteboard, alt: "Team collaborating around a table in front of a whiteboard" },
  truckFleet: { src: truckFleet, alt: "Row of green semi trucks parked at a fleet yard" },
  warehouseOwner: { src: warehouseOwner, alt: "Owner smiling in his stockroom beside a stack of boxes", position: "top" },
  // Headshots for leadership (alt text comes from the person shown in company.ts).
  woman1: { src: woman1, alt: "", position: "top" },
  woman2: { src: woman2, alt: "" },
} satisfies Record<string, Photo>;
