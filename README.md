# Astro + Bejamas/ui + Cloudflare Workers
- viewport prefetching enabled on all navbar links
- Bejamas/ui for the component library
- CF worker deployment through github repo connection: automatic when pushed to main
## Environment
The site is static except for `/api/contact`, which runs on the Worker: it verifies the Turnstile token, then sends the message through Resend. Variables are listed in `.env.example`.

- **Local:** copy `.env.example` to `.env` (gitignored) and fill it in. `pnpm dev` reads it.
- **Production build:** needs nothing. The Turnstile site key is public, so it is committed as the default in `astro.config.mjs`. A `PUBLIC_TURNSTILE_SITE_KEY` build variable overrides it.
- **Production runtime** (Worker → Settings → Variables and Secrets, type *Secret*, or `npx wrangler secret put <NAME>`): `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. Use secrets, not plain variables: plain dashboard variables are wiped on each deploy, and nothing belongs in `wrangler.jsonc` since the repo is on GitHub.

Until the runtime secrets are set, the contact endpoint returns 500 and sends nothing.

### Images
The adapter is set to `imageService: "compile"`: images are optimized once at build time and served as plain static files. The alternative, the Cloudflare Images binding, transforms on request, so the first load of each image size waits on the transform before it is cached. Only switch to it if a server-rendered page ever needs runtime resizing; static pages gain nothing from it.
