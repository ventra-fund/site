// Open positions, shown as an accordion on /careers. Empty the list and the page shows its
// "no openings" state. Applications come in by email, to the address behind the reveal on the page.

export interface Opening {
  title: string;
  team: string;
  /** The one fact shown after the team on the closed row: pay type, place and the like. */
  highlight: string;
  intro: string;
  /** The description, shown when the row is opened: each heading with its paragraphs. */
  sections: { title: string; text: string[] }[];
  /** What to include in the application, shown under "How to apply" above the email reveal. */
  apply: string;
}

export const openings: Opening[] = [
  {
    title: "Sales Representative",
    team: "Sales",
    highlight: "Commission-only, in person",
    intro: "Be the day-to-day contact for the brokers who send us deals, and bring new brokers on board. No lending background required.",
    sections: [
      {
        title: "What you'll do",
        text: ["You'll work with brokers every day, keeping them updated on the status of their deals. You'll also build relationships with new brokers, who bring in deal flow."],
      },
      {
        title: "Who it's for",
        text: ["Anyone who communicates clearly and follows through. No experience is required, though past sales or finance experience is preferred and knowledge of small business (SMB) lending is a plus."],
      },
      {
        title: "Pay",
        text: ["Commission-only, with no base salary."],
      },
      {
        title: "Location",
        text: ["In person in Greenwich or Darien, Connecticut, or Bedford, New York."],
      },
    ],
    apply: "Tell us a little about yourself and any sales or finance experience you have.",
  },
  {
    title: "Software Engineering Intern",
    team: "Engineering",
    highlight: "NYC metro area, remote available",
    intro: "Build and ship the software behind Ventra Fund. You're only a fit if you've deployed software before.",
    sections: [
      {
        title: "What you'll do",
        text: ["You'll build and ship features across our website, funding application and internal tools. You own your work from first commit to production, including what breaks after, and you solve problems worth solving without waiting to be asked."],
      },
      {
        title: "Who it's for",
        text: ["You have high agency: you figure things out and finish what you start. You can point to something you've deployed, whether a site, app, tool or service. No degree or formal education is needed."],
      },
      {
        title: "Pay",
        text: ["New York State minimum wage."],
      },
      {
        title: "Location",
        text: ["Remote is available, though onboarding includes hybrid sessions for the first two weeks. Connecticut or Westchester County residents are preferred; otherwise you must live in the New York City metro area."],
      },
    ],
    apply: "Include a link to something you've deployed.",
  },
];
