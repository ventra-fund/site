import type { ZodError } from 'astro/zod';

// Shared by the API routes. Responses carry a short code only; upstream details go to the
// Worker logs.

// Far above any legitimate form payload (the biggest, a 10k-char rich-text message, is well under
// 200 KB even with markup). Anything larger is refused before it's parsed.
export const MAX_BODY_BYTES = 1_000_000;

export const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Parse the JSON body, or return the error response to send instead. */
export async function readJson(request: Request): Promise<{ payload: unknown } | { response: Response }> {
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > MAX_BODY_BYTES) return { response: json(413, { error: 'too_large' }) };
  try {
    return { payload: await request.json() };
  } catch {
    return { response: json(400, { error: 'invalid_json' }) };
  }
}

/** A 400 that names each failing field with its schema message, for the form to show inline. */
export function invalidBody(error: ZodError): Response {
  return json(400, {
    error: 'invalid_body',
    fields: error.issues.map((i) => ({ name: i.path.join('.'), message: i.message })),
  });
}

/**
 * Fail closed: without every secret nothing is verified and nothing is sent. Returns the secrets
 * as non-empty strings, or the 500 to send.
 */
export function requireSecrets<K extends string>(
  tag: string,
  secrets: Record<K, string | undefined>,
): { secrets: Record<K, string> } | { response: Response } {
  const missing = (Object.keys(secrets) as K[]).filter((key) => !secrets[key]);
  if (missing.length) {
    console.error(`[${tag}] missing environment secrets:`, missing.join(', '));
    return { response: json(500, { error: 'not_configured' }) };
  }
  return { secrets: secrets as Record<K, string> };
}

export const methodNotAllowed = () => json(405, { error: 'method_not_allowed' });
