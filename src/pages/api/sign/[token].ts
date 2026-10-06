import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY, SIGNING_ENCRYPTION_KEY } from 'astro:env/server';
import { SIGN_TOKEN } from '@/lib/signing-config';
import { signRequest } from '@/lib/signing-schema';
import { runInBackground } from '@/lib/server/bindings';
import { getDraftDb } from '@/lib/server/drafts';
import { sendEmail } from '@/lib/server/email';
import { invalidBody, json, methodNotAllowed, readJson, requireSecrets } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { findByToken, getRequest, importFieldKey, isExpired, recordConsent, recordSignature, signalsOf, type SigningRequestRow } from '@/lib/server/signing';
import { signedNoticeEmail, signedReceiptEmail } from '@/lib/server/signing-email';

// The signing link's two steps (the page is src/pages/sign/[token].astro): `consent` accepts the
// e-sign disclosure, `sign` confirms the details, gives the EIN and SSN and adopts the typed
// signature. The token in the path is the whole capability; see src/lib/server/signing.ts.
export const prerender = false;

const TAG = 'sign';

/** Why a request can't be acted on, as the page words it; null when it can. */
function closedReason(row: SigningRequestRow): string | null {
  if (row.status === 'signed') return 'already_signed';
  if (row.status === 'revoked') return 'revoked';
  if (isExpired(row)) return 'expired';
  return null;
}

export const POST: APIRoute = async ({ params, request, url }) => {
  const limited = await enforceRateLimit(TAG, request, 'SIGN_RATE_LIMIT');
  if (limited) return limited;

  const token = params.token ?? '';
  if (!SIGN_TOKEN.test(token)) return json(404, { error: 'not_found' });
  const read = await readJson(request);
  if ('response' in read) return read.response;
  const parsed = signRequest.safeParse(read.payload);
  if (!parsed.success) return invalidBody(parsed.error);
  const body = parsed.data;

  const db = await getDraftDb();
  if (!db) return json(500, { error: 'not_configured' });
  const row = await findByToken(db, token);
  if (!row) return json(404, { error: 'not_found' });
  const closed = closedReason(row);
  if (closed) return json(410, { error: closed });
  const signals = signalsOf(request);

  if (body.action === 'consent') {
    return (await recordConsent(db, row.id, signals)) ? json(200, { ok: true }) : json(410, { error: 'expired' });
  }

  if (!row.consented_at) return json(409, { error: 'consent_required' });
  const env = requireSecrets(TAG, { SIGNING_ENCRYPTION_KEY });
  if ('response' in env) return env.response;
  let key: CryptoKey;
  try {
    key = await importFieldKey(env.secrets.SIGNING_ENCRYPTION_KEY);
  } catch (err) {
    console.error(`[${TAG}] bad SIGNING_ENCRYPTION_KEY`, err instanceof Error ? err.message : err);
    return json(500, { error: 'not_configured' });
  }

  const signed = await recordSignature(db, key, row, { fields: body.fields, ein: body.ein, ssn: body.ssn, signerName: body.signerName }, signals);
  if (!signed) {
    // Lost a race: signed in another tab, revoked or expired since the lookup.
    const fresh = await getRequest(db, row.id);
    return json(410, { error: (fresh && closedReason(fresh)) ?? 'expired' });
  }

  const done = await getRequest(db, row.id);
  if (done) void runInBackground(sendSignedEmails(done, `${url.origin}/admin/drop-offs/${done.draft_id}`));
  return json(200, { ok: true });
};

export const ALL: APIRoute = methodNotAllowed;

/** A receipt to the signer (at the address the link went to) and a notice to the team. Best effort. */
async function sendSignedEmails(row: SigningRequestRow, adminUrl: string): Promise<void> {
  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) return;
  const confirmed = JSON.parse(row.confirmed_json ?? '{}') as { legalBusinessName?: string };
  const business = confirmed.legalBusinessName || 'your business';
  const signerName = row.signer_name ?? '';
  const signedAt = row.signed_at ?? 0;
  await Promise.all([
    sendEmail(TAG, RESEND_API_KEY, {
      from: CONTACT_FROM_EMAIL,
      to: row.email,
      replyTo: CONTACT_TO_EMAIL || undefined,
      ...signedReceiptEmail({ signerName, business, signedAt, documentHash: row.document_hash ?? '' }),
    }),
    CONTACT_TO_EMAIL
      ? sendEmail(TAG, RESEND_API_KEY, { from: CONTACT_FROM_EMAIL, to: CONTACT_TO_EMAIL, ...signedNoticeEmail({ signerName, business, signedAt, adminUrl }) })
      : Promise.resolve(true),
  ]);
}
