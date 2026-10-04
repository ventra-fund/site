// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

import tailwindcss from "@tailwindcss/vite";

// bejamas:astro-fonts:start
// ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
// │ FONT WEIGHTS / STYLES ARE DELIBERATELY RESTRICTED HERE. READ BEFORE USING A NEW ONE.        │
// │                                                                                             │
// │ Only what the site actually uses is downloaded:                                             │
// │   • weights 400–800 (a single variable-font file per family; covers `font-normal`,          │
// │     `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`)                          │
// │   • style `normal` only (no italic files are shipped)                                       │
// │                                                                                             │
// │ Anything outside that range is NOT a real face: the browser will silently synthesize it     │
// │ (faux-bold / faux-italic / faux-thin) and it will look wrong. If you need e.g. `italic`,    │
// │ `font-light` (300) or `font-black` (900), widen `weights` / add `"italic"` to `styles`      │
// │ below — and know that each addition is another font file on every page.                    │
// │ The `<Font>` tag in src/layouts/Layout.astro `preload`s the face; keep that.                │
// │                                                                                             │
// │ Inter is the only site-wide family (Dancing Script is the e-signature face, loaded only where │
// │ a signature is shown; see its entry). A separate heading font (Raleway, `--font-heading`) used to be    │
// │ configured here but nothing in the site applied `font-heading`, so it was pure download.   │
// │ To add one back: add a second entry here with `cssVariable: "--font-heading"`, a matching   │
// │ `<Font cssVariable="--font-heading" preload />` in Layout.astro, and DON'T redeclare        │
// │ `--font-heading` in src/styles/globals.css `:root` — that stylesheet loads after Astro's    │
// │ inline font CSS and would override the generated family name with a non-existent one.      │
// └─────────────────────────────────────────────────────────────────────────────────────────────┘
/** @type {NonNullable<import("astro").AstroUserConfig["fonts"]>} */
const BEJAMAS_ASTRO_FONTS = [
  {
    provider: fontProviders.google(),
    name: "Inter",
    cssVariable: "--font-sans",
    subsets: ["latin"],
    weights: ["400 800"],
    styles: ["normal"],
  },
  // The cursive face a typed e-signature is drawn in (src/lib/signing-config.ts). Only the signing
  // page and the admin application page render `<Font cssVariable="--font-signature" />`, so no
  // other page downloads it.
  {
    provider: fontProviders.google(),
    name: "Dancing Script",
    cssVariable: "--font-signature",
    subsets: ["latin"],
    weights: ["400"],
    styles: ["normal"],
  },
];
// bejamas:astro-fonts:end

// The subcommand is always argv[2] (`astro dev`/`astro build`/`astro preview`), so this is a
// reliable way to tell them apart (defineConfig itself has no function form in this Astro version).
// Checked by position rather than `includes("dev")` so an argument that happens to be named "dev"
// (an output dir, say) can't switch the adapter off.
const isDevCommand = process.argv[2] === "dev";

// https://astro.build/config
export default defineConfig({
  fonts: BEJAMAS_ASTRO_FONTS,
  // Pages stay prerendered; only routes with `prerender = false` (the form APIs, drop-off capture
  // and the admin pages) run on the Worker. Skip the adapter for `astro dev`: its workerd dev runner
  // has a nasty upstream bug (withastro/astro#17921) where a package only reachable from an
  // on-demand route gets discovered lazily and crashes the dev server. Bindings (rate limiters, D1,
  // R2) are read through src/lib/server/bindings.ts, which resolves nothing under plain Node, so
  // `pnpm dev` runs with them off (no limits, no admin sign-in, no drop-off capture). `astro
  // build`/`astro preview` and the deploy workflow get the real adapter and bindings.
  adapter: isDevCommand ? undefined : cloudflare({ imageService: "compile" }),
  env: {
    schema: {
      // Public by nature (it is printed in the page HTML), so the production key is committed as the
      // default. That lets CI build with no dashboard setup. Override it via .env or a build variable.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: "client", access: "public", default: "0x4AAAAAAE-lURqPrz_gvFzi" }),
      // Optional so a missing secret reaches the endpoint's own fail-closed check instead of throwing on import.
      TURNSTILE_SECRET_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      RESEND_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: "server", access: "secret", optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: "server", access: "secret", optional: true }),
      // LlamaCloud, for reading uploaded bank statements (/api/apply/upload and parse-status).
      LLAMA_CLOUD_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      // Admin sign-in (src/lib/server/auth.ts). Emails go through RESEND_API_KEY / CONTACT_FROM_EMAIL.
      BETTER_AUTH_SECRET: envField.string({ context: "server", access: "secret", optional: true }),
      BETTER_AUTH_URL: envField.string({ context: "server", access: "secret", optional: true }),
      // Comma-separated; the only addresses that can sign in to /admin.
      ADMIN_EMAILS: envField.string({ context: "server", access: "secret", optional: true }),
      // 32 random bytes, base64: encrypts the EIN and SSN a signer gives (src/lib/server/signing.ts).
      // Losing it makes stored identifiers unreadable; rotating it needs a re-encrypt.
      SIGNING_ENCRYPTION_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      // The public phone number, E.164 (+15555550123). Secret so it never lands in the repo or the
      // static build: only /api/contact/reveal reads it, behind Turnstile (docs/contact-reveal.md).
      CONTACT_PHONE: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Astro prints a small <script> into the page instead of linking it, and the Content Security
      // Policy (src/lib/server/security-headers.ts, public/_headers) allows no inline scripts.
      // `false` for scripts keeps every one a file under /_astro; everything else keeps the default.
      assetsInlineLimit: (filePath) => (/\.m?js$/.test(filePath) ? false : undefined),
    },
  },
  prefetch: {
    defaultStrategy: 'viewport'
  },
});
