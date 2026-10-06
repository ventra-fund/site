import { getBinding } from './bindings';
import { json } from './http';

// Per-IP caps backed by the Workers rate limiting bindings declared in wrangler.jsonc (the
// limits live there): `FORM_RATE_LIMIT` for the three submit endpoints, `UPLOAD_RATE_LIMIT`
// for statement uploads (its own counter, so re-picking files doesn't use up the submit budget
// and vice versa), `STATUS_RATE_LIMIT` for the statement status polls and `DRAFT_RATE_LIMIT` for
// drop-off capture (session mints and draft saves), `SIGN_RATE_LIMIT` for the signing link's steps, `CONTACT_RATE_LIMIT` for the contact reveal and `ADDRESS_RATE_LIMIT` for address suggestions. The binding is permissive and eventually consistent by design (one counter per
// Cloudflare location), which is plenty to stop a script hammering the inbox or the document
// provider while letting a real visitor file, say, a contact message and an application back
// to back. Outside the Worker (`pnpm dev`) there is no binding and nothing is limited.

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/**
 * Returns the 429 to send when this client has used up its budget, or null to proceed. Counts
 * the call itself, so invoke it once per request and before any upstream work (siteverify,
 * Resend, the document provider). Unlimited when the binding or the client IP is unavailable.
 */
export async function enforceRateLimit(tag: string, request: Request, binding: 'FORM_RATE_LIMIT' | 'UPLOAD_RATE_LIMIT' | 'STATUS_RATE_LIMIT' | 'DRAFT_RATE_LIMIT' | 'SIGN_RATE_LIMIT' | 'CONTACT_RATE_LIMIT' | 'ADDRESS_RATE_LIMIT' = 'FORM_RATE_LIMIT'): Promise<Response | null> {
  const ip = request.headers.get('CF-Connecting-IP');
  const limiter = await getBinding<RateLimiter>(binding);
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
