# Contact reveal: anti-scrape phone number

The phone number on `/contact` never appears in any page, script, stylesheet, the static build or the repo. A visitor clicks **Show number**, passes the bot checks, and the number is drawn on a `<canvas>` from vector outlines. **Copy** and **Call** pass the checks again and fetch the text only on that click. Ported from fundedexperts (`docs/contact-reveal.md` there); the one difference is that the value is a secret, not a source file.

## The layers

| Layer | Where | Applies in |
|---|---|---|
| Pre-clearance: a WAF rule challenges `/api/contact/reveal`, so only a browser holding the `cf_clearance` cookie from a passed Turnstile widget gets through | Cloudflare dashboard (below) | Production on a custom domain only; needs a zone, so not on `workers.dev` |
| Same-origin check, per-IP rate limit (`CONTACT_RATE_LIMIT`, 12/min) | `src/pages/api/contact/reveal.ts`, `wrangler.jsonc` | Worker (`pnpm preview`, deployed); `pnpm dev` has no limiter |
| Turnstile, verified server-side: every call needs its own fresh token, minted for the `contact-reveal` action on the hostname serving the request | same, `src/lib/server/turnstile.ts` | Everywhere |
| Bot Management: refuse a score below 30 or a verified bot | same | Only when `request.cf.botManagement` is present (Enterprise / add-on); skipped otherwise, so it turns on by itself |
| Outlines, not text: the Show response is one SVG path with per-point noise and shuffled glyph order, so it differs every time and can't be matched to the font by string comparison | `src/lib/contact/outline.ts` | Everywhere |

OCR on a screenshot defeats any visual scheme. The checks are the real protection; the canvas keeps a scraper that gets through them from reading the value straight out of the DOM or the network.

## Files

- **The value is not in the repo.** `CONTACT_PHONE` (E.164, e.g. `+15555550123`) is an `astro:env` server secret: in `.env` and `.dev.vars` locally (both gitignored) and a Worker secret in production. Unset, the endpoint answers 503 and the page says to send a message instead.
- `src/lib/contact/values.ts`: **server-only** resolver from the secret to display text `(555) 555-0123` and link `tel:+15555550123`. Only the reveal endpoint may import it.
- `src/lib/contact/keys.ts`: client-safe list of details (just `phone`), kinds and labels.
- `src/lib/contact/glyphs.ts`: **generated** outlines (Inter, weight 400) for digits, phone punctuation and the characters an email would need. Rerun `node scripts/contact-glyphs.mjs` after changing the font; `composeOutline` throws naming the script if a character is missing.
- `src/components/ContactReveal.astro`: the Show / Copy / Call UI, one instance per detail. Turnstile loads on the first click, not with the page.
- `src/lib/turnstile.ts`: `awaitTurnstileToken` / `refreshTurnstile`, used by the component. After each spend the widget is reset, so the next token is usually ready before the next click.
- `scripts/check-contact-values.mjs` (`pnpm check:contact`): fails if the configured number, in any of its shapes, appears in a committable file or in `dist/`, or if anything but the endpoint imports `values.ts`. Run it after `pnpm build`.

## Setup

- [ ] Put the real number in `.env` and `.dev.vars` as `CONTACT_PHONE=+1…` (a `555` placeholder is there now)
- [ ] `wrangler secret put CONTACT_PHONE` for production
- [ ] Deploy the new `CONTACT_RATE_LIMIT` binding (namespace `1006`) with the next `wrangler deploy`
- [ ] **Turnstile widget** (dashboard): Widget Mode **Managed**; turn on "Skip future security rule challenges for verified visitors" (pre-clearance), clearance level **Managed**. Make sure the production hostname is on the widget, since tokens are now checked against it
- [ ] Once the site is on a custom domain, add a **WAF custom rule** on the zone (Security → WAF → Custom rules):
  - Name: `Contact reveal requires clearance`
  - Expression: `(http.request.uri.path eq "/api/contact/reveal")`
  - Action: **Managed Challenge**

  A browser that just passed the page's widget holds the clearance cookie and goes straight through. A direct `POST` without it gets a challenge page instead of JSON, which the component reports as "Could not verify".
- [ ] **Bot Fight Mode** on (Security → Settings) on a Free zone. With Bot Management later, the endpoint starts enforcing the score on its own
- [ ] Before adding the number anywhere else (footer, emails, structured data), decide whether it should be public at all. Search listings would make this moot

## Testing

- [ ] `pnpm build`, then `pnpm check:contact`: no number in the repo or `dist/`
- [ ] `pnpm preview`: Show draws the number in the paragraph's size and colour; Copy fills the clipboard; Call opens the dialler on a phone
- [ ] Flip dark mode after revealing: the canvas redraws in the new colour
- [ ] A direct `curl -X POST /api/contact/reveal`: no `Origin`/`Referer` or another origin → 403; right origin but no token → 400; forged token → 403; more than 12 a minute → 429
- [ ] Unset `CONTACT_PHONE` → Show reports it isn't available, and the page still works
