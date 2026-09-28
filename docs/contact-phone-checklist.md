# Contact page phone number (anti-scrape)

Goal: replace the `(###) ###-####` placeholder on `/contact` (`src/pages/contact.astro:17`) with the real number, without leaving it in the HTML where scrapers and spam-call lists can pick it up. Real visitors, including those on phones and using screen readers, should still be able to read it and tap to call.

## Options considered

| Approach | Stops | Weak spots |
|---|---|---|
| **Turnstile-gated reveal**: number fetched from the Worker after a passed check | HTML scrapers and most headless bots; number isn't in the page or JS bundle | Needs JS; one click for the visitor |
| **SVG glyph paths**: digits drawn as `<path>`s, no text nodes | Regex/text scrapers | OCR; screen readers need a label, which leaks the number unless it's also gated |
| **Canvas-drawn text** | Regex/text scrapers | OCR; not selectable, not accessible, blurry on zoom unless DPR-scaled |
| CSS tricks (reversed text, `::after` content, hidden decoy digits) | Naive scrapers | Trivially defeated; confuses copy/paste and screen readers |
| Split/encoded in JS (e.g. base64 or XOR, assembled on load) | Scrapers that don't run JS | Anything that runs JS |

## Decision (proposed)

- **Layer the first two.** Put the Turnstile-gated reveal in front. After it, render the number as an SVG of glyph paths with no digits in the text, and add a `tel:` link.
- Once revealed, the number sits in the `tel:` href and the `aria-label`. That's accepted: only visitors who pass the check get that far, and tap-to-call on mobile matters more than hiding it from them.
- Skip canvas. Next to an SVG it adds only accessibility problems.
- The number lives in a Worker secret, not in the source, so it's never in the repo or the static build.

## Server

- [ ] Add a `CONTACT_PHONE` server secret to `astro.config.mjs` `env.schema` (next to `CONTACT_TO_EMAIL`), `.dev.vars` and `.env.example`. Set it with `wrangler secret put CONTACT_PHONE`. Store it as E.164 (`+12125551234`)
- [ ] `POST /api/contact/phone` (`src/pages/api/contact/phone.ts`): `{ token }` → verify with `verifyTurnstile` using a new action (`phone`), so a contact-form token can't be reused here
  - [ ] On success, return `{ tel: '+1…', svg: '<svg…>' }` with `Cache-Control: no-store`
  - [ ] 403 on a failed check, 503 if the secret is missing
- [ ] Rate-limit it with a new `PHONE_RATE_LIMIT` binding in `wrangler.jsonc` (about 5 a minute), following `src/lib/server/rate-limit.ts`
- [ ] `src/lib/server/phone-glyphs.ts`: turns the formatted number into one SVG, with each digit a `<path>` from a small built-in glyph table (0–9, `(`, `)`, `-`, space), using `fill="currentColor"` so it follows the theme
  - [ ] Optionally vary spacing and path order slightly per response so the markup isn't a fixed fingerprint
  - [ ] Any font will do as long as it's not a real text node. Tracing the site's own font keeps it looking native

## Client (`src/pages/contact.astro`)

- [ ] Replace the placeholder with "call us at **(212) ···-····** [Show number]". Showing the area code is optional; hide it too if the number is sensitive
- [ ] Clicking **Show number** runs an invisible Turnstile (`appearance="interaction-only"`, `action="phone"`), reusing `gateOnFirstInteraction` from `src/lib/turnstile.ts`. It then POSTs the token and swaps in the SVG wrapped in `<a href="tel:…" aria-label="Call (212) 555-1234">`
- [ ] Loading state on the button, and a friendly error with retry if the check or request fails
- [ ] Remember the reveal for the page view only (no storage), so nothing new needs a cookie notice
- [ ] Without JS: show "Enable JavaScript to see our number, or send us a message below". The form is already the main contact route
- [ ] Keep the rest of the page unchanged, including the contact form's own Turnstile widget. Check that two widgets on one page don't clash

## Elsewhere

- [ ] Search for other places the number might go (footer, signing email, application emails, `index.astro` "answers the phone" copy). Emails going to known applicants can show it plainly
- [ ] Don't add the number to structured data, meta tags or `sitemap` until you decide it's OK for it to be public. If SEO or Google Business listings need it, this whole approach is moot
- [ ] Update the privacy checklist (`docs/privacy-terms-checklist.md`) if the reveal endpoint logs anything

## Testing

- [ ] `curl /contact` and `grep` the built `dist/` for the number, in every format (digits only, dashed, E.164): no matches
- [ ] Reveal works on desktop and mobile. Tapping calls the right number
- [ ] VoiceOver/NVDA reads the full number after reveal, and the button before it
- [ ] Light and dark theme: glyphs follow the text color and stay sharp at 200% zoom
- [ ] A forged or reused token → 403. More than the rate limit → 429
- [ ] Missing `CONTACT_PHONE` → the button shows the error state, and the page doesn't break
