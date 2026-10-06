import { defineMiddleware } from 'astro:middleware';
import type { APIContext } from 'astro';
import { json } from '@/lib/server/http';
import { applySecurityHeaders } from '@/lib/server/security-headers';

// One guard for everything behind admin sign-in, so a new page or endpoint can't forget it:
// /admin/* (except the sign-in page itself) redirects to sign-in, /api/admin/* answers 401.
// The session (re-checked against the ADMIN_EMAILS allowlist) is handed to the route as
// `locals.adminSession`. Prerendered pages never reach here with an admin path.

const ADMIN_PAGE = /^\/admin(\/|$)/;
const ADMIN_API = /^\/api\/admin(\/|$)/;
const SIGN_IN = /^\/admin\/sign-in\/?$/;

async function guardAdmin(context: APIContext, next: () => Promise<Response>): Promise<Response> {
  const path = context.url.pathname;
  const isPage = ADMIN_PAGE.test(path) && !SIGN_IN.test(path);
  const isApi = ADMIN_API.test(path);
  if (!isPage && !isApi) return next();

  // Loaded here so the public routes, which all pass through this middleware, never pull in auth.
  const { getAdminSession } = await import('@/lib/server/auth');
  const session = await getAdminSession(context.request.headers);
  if (!session) return isApi ? json(401, { error: 'unauthorized' }) : context.redirect('/admin/sign-in');
  context.locals.adminSession = session;

  const response = await next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await guardAdmin(context, next);
  // Everything the Worker answers gets the security headers here, since public/_headers only
  // reaches static files. Not under `pnpm dev`, whose inline scripts the CSP would block (and
  // where _headers isn't applied either).
  return import.meta.env.PROD ? applySecurityHeaders(response) : response;
});
