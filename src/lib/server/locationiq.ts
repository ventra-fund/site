import { ADDRESS_SUGGESTION_LIMIT, type AddressSuggestion } from '@/lib/address-config';

// Address suggestions from LocationIQ's autocomplete API (OpenStreetMap-based, US only here). One
// call returns each match with its parts, so there is no second "details" lookup. The suggestions
// are a convenience: every failure comes back as `degraded` and never throws, and the address
// field carries on as plain text. What was typed is never logged, only how the call went.

const AUTOCOMPLETE_URL = 'https://api.locationiq.com/v1/autocomplete';
/** The visitor is typing; a slow answer is worth less than none. (Typical answers take ~0.1 s.) */
const TIMEOUT_MS = 2500;
/** After a refused key or a spent daily quota, how long this isolate stops asking. */
const LONG_PAUSE_MS = 10 * 60 * 1000;
/** After the per-minute cap is hit. The per-second cap (2 on the free plan) clears by itself. */
const SHORT_PAUSE_MS = 30 * 1000;

/**
 * Half the side of the box drawn around the visitor, in degrees: about 70 miles north to south.
 * Matches inside it are listed first; an address typed for anywhere else is still found.
 */
const NEARBY_DEGREES = 1;

let pausedUntil = 0;

interface LocationIqResult {
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state_code?: string;
    postcode?: string;
  };
}

export type SuggestResult = { suggestions: AddressSuggestion[] } | { degraded: true };

/** `near` is the visitor's rough position (Cloudflare's, from their IP): nearby matches rank first. */
export async function suggestAddresses(tag: string, apiKey: string, query: string, near?: { latitude: number; longitude: number }): Promise<SuggestResult> {
  if (Date.now() < pausedUntil) return { degraded: true };

  const params = new URLSearchParams({
    q: query,
    countrycodes: 'us',
    // Spares: matches without a street (a bare city) and repeats of one address (a shop and the
    // building it is in) are dropped below.
    limit: String(ADDRESS_SUGGESTION_LIMIT + 3),
    dedupe: '1',
    // Always a `city`, whatever the place is tagged as (town, village, hamlet).
    normalizecity: '1',
    statecode: '1',
    key: apiKey,
  });
  if (near) {
    // West, north, east, south. The box is only a preference (`bounded=0`), and it does nothing
    // without `importancesort=0`, which ranks by distance from it instead of by prominence.
    params.set('viewbox', [near.longitude - NEARBY_DEGREES, near.latitude + NEARBY_DEGREES, near.longitude + NEARBY_DEGREES, near.latitude - NEARBY_DEGREES].join(','));
    params.set('bounded', '0');
    params.set('importancesort', '0');
  }

  let res: Response;
  try {
    res = await fetch(`${AUTOCOMPLETE_URL}?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    console.warn(`[${tag}] locationiq unreachable:`, err instanceof Error ? err.name : 'error');
    return { degraded: true };
  }
  // "Unable to geocode": nothing matched, which is an answer, not a failure.
  if (res.status === 404) return { suggestions: [] };
  if (!res.ok) {
    const reason = await res.json().then((b) => String((b as { error?: unknown }).error ?? ''), () => '');
    if (res.status === 401 || res.status === 403 || /day/i.test(reason)) pausedUntil = Date.now() + LONG_PAUSE_MS;
    else if (res.status === 429 && /minute/i.test(reason)) pausedUntil = Date.now() + SHORT_PAUSE_MS;
    console.warn(`[${tag}] locationiq answered ${res.status}`, reason.slice(0, 60));
    return { degraded: true };
  }

  let results: LocationIqResult[];
  try {
    const body: unknown = await res.json();
    results = Array.isArray(body) ? (body as LocationIqResult[]) : [];
  } catch {
    return { degraded: true };
  }

  const seen = new Set<string>();
  const suggestions: AddressSuggestion[] = [];
  for (const { address: a } of results) {
    if (!a?.road || !a.city || !a.state_code) continue;
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const state = a.state_code.toUpperCase();
    const zip = a.postcode ?? '';
    // The provider's own display line carries neighbourhoods and counties; this is how the
    // address would be written on an envelope.
    const text = `${street}, ${a.city}, ${[state, zip].filter(Boolean).join(' ')}`;
    if (seen.has(text)) continue;
    seen.add(text);
    suggestions.push({ text, street, city: a.city, state, zip });
    if (suggestions.length === ADDRESS_SUGGESTION_LIMIT) break;
  }
  return { suggestions };
}
