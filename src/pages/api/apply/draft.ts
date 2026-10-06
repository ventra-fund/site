import type { APIRoute } from 'astro';
import { draftSaveRequest } from '@/lib/apply-schema';
import { invalidBody, json, methodNotAllowed, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { getDraftDb, saveDraft } from '@/lib/server/drafts';

// Saves a snapshot of the /apply form to its drop-off session (see src/lib/server/drafts.ts).
// No Turnstile here: the draft id, minted by /api/apply/session behind one, is the capability,
// and the rate limit bounds what it can write. The id travels in the body because the page's
// last save is a sendBeacon, which can't set headers.
export const prerender = false;

const TAG = 'apply-draft';

export const POST: APIRoute = async ({ request }) => {
  const limited = await enforceRateLimit(TAG, request, 'DRAFT_RATE_LIMIT');
  if (limited) return limited;

  const read = await readJson(request);
  if ('response' in read) return read.response;
  const parsed = draftSaveRequest.safeParse(read.payload);
  if (!parsed.success) return invalidBody(parsed.error);
  const { draftId, ...snapshot } = parsed.data;

  const db = await getDraftDb();
  if (!db) return json(200, { ok: true });

  try {
    const saved = await saveDraft(db, draftId, snapshot);
    // Unknown, submitted or purged: tell the page to stop saving.
    if (!saved) return json(410, { error: 'gone' });
    return json(200, { ok: true });
  } catch (err) {
    console.error(`[${TAG}] save failed`, err);
    return json(500, { error: 'save_failed' });
  }
};

export const ALL: APIRoute = methodNotAllowed;
