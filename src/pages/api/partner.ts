import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { partnerRequest, messageText, PARTNER_INTERESTS, type PartnerRole } from '@/lib/partner-schema';
import { escapeHtml, htmlToText, sanitizeHtml } from '@/lib/sanitize';
import { invalidBody, json, methodNotAllowed, readJson, requireSecrets } from '@/lib/server/http';
import { sendEmail } from '@/lib/server/email';
import { verifyTurnstile } from '@/lib/server/turnstile';

// One of the three on-demand routes (with /api/apply and /api/contact). Everything else on the
// site is prerendered.
export const prerender = false;

const TAG = 'partner';
// Must match the `action` the widget is rendered with (see partner.astro).
const TURNSTILE_ACTION = 'partner';

const ROLE_LABELS: Record<PartnerRole, string> = {
  lender: 'Lender',
  broker: 'Broker',
  service_provider: 'Service provider',
};

export const POST: APIRoute = async ({ request }) => {
  const read = await readJson(request);
  if ('response' in read) return read.response;
  // The form runs friendly checks client-side, but anyone can POST here directly.
  const parsed = partnerRequest.safeParse(read.payload);
  if (!parsed.success) return invalidBody(parsed.error);
  const { name: cleanName, email: cleanEmail, role, interests, html, token } = parsed.data;

  let safeHtml: string;
  try {
    safeHtml = await sanitizeHtml(html);
  } catch {
    // HTMLRewriter refuses markup it finds ambiguous to parse. The editor never produces any.
    return json(400, { error: 'invalid_message' });
  }
  const message = messageText.safeParse(htmlToText(safeHtml));
  if (!message.success) return json(400, { error: 'invalid_message' });
  const text = message.data;

  // Shares the contact inbox and sender identity; there's only one team address configured.
  const env = requireSecrets(TAG, { TURNSTILE_SECRET_KEY, RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL });
  if ('response' in env) return env.response;
  const secrets = env.secrets;

  const verified = await verifyTurnstile({
    tag: TAG,
    secret: secrets.TURNSTILE_SECRET_KEY,
    token,
    action: TURNSTILE_ACTION,
    ip: request.headers.get('CF-Connecting-IP'),
  });
  if (!verified) return json(403, { error: 'verification_failed' });

  const roleLabel = ROLE_LABELS[role];
  const interestLabels = interests.map((v) => PARTNER_INTERESTS[role].find((o) => o.value === v)?.label ?? v);
  const interestsHtml = interestLabels.length
    ? `<p><strong>Interested in:</strong></p><ul>${interestLabels.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`
    : '';
  const interestsText = interestLabels.length
    ? `Interested in:\n${interestLabels.map((l) => `- ${l}`).join('\n')}\n\n`
    : '';

  const sent = await sendEmail(TAG, secrets.RESEND_API_KEY, {
    from: secrets.CONTACT_FROM_EMAIL,
    to: secrets.CONTACT_TO_EMAIL,
    replyTo: cleanEmail,
    subject: `New partner inquiry (${roleLabel}) from ${cleanName}`,
    html: `<p><strong>From:</strong> ${escapeHtml(cleanName)} &lt;${escapeHtml(cleanEmail)}&gt;</p><p><strong>Role:</strong> ${escapeHtml(roleLabel)}</p>${interestsHtml}<hr>${safeHtml}`,
    text: `From: ${cleanName} <${cleanEmail}>\nRole: ${roleLabel}\n\n${interestsText}${text}`,
  });
  if (!sent) return json(502, { error: 'send_failed' });
  return json(200, { ok: true });
};

export const ALL: APIRoute = methodNotAllowed;
