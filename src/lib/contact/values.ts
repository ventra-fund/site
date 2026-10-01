// SERVER ONLY. Resolves the actual contact details for the reveal endpoint (src/pages/api/contact/
// reveal.ts) and nothing else: never import this from a client script, a component, or a prerendered
// page. The values are not in the repo: `CONTACT_PHONE` is a secret in `.env` / `.dev.vars` locally
// and a Worker secret in production (`wrangler secret put CONTACT_PHONE`). `pnpm check:contact` fails
// if the configured value turns up in a committable file or in the build output.
import { CONTACT_PHONE } from 'astro:env/server';
import type { ContactKey } from './keys';

export interface ContactValue {
  /** Drawn on the canvas and put on the clipboard. */
  display: string;
  /** Opened by the Call button. */
  href: string;
}

/** `+15555550123` → `(555) 555-0123`; any other shape is shown as configured. */
export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

/** The detail for `key`, or null when its secret is unset (the endpoint answers 503). */
export function contactValue(key: ContactKey): ContactValue | null {
  switch (key) {
    case 'phone': {
      // Stored as E.164 (+15555550123) so the tel: link is exact and the display is derived.
      const raw = CONTACT_PHONE?.trim();
      if (!raw) return null;
      return { display: formatPhone(raw), href: `tel:${raw.replace(/[^\d+]/g, '')}` };
    }
  }
}
