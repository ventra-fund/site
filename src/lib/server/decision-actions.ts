import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY } from 'astro:env/server';
import { emailAddress, messageText } from '@/lib/message-schema';
import { htmlToText, sanitizeHtml } from '@/lib/sanitize';
import { DRAFT_FIELDS } from '@/lib/draft-config';
import { parseObject, type DraftDb } from './drafts';
import { sendEmail } from './email';
import { approve, decline, getDecision, isSigned, recordSend } from './signing';
import { signingLinkEmail } from './signing-email';

// The decision form on the admin application page (src/pages/admin/drop-offs/[id].astro): approve
// (which emails a signing link), decline, or resend the link. Returns a notice code for the page
// to show after its post/redirect/get.

const TAG = 'admin-decision';

export type DecisionNotice =
  | 'approved' | 'declined' | 'resent' | 'send_failed' | 'reason_required' | 'invalid_reason'
  | 'no_email' | 'email_not_configured' | 'locked' | 'not_approved' | 'invalid';

export const DECISION_NOTICES: Record<DecisionNotice, { text: string; bad: boolean }> = {
  approved: { text: 'Approved. The signing link was emailed to the applicant.', bad: false },
  declined: { text: 'Declined.', bad: false },
  resent: { text: 'A new signing link was emailed; the previous one no longer works.', bad: false },
  send_failed: { text: "Approved, but the email didn't go out. Try resending the link.", bad: true },
  reason_required: { text: 'Please give a reason for declining.', bad: true },
  invalid_reason: { text: "The reason couldn't be saved. Please shorten or simplify it.", bad: true },
  no_email: { text: "This application has no valid email address, so there's nowhere to send a signing link.", bad: true },
  email_not_configured: { text: 'Email sending is not configured (RESEND_API_KEY / CONTACT_FROM_EMAIL).', bad: true },
  locked: { text: 'This application has been signed; its decision can no longer change.', bad: true },
  not_approved: { text: 'Only an approved application has a signing link to resend.', bad: true },
  invalid: { text: "That action wasn't recognized.", bad: true },
};

/** The reason from the editor, sanitized; '' when empty, null when it can't be accepted. */
async function cleanReason(raw: FormDataEntryValue | null): Promise<string | null> {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    const html = await sanitizeHtml(raw.slice(0, 200_000));
    const text = htmlToText(html);
    if (!text) return '';
    return messageText.safeParse(text).success ? html : null;
  } catch {
    return null;
  }
}

export async function handleDecisionPost(
  db: DraftDb,
  draft: { id: string; fields_json: string },
  form: FormData,
  opts: { actor: string; origin: string },
): Promise<DecisionNotice> {
  const action = form.get('action');
  if (action !== 'approve' && action !== 'decline' && action !== 'resend') return 'invalid';
  if (await isSigned(db, draft.id)) return 'locked';

  const reason = action === 'resend' ? '' : await cleanReason(form.get('reasonHtml'));
  if (reason == null) return 'invalid_reason';

  if (action === 'decline') {
    if (!reason) return 'reason_required';
    await decline(db, draft.id, reason, opts.actor);
    return 'declined';
  }

  if (action === 'resend' && (await getDecision(db, draft.id))?.decision !== 'approved') return 'not_approved';
  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) return 'email_not_configured';
  const fields = parseObject(draft.fields_json);
  const prefill = Object.fromEntries(DRAFT_FIELDS.map((name) => [name, typeof fields[name] === 'string' ? (fields[name] as string) : '']));
  const email = emailAddress.safeParse(prefill.email);
  if (!email.success) return 'no_email';

  const { requestId, token, expiresAt } = await approve(db, {
    draftId: draft.id,
    email: email.data,
    prefill,
    reasonHtml: action === 'approve' ? reason : null,
    actor: opts.actor,
  });
  const message = signingLinkEmail({
    firstName: prefill.firstName,
    business: prefill.legalBusinessName || [prefill.firstName, prefill.lastName].filter(Boolean).join(' ') || 'your business',
    link: `${opts.origin}/sign/${token}`,
    expiresAt,
  });
  const sent = await sendEmail(TAG, RESEND_API_KEY, {
    from: CONTACT_FROM_EMAIL,
    to: email.data,
    // Replies reach the team, not the no-reply sender.
    replyTo: CONTACT_TO_EMAIL || undefined,
    ...message,
  });
  await recordSend(db, requestId, sent, opts.actor);
  if (!sent) return 'send_failed';
  return action === 'approve' ? 'approved' : 'resent';
}
