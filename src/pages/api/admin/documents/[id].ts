import type { APIRoute } from 'astro';
import { getDocument, getDocumentBucket, isDocumentId } from '@/lib/server/documents';
import { json, methodNotAllowed } from '@/lib/server/http';

// A stored statement for the drop-off dashboard: shown in the browser's own viewer (inline on the
// drop-off page, or in a new tab), or downloaded with `?download=1`. Sign-in is enforced by
// src/middleware.ts (401 without an admin session).
export const prerender = false;

// Only what the upload's magic-byte sniff can produce is rendered inline. The stored type IS that
// sniff's verdict (never the applicant's claim), and nosniff holds the browser to it, so the bytes
// only ever reach the built-in PDF/image viewer; anything else is still forced to a download.
const INLINE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export const GET: APIRoute = async ({ params, url }) => {
  const id = params.id;
  if (!isDocumentId(id)) return json(404, { error: 'not_found' });
  const bucket = await getDocumentBucket();
  if (!bucket) return json(404, { error: 'not_found' });
  const doc = await getDocument(bucket, id);
  if (!doc) return json(404, { error: 'not_found' });
  const inline = INLINE_TYPES.has(doc.mime) && url.searchParams.get('download') !== '1';
  return new Response(doc.bytes, {
    headers: {
      'Content-Type': doc.mime,
      // The filename also names the file when it is saved from the viewer.
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${doc.filename.replace(/[^\w.-]/g, '_')}"`,
      'X-Content-Type-Options': 'nosniff',
      // Framed only by the dashboard's own preview.
      'Content-Security-Policy': "frame-ancestors 'self'",
    },
  });
};

export const ALL: APIRoute = methodNotAllowed;
