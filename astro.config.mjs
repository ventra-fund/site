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
// │ Inter is the only family. A separate heading font (Raleway, `--font-heading`) used to be    │
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
];
// bejamas:astro-fonts:end

// `astro dev`/`astro build`/`astro preview` is always the literal CLI invocation, so this is a
// reliable way to tell them apart (defineConfig itself has no function form in this Astro version).
const isDevCommand = process.argv.slice(2).includes("dev");

// https://astro.build/config
export default defineConfig({
  fonts: BEJAMAS_ASTRO_FONTS,
  // Pages stay prerendered; only routes with `prerender = false` (the contact/partner APIs) run on
  // the Worker. Skip the adapter for `astro dev`: its workerd dev runner has a nasty upstream bug
  // (withastro/astro#17921) where a package only reachable from an on-demand route gets discovered
  // lazily and crashes the dev server. Nothing here touches Cloudflare-specific runtime bindings
  // (KV/D1/locals.runtime), so plain Node dev behaves identically. `astro build`/`astro preview`
  // and the deploy workflow still get the real adapter.
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
    },
  },
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: {
    defaultStrategy: 'viewport'
  },
});
