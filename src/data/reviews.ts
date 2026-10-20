// Customer reviews shown on the home page carousel, the Reviews page and Why Us.
// Placeholder content (see the home page note); swap for real, verified reviews before launch.

export interface Review {
  rating: number;
  name: string;
  when: string;
  title: string;
  body: string;
}

export const reviewSummary = { rating: 4.9, count: 128, label: "Excellent" };

export const reviews: Review[] = [
  { rating: 5, name: "Sandra K.", when: "2 days ago", title: "Applied Monday, funded Wednesday", body: "Had a big payroll week and an old tax bill land at the same time. Ventra covered both without the endless paperwork I expected. Now I just pay a fixed amount each week and it's easy to plan around." },
  { rating: 5, name: "Marcus T.", when: "5 days ago", title: "Finally a lender that answers the phone", body: "Every other company kept us waiting for weeks or called back to resell us. The rep explained the flat fee upfront and helped schedule payments around our slower months." },
  { rating: 4, name: "Priya S.", when: "6 days ago", title: "Good rates, honest terms", body: "Funding cleared quickly for our inventory order and the weekly repayments are easy to budget. Took a day longer to hit our account than promised, but the true cost was clear from day one." },
  { rating: 5, name: "Dan & Lyn M.", when: "1 week ago", title: "Kept our bakery running through summer", body: "Our delivery van gave out right before our busiest season. Ventra approved us in 24 hours and we had a replacement on the road the next week. Can't recommend them enough." },
  { rating: 4, name: "Renee C.", when: "2 weeks ago", title: "Rescued a late-paying client's contract", body: "A client paid late and we nearly missed payroll. The application took ten minutes and the decision came back the same day. Only downer is the fixed weekly payment day was a bit of a squeeze." },
];
