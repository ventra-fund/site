import { getBinding } from './bindings';

// PARKED, not wired up. Server-side storage of uploaded statements in an R2 bucket, keyed
// `apply/<uuid>` with the filename, sniffed type and extraction job id as object metadata. It
// is switched off until the abandoned-form-fill work lands, at which point statements will be
// stored alongside that data under one set of lifecycle rules; the `DOCUMENTS` binding in
// wrangler.jsonc is commented out for the same reason. Until then the flow is stateless: the
// browser keeps the files and re-sends them with the submission (see src/pages/api/apply.ts).
//
// Access model when this is live: the uuid is minted here (122 random bits) and only the
// uploading browser is told it, so it is the whole capability; anything naming a document has
// to present one, validated by `isDocumentId` before it is used in a key.

const KEY_PREFIX = 'apply/';
const DOC_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

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

export const isDocumentId = (id: unknown): id is string => typeof id === 'string' && DOC_ID.test(id);

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

/** Metadata plus the bytes, for attaching to the email. */
export async function getDocument(bucket: R2Bucket, id: string): Promise<(StoredDocument & { bytes: ArrayBuffer }) | null> {
  const obj = await bucket.get(keyFor(id));
  if (!obj) return null;
  return { ...fromObject(id, obj), bytes: await obj.arrayBuffer() };
}
