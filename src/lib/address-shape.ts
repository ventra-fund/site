// Whether a hand-typed US address has every part of a full one: a street (or box) number, a street
// name, a city, a state and a ZIP. This is what lets through an address the suggestion provider
// doesn't know (new construction, rural routes) while still refusing a shorthand like "WTC7". It
// reads the shape only; nothing checks that the address exists.
//
// People type the parts in many ways, so the check goes by what is present, not by punctuation:
//   123 Main St, Dallas, TX 75201          the usual way
//   123 main st dallas tx 75201            no commas, any capitalisation
//   123 Main St Apt 4, Dallas, Texas 75201-1234   state spelled out, ZIP+4, a unit
//   123 Main St, Dallas, 75201 TX          ZIP before the state
//   123 Main St, 75201, Dallas TX          ZIP in the middle
//   PO Box 12, Marfa, TX 79843 / RR 2 Box 15, Circle, MT 59215   boxes and rural routes
//
// The one ambiguity is the state: many two-letter codes are also words that appear in streets
// (CT court, NE northeast, IN, OR, ME). So a state only counts where a state is written: right
// next to the ZIP, or closing the address or one of its comma-separated parts after the street.

const STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  PR: 'Puerto Rico', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
  UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// Longest first, so "West Virginia" is tried before "Virginia". Codes may be written "N.Y.".
const STATE = [
  ...Object.values(STATES).sort((a, b) => b.length - a.length).map((name) => name.replace(/ /g, '\\s+')),
  ...Object.keys(STATES).map((code) => `${code[0]}\\.?${code[1]}\\.?`),
].join('|');

const ZIP = '\\d{5}(?:-\\d{4})?';
// Next to the ZIP, on either side, with at most a comma between: "TX 75201", "Texas, 75201", "75201 TX".
const STATE_THEN_ZIP = new RegExp(`(?<![\\w.])(?:${STATE})[\\s,]+${ZIP}(?!\\w)`, 'i');
const ZIP_THEN_STATE = new RegExp(`(?<!\\w)${ZIP}[\\s,]+(?:${STATE})(?![\\w.])`, 'i');
// Closing the address or a comma-separated part of it: "…, Dallas TX" / "…, Dallas, TX, 75201".
const STATE_ENDING_PART = new RegExp(`(?<=[\\s,])(?:${STATE})\\s*(?=,|$)`, 'i');
const ZIP_ANYWHERE = new RegExp(`(?<!\\w)${ZIP}(?!\\w)`, 'g');

export type AddressPart = 'street number' | 'street name' | 'city' | 'state' | 'ZIP code';

/**
 * The parts a full address needs that `text` doesn't have, in the order they are written; empty
 * when it reads as number + street, city, state and ZIP, in whatever order and style.
 */
export function missingAddressParts(text: string): AddressPart[] {
  const address = text.trim().replace(/\s+/g, ' ');
  let hasState = false;
  let hasZip = false;
  let rest = address;
  const cut = (from: string, index: number, length: number) => from.slice(0, index) + ' ' + from.slice(index + length);

  // State and ZIP together, the way they are nearly always written.
  for (const pattern of [STATE_THEN_ZIP, ZIP_THEN_STATE]) {
    const match = pattern.exec(address);
    // At the very start it is "75201 Texas Ave": a house number and a street, not a ZIP and state.
    if (!match || match.index === 0) continue;
    hasState = hasZip = true;
    rest = cut(address, match.index, match[0].length);
    break;
  }

  // Or apart, or only one of them: the last ZIP-like number that isn't the house number, and a
  // state closing the address or a later part of it.
  if (!hasState) {
    const zip = [...address.matchAll(ZIP_ANYWHERE)].filter((m) => m.index > 0).at(-1);
    if (zip) { hasZip = true; rest = cut(address, zip.index, zip[0].length); }
    const firstComma = rest.indexOf(',');
    // Without commas only the very end can be the state; with them, any part after the street.
    const from = firstComma < 0 ? 0 : firstComma;
    const state = STATE_ENDING_PART.exec(rest.slice(from).trimEnd());
    if (state && from + state.index > 0) { hasState = true; rest = cut(rest, from + state.index, state[0].length); }
  }

  // What is left is the street and the city: a number (house, box or route) and at least two
  // words, one for the street and one for the city. With a single word there is no telling which
  // it is: next to a number it is taken for the street, on its own for the city.
  const hasNumber = /\d/.test(rest);
  const words = (rest.match(/[A-Za-z][A-Za-z'.-]*/g) ?? []).length;
  const missing: AddressPart[] = [];
  if (!hasNumber) missing.push('street number');
  if (words === 0 || (words === 1 && !hasNumber)) missing.push('street name');
  if (words === 0 || (words === 1 && hasNumber)) missing.push('city');
  if (!hasState) missing.push('state');
  if (!hasZip) missing.push('ZIP code');
  return missing;
}

/** True when `text` has every part of a full address. */
export const isFullAddress = (text: string) => missingAddressParts(text).length === 0;
