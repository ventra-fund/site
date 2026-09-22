import { z } from 'astro/zod';

// The rich-text message rules shared by the contact and partner forms. Server-only.

export const MESSAGE_MAX_CHARS = 10_000;

/** The message as plain text: what the visitor sees, and what the limit is measured against. */
export const messageText = z
  .string()
  .trim()
  .min(1, 'Please enter a message.')
  .max(MESSAGE_MAX_CHARS, 'Your message is too long.');

/** Raw editor HTML as it arrives in the request. Capped generously here; the real limit is `messageText` after sanitizing. */
export const messageHtml = z.string().min(1, 'Please enter a message.').max(MESSAGE_MAX_CHARS * 10, 'Your message is too long.');

export const turnstileToken = z.string().min(1).max(2048);

/** Collapse newlines so a typed name is safe to place in an email subject. */
export const singleLine = (label: string, max: number) =>
  z.string().transform((s) => s.replace(/[\r\n]+/g, ' ').trim()).pipe(
    z.string().min(1, `Please enter your ${label}.`).max(max, 'That entry is too long.'),
  );

export const emailAddress = z.string().trim().pipe(z.email('Please enter a valid email address.').max(254, 'That email is too long.'));
