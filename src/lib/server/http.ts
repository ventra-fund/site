import type { ZodError } from 'astro/zod';

// Shared by the API routes. Responses carry a short code only; upstream details go to the
// Worker logs.

// Far above any legitimate form payload (the biggest, a 10k-char rich-text message, is well under
// 200 KB even with markup). Anything larger is refused before it's parsed.
export const MAX_BODY_BYTES = 1_000_000;

export const json = (status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

// Multipart framing on top of a request's files and fields: boundaries, part headers.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/** Parse a JSON string under the body cap, or return the error response to send instead. */
export function parseJsonText(raw: string): { payload: unknown } | { response: Response } {
  if (raw.length > MAX_BODY_BYTES) return tooLarge();
  try {
    return { payload: JSON.parse(raw) };
  } catch {
    return { response: json(400, { error: 'invalid_json' }) };
  }
}

/**
 * The request body capped at `max` bytes. A declared Content-Length over the cap is refused
 * before anything is read; the body is also counted as it streams, so a request that declares
 * no length (chunked) can't get past the cap either. `body` errors once the count passes `max`,
 * and `exceeded()` then tells a too-large body from a malformed one.
 */
function cappedBody(request: Request, max: number): { body: Response; exceeded: () => boolean } | null {
  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > max) return null;
  let seen = 0;
  const stream = request.body?.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        seen += chunk.byteLength;
        if (seen > max) controller.error(new Error('body too large'));
        else controller.enqueue(chunk);
      },
    }),
  );
  const type = request.headers.get('Content-Type');
  return { body: new Response(stream ?? null, type ? { headers: { 'Content-Type': type } } : {}), exceeded: () => seen > max };
}

const tooLarge = () => ({ response: json(413, { error: 'too_large' }) });

/** Parse the JSON body, or return the error response to send instead. */
export async function readJson(request: Request): Promise<{ payload: unknown } | { response: Response }> {
  const capped = cappedBody(request, MAX_BODY_BYTES);
  if (!capped) return tooLarge();
  try {
    return { payload: await capped.body.json() };
  } catch {
    return capped.exceeded() ? tooLarge() : { response: json(400, { error: 'invalid_json' }) };
  }
}

/**
 * Parse a multipart body whose parts add up to at most `maxPartBytes` (files plus any JSON
 * field), or return the error response to send instead.
 */
export async function readMultipart(request: Request, maxPartBytes: number): Promise<{ form: FormData } | { response: Response }> {
  const capped = cappedBody(request, maxPartBytes + MULTIPART_OVERHEAD_BYTES);
  if (!capped) return tooLarge();
  try {
    return { form: await capped.body.formData() };
  } catch {
    return capped.exceeded() ? tooLarge() : { response: json(400, { error: 'invalid_form' }) };
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
