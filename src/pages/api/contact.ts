import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { contactRequest, messageText } from '@/lib/contact-schema';
import { escapeHtml, htmlToText, sanitizeHtml } from '@/lib/sanitize';
import { invalidBody, json, methodNotAllowed, readJson, requireSecrets } from '@/lib/server/http';
import { sendEmail } from '@/lib/server/email';
import { verifyTurnstile } from '@/lib/server/turnstile';

// One of the three on-demand routes (with /api/apply and /api/partner). Everything else on the
// site is prerendered.
export const prerender = false;

const TAG = 'contact';
// Must match the `action` the widget is rendered with (see Turnstile.astro's default).
const TURNSTILE_ACTION = 'contact';

export const POST: APIRoute = async ({ request }) => {
  const read = await readJson(request);
  if ('response' in read) return read.response;
  // The form runs friendly checks client-side, but anyone can POST here directly.
  const parsed = contactRequest.safeParse(read.payload);
  if (!parsed.success) return invalidBody(parsed.error);
  const { name: cleanName, email: cleanEmail, html, token } = parsed.data;

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

  const sent = await sendEmail(TAG, secrets.RESEND_API_KEY, {
    from: secrets.CONTACT_FROM_EMAIL,
    to: secrets.CONTACT_TO_EMAIL,
    replyTo: cleanEmail,
    subject: `New contact message from ${cleanName}`,
    html: `<p><strong>From:</strong> ${escapeHtml(cleanName)} &lt;${escapeHtml(cleanEmail)}&gt;</p><hr>${safeHtml}`,
    text: `From: ${cleanName} <${cleanEmail}>\n\n${text}`,
  });
  if (!sent) return json(502, { error: 'send_failed' });
  return json(200, { ok: true });
};

export const ALL: APIRoute = methodNotAllowed;
