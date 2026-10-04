import type { APIRoute } from 'astro';
import { LOCATIONIQ_API_KEY } from 'astro:env/server';
import { ADDRESS_QUERY_MAX, ADDRESS_QUERY_MIN, type AddressSuggestResponse } from '@/lib/address-config';
import { json, methodNotAllowed } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { suggestAddresses } from '@/lib/server/locationiq';

// GET /api/address/suggest?q=<text> — address suggestions for the apply page's address fields,
// asked of LocationIQ from here so its key never reaches the browser. The suggestions are optional:
// with no key, a spent quota or an outage the answer is `{ suggestions: [], degraded: true }` (a
// 200, not an error) and the field stays a plain text input.
export const prerender = false;

const TAG = 'address-suggest';

// An address being typed is personal: kept out of shared caches and search results. The browser
// may reuse an answer for a few minutes (backspacing over the same text asks nothing new).
const HEADERS = { 'Cache-Control': 'private, max-age=300', 'X-Robots-Tag': 'noindex' };
const reply = (body: AddressSuggestResponse) => json(200, { ...body }, HEADERS);

let warnedNoKey = false;

export const GET: APIRoute = async ({ url, request }) => {
  // Only the site's own pages may spend the provider quota. Browsers send Sec-Fetch-Site on every
  // request and scripts can't forge it from another origin; a client that omits it still meets
  // the rate limit.
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin') return json(403, { error: 'forbidden' });

  const limited = await enforceRateLimit(TAG, request, 'ADDRESS_RATE_LIMIT');
  if (limited) return limited;

  const q = (url.searchParams.get('q') ?? '').trim().replace(/\s+/g, ' ');
  if (q.length < ADDRESS_QUERY_MIN || q.length > ADDRESS_QUERY_MAX) return json(400, { error: 'invalid_query' });

  if (!LOCATIONIQ_API_KEY) {
    if (!warnedNoKey) console.warn(`[${TAG}] LOCATIONIQ_API_KEY missing; address suggestions are off`);
    warnedNoKey = true;
    return reply({ suggestions: [], degraded: true });
  }

  // Cloudflare's rough position for the visitor, from their IP: no permission prompt. When it is
  // missing, suggestions are simply not ranked by distance.
  const cf = (request as Request & { cf?: { latitude?: string; longitude?: string } }).cf;
  const latitude = Number(cf?.latitude);
  const longitude = Number(cf?.longitude);
  const near = cf?.latitude && cf?.longitude && Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : undefined;

  const result = await suggestAddresses(TAG, LOCATIONIQ_API_KEY, q, near);
  return reply('degraded' in result ? { suggestions: [], degraded: true } : result);
};

export const ALL: APIRoute = methodNotAllowed;
