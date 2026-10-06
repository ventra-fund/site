import { MAX_LINE, MAX_NAME } from '@/lib/apply-schema';
import type { Suggestions } from '@/lib/upload-config';
import type { StatementExtraction } from './schema';

// Pure: turns the extractions of every statement an applicant uploaded into one set of
// suggested values for the apply form, plus a summary for the email. No network, no bindings.
//
// Mapping (see the field descriptions in schema.ts for what the provider is asked to read):
//   account holder, business  → legalBusinessName
//   account holder, person    → firstName + lastName (a sole proprietor's legal name)
//   account holder, unknown   → legalBusinessName (visible and editable; better than nothing)
//   mailing address           → businessAddress (the home address is never guessed)
//   avg. monthly deposits     → monthlyRevenue
// Statements disagreeing with each other (a personal and a business account, say) are settled
// by majority: the name/address printed on the most statements wins.

/** The form suggestions the browser gets, plus what the email summary wants. */
export interface AutofillSuggestions extends Suggestions {
  /** As printed, for the email summary. */
  accountHolder?: string;
  bankName?: string;
}

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;
const BUSINESS_HINT =
  /\b(l\.?l\.?c\.?|inc\.?|corp\.?|corporation|co\.?|company|ltd\.?|limited|l\.?l\.?p\.?|l\.?p\.?|p\.?l\.?l\.?c\.?|p\.?c\.?|d\/?b\/?a|enterprises?|group|holdings?|services?|solutions?|associates|partners|construction|trust|industries|logistics|consulting|studio|restaurant|cafe|market|clinic|dental|medical|auto|trucking|farms?)\b/i;
// Kept upper-case when the rest of an all-caps name is title-cased: entity suffixes, plus any
// short token that isn't an ordinary word, since a 2–3 letter run of capitals in a business
// name is nearly always initials ("QMB Radiology LLC", "JR Trucking") rather than a word.
const KEEP_UPPER = new Set(['LLC', 'INC', 'LLP', 'LP', 'PLLC', 'PC', 'DBA', 'USA', 'II', 'III', 'IV']);
const SHORT_WORDS = new Set(['THE', 'AND', 'OF', 'FOR', 'ON', 'AT', 'IN', 'BY', 'TO', 'A', 'AN', 'CO', 'MY', 'ALL', 'ONE', 'NEW', 'BIG', 'TOP', 'OLD', 'RED', 'SUN', 'SEA', 'AIR', 'CAR', 'PRO', 'MED', 'LAW', 'TAX', 'ART', 'BAR', 'SPA', 'GYM', 'HUB', 'LAB', 'PET', 'TOY', 'BOX', 'CUT', 'FIT', 'FIX', 'KEY', 'NET', 'WEB']);
const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv']);

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim();
const norm = (s: string) => collapse(s).toLowerCase();

/** The most frequently printed non-empty value; ties go to the first statement's. */
function majority(values: (string | null | undefined)[]): string | undefined {
  const counts = new Map<string, { original: string; count: number }>();
  for (const v of values) {
    if (!v || !collapse(v)) continue;
    const key = norm(v);
    const entry = counts.get(key);
    if (entry) entry.count++;
    else counts.set(key, { original: collapse(v), count: 1 });
  }
  let best: { original: string; count: number } | undefined;
  for (const entry of counts.values()) if (!best || entry.count > best.count) best = entry;
  return best?.original;
}

/**
 * Statements print names in capitals. Title-case an all-caps string (leaving one that already
 * has lower-case letters alone), keeping entity suffixes like LLC upper-case.
 */
function smartCase(s: string): string {
  if (/[a-z]/.test(s)) return s;
  return s
    .split(' ')
    .map((word) => {
      const bare = word.replace(/[^A-Z]/g, '');
      if (KEEP_UPPER.has(bare)) return word;
      if (bare.length >= 2 && bare.length <= 3 && bare === word && !SHORT_WORDS.has(bare)) return word;
      return word.toLowerCase().replace(/(^|[-'’])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
    })
    .join(' ');
}

/** Split a printed personal name into first and last; undefined when it isn't clearly two parts. */
function splitPersonName(raw: string): { first: string; last: string } | undefined {
  const s = collapse(raw);
  if (s.includes(',')) {
    // "LAST, FIRST M" (some banks print surname first).
    const [last, rest] = s.split(',', 2).map(collapse);
    const first = rest.split(' ')[0] ?? '';
    if (!first || !last) return undefined;
    return { first: smartCase(first), last: smartCase(last) };
  }
  const tokens = s.split(' ').filter((t) => !NAME_SUFFIXES.has(t.replace(/\./g, '').toLowerCase()));
  if (tokens.length < 2) return undefined;
  return { first: smartCase(tokens[0]), last: smartCase(tokens[tokens.length - 1]) };
}

/** The distinct, well-formed 'YYYY-MM' months one extraction covers, sorted. */
export const monthsOf = (e: StatementExtraction) => [...new Set(e.months.map((m) => m.month?.trim() ?? '').filter((k) => MONTH_KEY.test(k)))].sort();

export function buildSuggestions(extractions: StatementExtraction[]): AutofillSuggestions {
  const fields: AutofillSuggestions['fields'] = {};
  const suggestions: AutofillSuggestions = { fields, monthsCovered: [] };
  if (!extractions.length) return suggestions;

  // Name → business name, or first/last for a person.
  const holder = majority(extractions.map((e) => e.accountHolderName));
  if (holder) {
    suggestions.accountHolder = holder;
    const kinds = extractions.filter((e) => norm(e.accountHolderName ?? '') === norm(holder)).map((e) => e.accountHolderKind);
    const votes = { business: 0, person: 0 };
    for (const k of kinds) if (k === 'business' || k === 'person') votes[k]++;
    let kind: 'business' | 'person' | 'unknown' = votes.business > votes.person ? 'business' : votes.person > votes.business ? 'person' : 'unknown';
    if (kind === 'unknown' && BUSINESS_HINT.test(holder)) kind = 'business';

    const person = kind === 'person' ? splitPersonName(holder) : undefined;
    if (person) {
      fields.firstName = person.first.slice(0, MAX_NAME);
      fields.lastName = person.last.slice(0, MAX_NAME);
    } else {
      fields.legalBusinessName = smartCase(holder).slice(0, MAX_LINE);
    }
  }

  // Address → business address. Left as printed (capitals and all): title-casing an address
  // would mangle state codes, and the visitor can see exactly what the statement says.
  const address = majority(extractions.map((e) => e.mailingAddress));
  if (address) fields.businessAddress = address.slice(0, MAX_LINE);

  suggestions.bankName = majority(extractions.map((e) => e.bankName));

  // Revenue → mean of the monthly deposit totals across every distinct month. Two statements
  // covering the same month (a re-upload, or overlapping periods) count once: the later wins.
  const byMonth = new Map<string, number | null>();
  for (const e of extractions) {
    for (const m of e.months) {
      const key = m.month?.trim() ?? '';
      if (!MONTH_KEY.test(key)) continue;
      const deposits = typeof m.totalDeposits === 'number' && Number.isFinite(m.totalDeposits) && m.totalDeposits >= 0 ? m.totalDeposits : null;
      byMonth.set(key, deposits);
    }
  }
  suggestions.monthsCovered = [...byMonth.keys()].sort();
  const totals = [...byMonth.values()].filter((d): d is number => d != null);
  if (totals.length) {
    const average = Math.round(totals.reduce((sum, d) => sum + d, 0) / totals.length);
    suggestions.averageMonthlyDeposits = average;
    fields.monthlyRevenue = average;
  }

  return suggestions;
}
