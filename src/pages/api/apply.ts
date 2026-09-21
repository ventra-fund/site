import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { applyRequest } from '@/lib/apply-schema';
import { escapeHtml } from '@/lib/sanitize';

// The only on-demand routes besides this one: /api/contact and /api/partner. Everything else on
// the site is prerendered.
export const prerender = false;

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_URL = 'https://api.resend.com/emails';
// Must match the `action` the widget is rendered with (see apply.astro).
const TURNSTILE_ACTION = 'apply';

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
    console.warn('[apply] turnstile rejected', outcome['error-codes'], outcome.action);
    return false;
  }
  return true;
}

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  // The form runs friendly checks client-side, but anyone can POST here directly.
  const parsed = applyRequest.safeParse(payload);
  if (!parsed.success) return json(400, { error: 'invalid_body', fields: parsed.error.issues.map((i) => i.path.join('.')) });
  const data = parsed.data;

  // Fail closed: without every secret nothing is verified and nothing is sent. Shares the contact
  // inbox and sender identity; there's only one team address configured right now.
  if (!TURNSTILE_SECRET_KEY || !RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    const missing = Object.entries({ TURNSTILE_SECRET_KEY, RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL })
      .filter(([, value]) => !value)
      .map(([key]) => key);
    console.error('[apply] missing environment secrets:', missing.join(', '));
    return json(500, { error: 'not_configured' });
  }

  if (!(await verifyTurnstile(TURNSTILE_SECRET_KEY, data.token, request.headers.get('CF-Connecting-IP')))) {
    return json(403, { error: 'verification_failed' });
  }

  const applicantName = `${data.firstName} ${data.lastName}`;
  const rows: [string, string][] = [
    ['Legal business name', data.legalBusinessName],
    ['DBA', data.dba || '—'],
    ['Contact name', applicantName],
    ['Mobile', data.mobile],
    ['Email', data.email],
    ['Monthly business revenue', money(data.monthlyRevenue)],
    ['Home address', data.homeAddress],
    ['Business address', data.businessAddress],
    ['Business start date', data.businessStartDate],
    ['Business industry', data.businessIndustry],
    ['Estimated FICO score', String(data.ficoScore)],
    ['Requested funding amount', money(data.fundingAmount)],
  ];

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      reply_to: data.email,
      subject: `New funding application from ${data.legalBusinessName}`,
      html: `<table>${rows.map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    }),
  });
  if (!res.ok) {
    console.error('[apply] resend failed', res.status, await res.text());
    return json(502, { error: 'send_failed' });
  }
  return json(200, { ok: true });
};

export const ALL: APIRoute = () => json(405, { error: 'method_not_allowed' });
