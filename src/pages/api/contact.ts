import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { contactRequest, messageText } from '@/lib/contact-schema';
import { escapeHtml, htmlToText, sanitizeHtml } from '@/lib/sanitize';

// The only on-demand route: everything else on the site is prerendered.
export const prerender = false;

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_URL = 'https://api.resend.com/emails';
// Must match the `action` the widget is rendered with (see Turnstile.astro).
const TURNSTILE_ACTION = 'contact';

// Responses carry a short code only; upstream details go to the Worker logs.
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetch(SITEVERIFY_URL, { method: 'POST', body });
  if (!res.ok) return false;
  const outcome = (await res.json()) as { success?: boolean; action?: string; 'error-codes'?: string[] };
  if (!outcome.success || outcome.action !== TURNSTILE_ACTION) {
    console.warn('[contact] turnstile rejected', outcome['error-codes'], outcome.action);
    return false;
  }
  return true;
}

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  // The form runs friendly checks client-side, but anyone can POST here directly.
  const parsed = contactRequest.safeParse(payload);
  if (!parsed.success) return json(400, { error: 'invalid_body', fields: parsed.error.issues.map((i) => i.path.join('.')) });
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

  // Fail closed: without every secret nothing is verified and nothing is sent.
  if (!TURNSTILE_SECRET_KEY || !RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    const missing = Object.entries({ TURNSTILE_SECRET_KEY, RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL })
      .filter(([, value]) => !value)
      .map(([key]) => key);
    console.error('[contact] missing environment secrets:', missing.join(', '));
    return json(500, { error: 'not_configured' });
  }

  if (!(await verifyTurnstile(TURNSTILE_SECRET_KEY, token, request.headers.get('CF-Connecting-IP')))) {
    return json(403, { error: 'verification_failed' });
  }

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      reply_to: cleanEmail,
      subject: `New contact message from ${cleanName}`,
      html: `<p><strong>From:</strong> ${escapeHtml(cleanName)} &lt;${escapeHtml(cleanEmail)}&gt;</p><hr>${safeHtml}`,
      text: `From: ${cleanName} <${cleanEmail}>\n\n${text}`,
    }),
  });
  if (!res.ok) {
    console.error('[contact] resend failed', res.status, await res.text());
    return json(502, { error: 'send_failed' });
  }
  return json(200, { ok: true });
};

export const ALL: APIRoute = () => json(405, { error: 'method_not_allowed' });
