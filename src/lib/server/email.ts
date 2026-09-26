import { Buffer } from 'node:buffer';

const RESEND_URL = 'https://api.resend.com/emails';

export interface EmailAttachment {
  filename: string;
  /** File contents; encoded to base64 here, which is how Resend takes inline attachments. */
  content: Blob;
}

export interface OutgoingEmail {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

/**
 * The Resend request body. With attachments it is written into one buffer sized up front instead
 * of going through JSON.stringify: each file is read, base64-encoded and copied in on its own, so
 * only one file's bytes and encoding are alive at a time beside the finished body. The one-string
 * route would hold every file, every encoding, the JSON string and its UTF-8 copy together,
 * which for 20 MB of statements comes close to the Worker's 128 MB memory limit.
 */
async function requestBody(email: OutgoingEmail): Promise<string | Uint8Array<ArrayBuffer>> {
  const fields = JSON.stringify({
    from: email.from,
    to: [email.to],
    reply_to: email.replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  const attachments = email.attachments ?? [];
  if (!attachments.length) return fields;

  // base64 needs no JSON escaping; the filename goes through JSON.stringify like every other field.
  const open = Buffer.from(`${fields.slice(0, -1)},"attachments":[`);
  const heads = attachments.map((a, i) => Buffer.from(`${i ? ',' : ''}{"filename":${JSON.stringify(a.filename)},"content":"`));
  const base64Length = (bytes: number) => 4 * Math.ceil(bytes / 3);
  const CLOSE_ITEM = '"}';
  const CLOSE_BODY = ']}';
  const size =
    open.length +
    attachments.reduce((sum, a, i) => sum + heads[i].length + base64Length(a.content.size) + CLOSE_ITEM.length, 0) +
    CLOSE_BODY.length;

  // Its own ArrayBuffer (not Buffer's shared pool), so the bytes handed to fetch are exactly the body.
  const bytes = new ArrayBuffer(size);
  const body = Buffer.from(bytes);
  let at = open.copy(body, 0);
  for (const [i, a] of attachments.entries()) {
    at += heads[i].copy(body, at);
    // base64 is plain ASCII, so writing it as latin1 copies each character as one byte.
    at += body.write(Buffer.from(await a.content.arrayBuffer()).toString('base64'), at, 'latin1');
    at += body.write(CLOSE_ITEM, at, 'latin1');
  }
  at += body.write(CLOSE_BODY, at, 'latin1');
  if (at !== size) throw new Error(`email body size mismatch (${at} of ${size} bytes)`);
  return new Uint8Array(bytes);
}

/** Send through Resend. Returns false (after logging) on any failure, including network errors. */
export async function sendEmail(tag: string, apiKey: string, email: OutgoingEmail): Promise<boolean> {
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: await requestBody(email),
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
