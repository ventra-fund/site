import type { APIRoute } from 'astro';
import { TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { draftSessionRequest } from '@/lib/apply-schema';
import { APPLY_TURNSTILE_ACTION } from '@/lib/upload-config';
import { invalidBody, json, methodNotAllowed, readJson, requireSecrets } from '@/lib/server/http';
import { verifyTurnstile } from '@/lib/server/turnstile';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { runInBackground } from '@/lib/server/bindings';
import { createDraft, getDraftDb, purgeExpired } from '@/lib/server/drafts';

// Opens a drop-off capture session for /apply (see src/lib/server/drafts.ts). This is the one
// Turnstile check capture pays for: nothing the visitor typed is sent anywhere until it passes,
// and the id handed back is what every later /api/apply/draft save authenticates with.
export const prerender = false;

const TAG = 'apply-session';

export const POST: APIRoute = async ({ request }) => {
  const limited = await enforceRateLimit(TAG, request, 'DRAFT_RATE_LIMIT');
  if (limited) return limited;

  const read = await readJson(request);
  if ('response' in read) return read.response;
  const parsed = draftSessionRequest.safeParse(read.payload);
  if (!parsed.success) return invalidBody(parsed.error);
  const data = parsed.data;

  // No database outside the Worker: capture is simply off, and the page stops asking.
  const db = await getDraftDb();
  if (!db) return json(200, { draftId: null });

  const env = requireSecrets(TAG, { TURNSTILE_SECRET_KEY });
  if ('response' in env) return env.response;

  // Only CF-Connecting-IP: X-Forwarded-For is client-supplied and never needed at the edge.
  const ip = request.headers.get('CF-Connecting-IP');
  const verified = await verifyTurnstile({
    tag: TAG,
    secret: env.secrets.TURNSTILE_SECRET_KEY,
    token: data.token,
    action: APPLY_TURNSTILE_ACTION,
    ip,
  });
  if (!verified) return json(403, { error: 'verification_failed' });

  try {
    const draftId = await createDraft(db, {
      ip,
      ua: request.headers.get('User-Agent')?.slice(0, 500) ?? null,
      referrer: data.referrer || null,
      utm: data.utm,
      // Astro passes the Worker's request through, so request.cf is read directly.
      cf: (request as Request & { cf?: Record<string, unknown> }).cf,
    });
    void runInBackground(purgeExpired(db));
    return json(200, { draftId });
  } catch (err) {
    console.error(`[${TAG}] could not create draft`, err);
    return json(200, { draftId: null });
  }
};

export const ALL: APIRoute = methodNotAllowed;
