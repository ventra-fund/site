import { z } from 'astro/zod';
import { emailAddress, messageHtml, singleLine, turnstileToken } from './message-schema';

// The contact form's rules, enforced by the /api/contact endpoint. Server-only: the page script
// does its own lightweight checks for friendly errors, so zod stays out of the client bundle.

export { MESSAGE_MAX_CHARS, messageText } from './message-schema';

/** The fields a visitor types. */
export const contactFields = z.object({
  name: singleLine('name', 200),
  email: emailAddress,
});

/** The JSON body POSTed to /api/contact. */
export const contactRequest = contactFields.extend({
  html: messageHtml,
  token: turnstileToken,
});

export type ContactRequest = z.infer<typeof contactRequest>;
