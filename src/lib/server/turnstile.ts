const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteverifyOutcome {
  success?: boolean;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify a Turnstile token with Cloudflare. `action` must match what the widget was rendered
 * with (see Turnstile.astro), so a token minted for one form can't be replayed on another.
 * With `hostname`, the token must also have been solved on that host, so a token minted on a copy
 * of the page elsewhere is refused.
 * Network failures count as "not verified"; the route answers 403 rather than leaking a stack.
 */
export async function verifyTurnstile(opts: { tag: string; secret: string; token: string; action: string; ip: string | null; hostname?: string }): Promise<boolean> {
  const body = new URLSearchParams({ secret: opts.secret, response: opts.token });
  if (opts.ip) body.set('remoteip', opts.ip);
  let outcome: SiteverifyOutcome;
  try {
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body });
    if (!res.ok) {
      console.warn(`[${opts.tag}] siteverify responded`, res.status);
      return false;
    }
    outcome = (await res.json()) as SiteverifyOutcome;
  } catch (err) {
    console.warn(`[${opts.tag}] siteverify unreachable`, err);
    return false;
  }
  if (!outcome.success || outcome.action !== opts.action) {
    console.warn(`[${opts.tag}] turnstile rejected`, outcome['error-codes'], outcome.action);
    return false;
  }
  if (opts.hostname !== undefined && outcome.hostname !== opts.hostname) {
    console.warn(`[${opts.tag}] turnstile hostname mismatch`, outcome.hostname);
    return false;
  }
  return true;
}
