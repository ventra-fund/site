import type { APIRoute } from 'astro';
import { TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { AUTH_PATHS, getAuth } from '@/lib/server/auth';
import { json } from '@/lib/server/http';
import { verifyTurnstile } from '@/lib/server/turnstile';

// Better Auth's handler, for admin sign-in (see src/lib/server/auth.ts). On-demand like the form APIs.
export const prerender = false;

const TAG = 'auth';
const BASE = '/api/auth';
// Sending a code is the step that costs something (an email, a stored code), so it needs a
// Turnstile token. Entering the code doesn't: each code allows 3 guesses, and getting a new one
// means passing Turnstile again. Must match the `action` on the sign-in page's widget.
const SEND_CODE_PATH = '/email-otp/send-verification-otp';
const TURNSTILE_ACTION = 'admin-sign-in';
// A header rather than a body field, so Better Auth's own body validation is untouched.
const TOKEN_HEADER = 'x-captcha-response';

export const ALL: APIRoute = async ({ request }) => {
  const path = new URL(request.url).pathname.slice(BASE.length);
  // Better Auth mounts many endpoints; only the ones the sign-in flow uses are let through.
  if (!AUTH_PATHS.has(path)) return json(404, { error: 'not_found' });

  // Checked before auth is touched, so a rejected request never starts anything on D1.
  if (path === SEND_CODE_PATH && request.method === 'POST') {
    if (!TURNSTILE_SECRET_KEY) {
      console.error(`[${TAG}] TURNSTILE_SECRET_KEY missing; refusing to send sign-in codes`);
      return json(503, { error: 'auth_unavailable' });
    }
    const token = request.headers.get(TOKEN_HEADER);
    const verified =
      !!token &&
      (await verifyTurnstile({
        tag: TAG,
        secret: TURNSTILE_SECRET_KEY,
        token,
        action: TURNSTILE_ACTION,
        ip: request.headers.get('CF-Connecting-IP'),
      }));
    if (!verified) return json(403, { error: 'verification_failed' });
  }

  const auth = await getAuth();
  if (!auth) return json(503, { error: 'auth_unavailable' });
  return auth.handler(request);
};
