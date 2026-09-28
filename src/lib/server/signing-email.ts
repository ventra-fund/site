import { escapeHtml } from '@/lib/sanitize';
import { formatTime } from './admin-format';

// The emails around the signing flow (src/lib/server/signing.ts). Plain and short on purpose: the
// link email is the one a signer is most likely to find in spam, so it carries no images or tracking.

interface Email {
  subject: string;
  html: string;
  text: string;
}

const paragraphs = (lines: string[]) => lines.map((l) => `<p>${l}</p>`).join('');

/** To the applicant: their application is approved, here is where to confirm and sign. */
export function signingLinkEmail(opts: { firstName: string; business: string; link: string; expiresAt: number }): Email {
  const hello = opts.firstName ? `Hi ${opts.firstName},` : 'Hello,';
  const expires = formatTime(opts.expiresAt);
  return {
    subject: `Your Ventra Fund application for ${opts.business} is approved`,
    html: paragraphs([
      escapeHtml(hello),
      `Good news: your funding application for <strong>${escapeHtml(opts.business)}</strong> has been approved.`,
      'To move forward, please confirm your details, add your EIN and SSN, and sign electronically. It takes about five minutes.',
      `<a href="${escapeHtml(opts.link)}">Review and sign</a>`,
      `This link is personal to you and works until ${escapeHtml(expires)}. Please don't forward it.`,
      'If you have any questions, just reply to this email.',
    ]),
    text: [
      hello,
      '',
      `Good news: your funding application for ${opts.business} has been approved.`,
      '',
      'To move forward, please confirm your details, add your EIN and SSN, and sign electronically. It takes about five minutes:',
      opts.link,
      '',
      `This link is personal to you and works until ${expires}. Please don't forward it.`,
      '',
      'If you have any questions, just reply to this email.',
    ].join('\n'),
  };
}

/** To the applicant, once signed: a receipt. Never includes the identifiers themselves. */
export function signedReceiptEmail(opts: { signerName: string; business: string; signedAt: number; documentHash: string }): Email {
  const when = formatTime(opts.signedAt);
  return {
    subject: `You signed your Ventra Fund application for ${opts.business}`,
    html: paragraphs([
      `Thanks, ${escapeHtml(opts.signerName)}. We received your signature on ${escapeHtml(when)}.`,
      "Our team will be in touch about next steps. If you didn't sign this, reply to this email right away.",
      `<small>Reference: ${escapeHtml(opts.documentHash)}</small>`,
    ]),
    text: [
      `Thanks, ${opts.signerName}. We received your signature on ${when}.`,
      '',
      "Our team will be in touch about next steps. If you didn't sign this, reply to this email right away.",
      '',
      `Reference: ${opts.documentHash}`,
    ].join('\n'),
  };
}

/** To the team inbox, once signed. */
export function signedNoticeEmail(opts: { signerName: string; business: string; signedAt: number; adminUrl: string }): Email {
  const when = formatTime(opts.signedAt);
  return {
    subject: `Signed: ${opts.business}`,
    html: paragraphs([
      `${escapeHtml(opts.signerName)} signed the application for <strong>${escapeHtml(opts.business)}</strong> on ${escapeHtml(when)}.`,
      `<a href="${escapeHtml(opts.adminUrl)}">Open the application</a>`,
    ]),
    text: `${opts.signerName} signed the application for ${opts.business} on ${when}.\n\n${opts.adminUrl}`,
  };
}
