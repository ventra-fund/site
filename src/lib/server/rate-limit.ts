import { json } from './http';

// Per-IP submission cap for the form endpoints, backed by the Workers rate limiting binding
// declared as `FORM_RATE_LIMIT` in wrangler.jsonc (2 requests per 60 s per key). The binding is
// permissive and eventually consistent by design (one counter per Cloudflare location), which
// is plenty to stop a script hammering the inbox while letting a real visitor file, say, a
// contact message and an application back to back.
//
// Bindings arrive through `cloudflare:workers`, which only exists inside the Worker. `astro dev`
// runs on plain Node (see astro.config.mjs), so the import is dynamic and a missing binding
// simply means "don't limit". `pnpm build && pnpm preview` runs the real thing.

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

let limiterPromise: Promise<RateLimiter | undefined> | undefined;

function getLimiter(): Promise<RateLimiter | undefined> {
  limiterPromise ??= import(/* @vite-ignore */ 'cloudflare:workers')
    .then((mod) => (mod.env as Record<string, unknown> | undefined)?.FORM_RATE_LIMIT as RateLimiter | undefined)
    .catch(() => undefined);
  return limiterPromise;
}

/**
 * Returns the 429 to send when this client has used up its budget, or null to proceed. Counts
 * the call itself, so invoke it once per request and before any upstream work (siteverify,
 * Resend). Unlimited when the binding or the client IP is unavailable.
 */
export async function enforceRateLimit(tag: string, request: Request): Promise<Response | null> {
  const ip = request.headers.get('CF-Connecting-IP');
  const limiter = await getLimiter();
  if (!limiter || !ip) return null;
  try {
    const { success } = await limiter.limit({ key: ip });
    if (success) return null;
  } catch (err) {
    // A broken limiter shouldn't take the forms down with it.
    console.warn(`[${tag}] rate limiter unavailable`, err);
    return null;
  }
  console.warn(`[${tag}] rate limited`, ip);
  return json(429, { error: 'too_many_requests' });
}
