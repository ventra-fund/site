import type { APIRoute } from 'astro';
import { getDocument, getDocumentBucket, isDocumentId } from '@/lib/server/documents';
import { json, methodNotAllowed } from '@/lib/server/http';

// Download a stored statement from the drop-off dashboard. Sign-in is enforced by
// src/middleware.ts (401 without an admin session).
export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!isDocumentId(id)) return json(404, { error: 'not_found' });
  const bucket = await getDocumentBucket();
  if (!bucket) return json(404, { error: 'not_found' });
  const doc = await getDocument(bucket, id);
  if (!doc) return json(404, { error: 'not_found' });
  return new Response(doc.bytes, {
    headers: {
      'Content-Type': doc.mime,
      // Always a download, never rendered on this origin: the bytes came from an applicant.
      'Content-Disposition': `attachment; filename="${doc.filename.replace(/[^\w.-]/g, '_')}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
};

export const ALL: APIRoute = methodNotAllowed;
