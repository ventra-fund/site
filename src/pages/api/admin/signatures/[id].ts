import type { APIRoute } from 'astro';
import { SIGNING_ENCRYPTION_KEY } from 'astro:env/server';
import { UUID_V4 } from '@/lib/draft-config';
import { getDraftDb } from '@/lib/server/drafts';
import { json, methodNotAllowed, requireSecrets } from '@/lib/server/http';
import { getRequest, importFieldKey, revealIdentifiers } from '@/lib/server/signing';

// POST: decrypt a signed request's EIN and SSN for the admin page's Reveal button. Every call is
// logged in the request's audit trail with the admin's email. Sign-in is enforced by
// src/middleware.ts (401 without an admin session).
export const prerender = false;

const TAG = 'admin-reveal';

export const POST: APIRoute = async ({ params, request, url, locals }) => {
  // Cookies ride along on a cross-site POST only if SameSite allows; refuse one outright anyway.
  if (request.headers.get('Origin') !== url.origin) return json(403, { error: 'forbidden' });
  const id = params.id;
  if (!id || !UUID_V4.test(id)) return json(404, { error: 'not_found' });
  const env = requireSecrets(TAG, { SIGNING_ENCRYPTION_KEY });
  if ('response' in env) return env.response;
  const db = await getDraftDb();
  const row = db ? await getRequest(db, id) : null;
  if (!db || !row || row.status !== 'signed') return json(404, { error: 'not_found' });

  try {
    const key = await importFieldKey(env.secrets.SIGNING_ENCRYPTION_KEY);
    const revealed = await revealIdentifiers(db, key, row, locals.adminSession!.user.email);
    if (!revealed) return json(404, { error: 'not_found' });
    return new Response(JSON.stringify(revealed), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (err) {
    // A wrong or rotated key, or a tampered ciphertext; the message never includes the data.
    console.error(`[${TAG}] could not decrypt`, err instanceof Error ? err.message : err);
    return json(500, { error: 'decrypt_failed' });
  }
};

export const ALL: APIRoute = methodNotAllowed;
