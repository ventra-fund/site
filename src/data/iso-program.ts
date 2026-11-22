// The ISO program's terms, in one place: the home page, the Why us pages, the FAQ and the footer all
// read them from here, so a change shows up everywhere at once.
//
// Starting point: Main Capital's ISO program (the sister site). Confirm each figure for Ventra Fund
// before launch; the stips list in particular is a placeholder.

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

const DAY_NAMES: Record<Day, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export const isoProgram = {
  /** Days commission runs. */
  commissionDays: ["Mon", "Wed"] as Day[],
  /** Days an underwriter is on the phone, and the hours (Eastern). */
  underwriterDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as Day[],
  underwriterHours: { open: "9:30am", close: "6pm", short: "9:30–6" },
  /** Share of the balance paid in when a merchant can renew; the renewal is credited to the ISO. */
  renewAtPercent: 40,
  /** Funded volume that earns the bonus. There is no volume minimum. */
  bonusAt: "$100k",
  /** Most points an ISO can add to a deal. */
  maxPoints: 12,
  /** The statuses an ISO sees a deal move through. */
  dealSteps: ["Received", "Approved", "Contract sent", "Signed", "Funded"],
  /** What a submission needs. Placeholder list: confirm the real stips. */
  stips: [
    "Signed application",
    "Last 3 months of business bank statements, plus month-to-date",
    "Driver's license for each owner",
    "Voided business check",
  ],
};

/** "Monday and Wednesday", "Monday to Saturday": a run of consecutive days reads as a range. */
export function dayList(days: Day[]): string {
  const names = days.map((d) => DAY_NAMES[d]);
  const indexes = days.map((d) => DAYS.indexOf(d));
  const consecutive = indexes.every((n, i) => i === 0 || n === indexes[i - 1] + 1);
  if (days.length > 2 && consecutive) return `${names[0]} to ${names[names.length - 1]}`;
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "Mon & Wed": the short form for stat headings. */
export const shortDays = (days: Day[]) =>
  days.length > 2 ? `${days[0]}–${days[days.length - 1]}` : days.join(" & ");

/** "9:30am to 6pm, Monday to Saturday" */
export const underwriterAvailability = `${isoProgram.underwriterHours.open} to ${isoProgram.underwriterHours.close}, ${dayList(isoProgram.underwriterDays)}`;
