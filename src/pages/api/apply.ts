import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { applyRequest } from '@/lib/apply-schema';
import { escapeHtml } from '@/lib/sanitize';
import { invalidBody, json, methodNotAllowed, readJson, requireSecrets } from '@/lib/server/http';
import { sendEmail } from '@/lib/server/email';
import { verifyTurnstile } from '@/lib/server/turnstile';
import { enforceRateLimit } from '@/lib/server/rate-limit';

// One of the three on-demand routes (with /api/contact and /api/partner). Everything else on the
// site is prerendered.
export const prerender = false;

const TAG = 'apply';
// Must match the `action` the widget is rendered with (see apply.astro).
const TURNSTILE_ACTION = 'apply';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const POST: APIRoute = async ({ request }) => {
  // First thing, so a rejected client never costs a siteverify or Resend call.
  const limited = await enforceRateLimit(TAG, request);
  if (limited) return limited;

  const read = await readJson(request);
  if ('response' in read) return read.response;
  // The form runs friendly checks client-side, but anyone can POST here directly.
  const parsed = applyRequest.safeParse(read.payload);
  if (!parsed.success) return invalidBody(parsed.error);
  const data = parsed.data;

  // Shares the contact inbox and sender identity; there's only one team address configured.
  const env = requireSecrets(TAG, { TURNSTILE_SECRET_KEY, RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL });
  if ('response' in env) return env.response;
  const secrets = env.secrets;

  const verified = await verifyTurnstile({
    tag: TAG,
    secret: secrets.TURNSTILE_SECRET_KEY,
    token: data.token,
    action: TURNSTILE_ACTION,
    ip: request.headers.get('CF-Connecting-IP'),
  });
  if (!verified) return json(403, { error: 'verification_failed' });

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

  const sent = await sendEmail(TAG, secrets.RESEND_API_KEY, {
    from: secrets.CONTACT_FROM_EMAIL,
    to: secrets.CONTACT_TO_EMAIL,
    replyTo: data.email,
    subject: `New funding application from ${data.legalBusinessName}`,
    html: `<table>${rows.map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
  });
  if (!sent) return json(502, { error: 'send_failed' });
  return json(200, { ok: true });
};

export const ALL: APIRoute = methodNotAllowed;
