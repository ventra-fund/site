import { z } from 'astro/zod';

// The contact form's rules, enforced by the /api/contact endpoint. Server-only: the page script
// does its own lightweight checks for friendly errors, so zod stays out of the client bundle.

export const MESSAGE_MAX_CHARS = 10_000;

/** The fields a visitor types. */
export const contactFields = z.object({
  // Collapse newlines so the name is safe to place in an email subject.
  name: z.string().transform((s) => s.replace(/[\r\n]+/g, ' ').trim()).pipe(
    z.string().min(1, 'Please enter your name.').max(200, 'That name is too long.'),
  ),
  email: z.string().trim().pipe(z.email('Please enter a valid email address.').max(254, 'That email is too long.')),
});

/** The message as plain text: what the visitor sees, and what the limit is measured against. */
export const messageText = z
  .string()
  .trim()
  .min(1, 'Please enter a message.')
  .max(MESSAGE_MAX_CHARS, 'Your message is too long.');

/** The JSON body POSTed to /api/contact. */
export const contactRequest = contactFields.extend({
  // Raw editor HTML. Capped generously here; the real limit is `messageText` after sanitizing.
  html: z.string().min(1).max(MESSAGE_MAX_CHARS * 10),
  token: z.string().min(1).max(2048),
});

export type ContactRequest = z.infer<typeof contactRequest>;
