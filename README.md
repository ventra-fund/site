# Astro + Bejamas/ui + Cloudflare Workers
- viewport prefetching enabled on all navbar links
- Bejamas/ui for the component library
- CF worker deployment through github repo connection: automatic when pushed to main
## Environment
The site is static except for `/api/apply`, `/api/contact` and `/api/partner`, which run on the Worker: each verifies the Turnstile token, then sends the message through Resend. They share the same secrets and inbox. The shared pieces (body parsing, secret checks, siteverify, Resend) live in `src/lib/server/`. Variables are listed in `.env.example`.

- **Local:** copy `.env.example` to `.env` (gitignored) and fill it in. `pnpm dev` reads it.
- **Production build:** needs nothing. The Turnstile site key is public, so it is committed as the default in `astro.config.mjs`. A `PUBLIC_TURNSTILE_SITE_KEY` build variable overrides it.
- **Production runtime** (Worker → Settings → Variables and Secrets, type *Secret*, or `npx wrangler secret put <NAME>`): `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. Use secrets, not plain variables: plain dashboard variables are wiped on each deploy, and nothing belongs in `wrangler.jsonc` since the repo is on GitHub.

Until the runtime secrets are set, all three endpoints return 500 and send nothing.

Response headers (HSTS, nosniff, referrer policy, `frame-ancestors`) come from `public/_headers`, which Workers static assets applies to every response.

### Dev vs. build
`astro.config.mjs` only attaches the `@astrojs/cloudflare` adapter for `astro build`/`astro preview`, not `astro dev`. Local dev runs on plain Node/Vite instead of the adapter's workerd emulation, which sidesteps an upstream dev-server bug where a dependency only reachable from an on-demand route (e.g. `free-email-domains` via `/partner`) gets discovered lazily and crashes the runner ([withastro/astro#17921](https://github.com/withastro/astro/issues/17921)). Nothing in the app reads Cloudflare-specific runtime bindings (KV/D1/`locals.runtime`), so this doesn't change behavior — but if that ever changes, test it with `pnpm build && pnpm preview` (or `wrangler dev`), not `pnpm dev`.

### Images
The adapter is set to `imageService: "compile"`: images are optimized once at build time and served as plain static files. The alternative, the Cloudflare Images binding, transforms on request, so the first load of each image size waits on the transform before it is cached. Only switch to it if a server-rendered page ever needs runtime resizing; static pages gain nothing from it.
