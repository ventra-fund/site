import { UUID_V4 } from '../draft-config';
import { getBinding } from './bindings';

// Server-side copies of uploaded statements in the DOCUMENTS R2 bucket, keyed `apply/<uuid>` with
// the filename, sniffed type and extraction job id as object metadata. Written by
// /api/apply/upload so a statement from an application that is never submitted still reaches the
// drop-off record (src/lib/server/drafts.ts), whose purge deletes a session's documents along with
// it; an R2 lifecycle rule on `apply/` backstops copies no session ever claimed. The submission
// itself doesn't read from here: the browser re-sends the files (see src/pages/api/apply.ts).
// Without the binding (`pnpm dev`) nothing is stored and uploads work as before.
//
// Access model: the uuid is minted by the upload endpoint (122 random bits) and only the
// uploading browser is told it, so it is the whole capability; anything naming a document has
// to present one, validated by `isDocumentId` before it is used in a key.

const KEY_PREFIX = 'apply/';

// The slice of the R2 API this module uses. The full `wrangler types` output is not pulled in
// because its globals collide with the DOM types the page scripts rely on (html-rewriter.d.ts).
interface R2Object {
  size: number;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
}
interface R2ObjectBody extends R2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
}
export interface R2Bucket {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  head(key: string): Promise<R2Object | null>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(keys: string | string[]): Promise<void>;
}

export interface DocumentMetadata {
  /** Cleaned original filename, what the email attachment is called. */
  filename: string;
  /** From the byte sniff, never the browser's declared type. */
  mime: string;
  uploadedAt: string;
  /** LlamaCloud Extract job id, or '' when submitting it failed (the file is still attached). */
  jobId: string;
  classifierConfidence: number;
}

export interface StoredDocument extends DocumentMetadata {
  id: string;
  size: number;
}

export const getDocumentBucket = () => getBinding<R2Bucket>('DOCUMENTS');

export const isDocumentId = (id: unknown): id is string => typeof id === 'string' && UUID_V4.test(id);

const keyFor = (id: string) => `${KEY_PREFIX}${id}`;

export async function putDocument(bucket: R2Bucket, id: string, bytes: ArrayBuffer, meta: DocumentMetadata): Promise<void> {
  await bucket.put(keyFor(id), bytes, {
    httpMetadata: { contentType: meta.mime },
    customMetadata: {
      filename: meta.filename,
      mime: meta.mime,
      uploadedAt: meta.uploadedAt,
      jobId: meta.jobId,
      classifierConfidence: String(meta.classifierConfidence),
    },
  });
}

function fromObject(id: string, obj: R2Object): StoredDocument {
  const m = obj.customMetadata ?? {};
  return {
    id,
    size: obj.size,
    filename: m.filename || `statement-${id.slice(0, 8)}`,
    mime: m.mime || obj.httpMetadata?.contentType || 'application/octet-stream',
    uploadedAt: m.uploadedAt ?? '',
    jobId: m.jobId ?? '',
    classifierConfidence: Number(m.classifierConfidence ?? 0),
  };
}

/** Metadata only (no body). Null when there is no such document. */
export async function headDocument(bucket: R2Bucket, id: string): Promise<StoredDocument | null> {
  const obj = await bucket.head(keyFor(id));
  return obj ? fromObject(id, obj) : null;
}

/** Delete stored documents; ids that aren't valid document ids are skipped. */
export async function deleteDocuments(bucket: R2Bucket, ids: string[]): Promise<void> {
  const keys = ids.filter(isDocumentId).map(keyFor);
  // One call takes up to 1000 keys.
  for (let i = 0; i < keys.length; i += 1000) await bucket.delete(keys.slice(i, i + 1000));
}

/** Metadata plus the bytes, e.g. for downloading from the admin dashboard. */
export async function getDocument(bucket: R2Bucket, id: string): Promise<(StoredDocument & { bytes: ArrayBuffer }) | null> {
  const obj = await bucket.get(keyFor(id));
  if (!obj) return null;
  return { ...fromObject(id, obj), bytes: await obj.arrayBuffer() };
}
