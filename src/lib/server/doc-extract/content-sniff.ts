// Upload-time content check: the filename extension and the browser-declared MIME type are
// both client-controlled (a text file renamed to `.pdf`, a hand-set Content-Type), so the actual
// bytes are cross-checked against the magic number for the extension before anything is sent
// to the document provider or the inbox. The type this returns, not the client's, is what the
// email attachment is named by. Only the head and tail of the file are read, so the check costs
// the same for a 10 MB upload as for a 10 KB one.

import { fileExtension } from '@/lib/upload-config';

export type SniffedType =
  | { ext: 'pdf'; mime: 'application/pdf' }
  | { ext: 'jpg'; mime: 'image/jpeg' }
  | { ext: 'png'; mime: 'image/png' };

export type SniffResult = { ok: true; type: SniffedType } | { ok: false; reason: string };

const HEAD_BYTES = 8;
// A real PDF ends with `%%EOF` (some writers pad a little after it); a missing trailer means
// the file was truncated, which would otherwise hang the parser until it gives up.
const TAIL_BYTES = 1024;

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const PDF_EOF = [0x25, 0x25, 0x45, 0x4f, 0x46]; // "%%EOF"
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  return sig.every((b, i) => bytes[i] === b);
}

function includes(bytes: Uint8Array, sig: number[]): boolean {
  outer: for (let i = 0; i + sig.length <= bytes.length; i++) {
    for (let j = 0; j < sig.length; j++) if (bytes[i + j] !== sig[j]) continue outer;
    return true;
  }
  return false;
}

function validateFileSignature(ext: string, size: number, head: Uint8Array, tail: Uint8Array): SniffResult {
  if (size === 0) return { ok: false, reason: 'empty' };
  switch (ext) {
    case 'pdf':
      if (!startsWith(head, PDF_MAGIC)) return { ok: false, reason: 'not_a_pdf' };
      if (!includes(tail, PDF_EOF)) return { ok: false, reason: 'truncated_pdf' };
      return { ok: true, type: { ext: 'pdf', mime: 'application/pdf' } };
    case 'jpg':
    case 'jpeg':
      if (!startsWith(head, JPEG_MAGIC)) return { ok: false, reason: 'not_an_image' };
      return { ok: true, type: { ext: 'jpg', mime: 'image/jpeg' } };
    case 'png':
      if (!startsWith(head, PNG_MAGIC)) return { ok: false, reason: 'not_an_image' };
      return { ok: true, type: { ext: 'png', mime: 'image/png' } };
    default:
      return { ok: false, reason: 'unsupported_type' };
  }
}

/** Read the head and tail of a File and validate them against its extension. */
export async function sniffFile(file: File): Promise<SniffResult> {
  const head = new Uint8Array(await file.slice(0, HEAD_BYTES).arrayBuffer());
  const tail = new Uint8Array(await file.slice(Math.max(0, file.size - TAIL_BYTES)).arrayBuffer());
  return validateFileSignature(fileExtension(file.name), file.size, head, tail);
}
