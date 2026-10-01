import type { APIRoute } from 'astro';
import { TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { z } from 'astro/zod';
import { CONTACT_KEYS } from '@/lib/contact/keys';
import { contactValue } from '@/lib/contact/values';
import { composeOutline } from '@/lib/contact/outline';
import { json, methodNotAllowed, readJson, requireSecrets } from '@/lib/server/http';
import { verifyTurnstile } from '@/lib/server/turnstile';
import { enforceRateLimit } from '@/lib/server/rate-limit';

// Reveals one contact detail (docs/contact-reveal.md). The layers, outermost first:
//
//   1. Pre-clearance (production only, configured in the Cloudflare dashboard): a WAF custom rule
//      puts a Managed Challenge on this path, which only a browser holding the cf_clearance cookie
//      from a passed Turnstile widget gets through. Needs a zone, so it is absent on workers.dev and
//      the checks below carry the load there.
//   2. Same-origin + a per-IP rate limit.
//   3. Turnstile, verified here: every call, outline or text, needs its own fresh token, minted for
//      the contact-reveal widget on this site's hostname.
//   4. Bot Management, when the zone has it: request.cf.botManagement is only populated on plans
//      with Bot Management, so the check is skipped when it is absent and starts enforcing by
//      itself once it is present.
//
// format 'outline' (the Show button) returns vector outlines for a canvas, never the text.
// format 'text' (Copy / Call) returns the text, only on that explicit click.
export const prerender = false;

const TAG = 'contact-reveal';
// Must match the `action` ContactReveal.astro renders its widget with.
const TURNSTILE_ACTION = 'contact-reveal';
/** Cloudflare's own guidance: scores below 30 are likely automated. */
const MIN_BOT_SCORE = 30;

const revealRequest = z.object({
  key: z.enum(CONTACT_KEYS),
  format: z.enum(['outline', 'text']),
  token: z.string().min(1).max(2048),
});

// Never cached anywhere, never indexed.
const HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
const reply = (status: number, body: Record<string, unknown>) => json(status, body, HEADERS);

type BotManagement = { score?: number; verifiedBot?: boolean };

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  if (origin ? origin !== url.origin : !referer?.startsWith(url.origin + '/')) {
    return reply(403, { error: 'forbidden' });
  }

  const limited = await enforceRateLimit(TAG, request, 'CONTACT_RATE_LIMIT');
  if (limited) return limited;

  const read = await readJson(request);
  if ('response' in read) return read.response;
  const parsed = revealRequest.safeParse(read.payload);
  if (!parsed.success) return reply(400, { error: 'invalid_body' });
  const { key, format, token } = parsed.data;

  const env = requireSecrets(TAG, { TURNSTILE_SECRET_KEY });
  if ('response' in env) return env.response;

  const verified = await verifyTurnstile({
    tag: TAG,
    secret: env.secrets.TURNSTILE_SECRET_KEY,
    token,
    action: TURNSTILE_ACTION,
    ip: request.headers.get('CF-Connecting-IP'),
    hostname: url.hostname,
  });
  if (!verified) return reply(403, { error: 'verification_failed' });

  // Verified bots (search engines, monitors) are refused too: the number should not be indexed.
  const bm = (request as Request & { cf?: { botManagement?: BotManagement } }).cf?.botManagement;
  const botScore = typeof bm?.score === 'number' ? bm.score : null;
  if (bm?.verifiedBot || (botScore !== null && botScore < MIN_BOT_SCORE)) {
    console.warn(`[${TAG}] blocked`, { key, format, botScore, verifiedBot: !!bm?.verifiedBot });
    return reply(403, { error: 'verification_failed' });
  }

  const value = contactValue(key);
  if (!value) {
    console.error(`[${TAG}] missing environment secret for`, key);
    return reply(503, { error: 'not_configured' });
  }

  return format === 'outline'
    ? reply(200, { outline: composeOutline(value.display) })
    : reply(200, { text: value.display, href: value.href });
};

export const ALL: APIRoute = methodNotAllowed;
