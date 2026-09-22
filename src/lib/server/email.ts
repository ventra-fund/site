const RESEND_URL = 'https://api.resend.com/emails';

export interface OutgoingEmail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
}

/** Send through Resend. Returns false (after logging) on any failure, including network errors. */
export async function sendEmail(tag: string, apiKey: string, email: OutgoingEmail): Promise<boolean> {
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: email.from,
        to: [email.to],
        reply_to: email.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!res.ok) {
      console.error(`[${tag}] resend failed`, res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[${tag}] resend unreachable`, err);
    return false;
  }
}
