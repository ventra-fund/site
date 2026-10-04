// The security headers for everything the Worker answers itself: the admin pages, the signing page
// and every /api route. Static files (the prerendered pages, /_astro, /media) never reach the
// Worker and get the same set from public/_headers instead; Cloudflare doesn't apply that file to
// Worker responses. KEEP THE TWO IN STEP: a change here belongs there too.

// What each directive is there for:
// - script-src: the site's own files plus Turnstile's loader. No inline scripts are allowed, which
//   is the point of the policy; astro.config.mjs keeps Astro from inlining small ones.
// - style-src: 'unsafe-inline' for the style="" attributes in the markup, the @font-face block
//   Astro's <Font> prints, and the date picker's shadow-DOM styles.
// - img-src / font-src: data: and blob: for what PDF.js builds while drawing a statement.
// - frame-src: the Turnstile widget is an iframe.
// - worker-src: the PDF.js worker, served from /_astro.
// - connect-src: the forms only ever call this origin; provider calls happen server-side.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  'frame-src https://challenges.cloudflare.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
};

/**
 * Adds the headers a route hasn't set itself, so a stricter per-route value (the signing page's
 * `Referrer-Policy: no-referrer`, a stored document's own CSP) is kept.
 */
export function applySecurityHeaders(response: Response): Response {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (response.headers.has(name)) continue;
    // A stored document sets its own framing rule (same-origin) in its CSP; DENY would contradict it.
    if (name === 'X-Frame-Options' && response.headers.has('Content-Security-Policy')) continue;
    response.headers.set(name, value);
  }
  return response;
}
