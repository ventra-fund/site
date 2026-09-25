import { MAX_UPLOAD_FILES, MAX_UPLOAD_FILE_BYTES, MAX_UPLOAD_TOTAL_BYTES } from '@/lib/upload-config';
import { sniffFile, type SniffedType } from './content-sniff';
import { safeFilename } from './filename';

// The one set of gates a batch of statements goes through, used by both /api/apply/upload (the
// check) and /api/apply (the submit, which sees the same files again because nothing is stored
// in between). Cheap batch checks first; then per file, the size cap and the magic-byte sniff.

/** Every `files` part of a multipart form. */
export const filesOf = (form: FormData) => form.getAll('files').filter((f): f is File => f instanceof File);

/**
 * Why the batch as a whole is refused, or null when the per-file checks may proceed. `maxFiles`
 * is the whole application's cap by default; an upload request passes its smaller one.
 */
export function checkStatementBatch(files: File[], maxFiles = MAX_UPLOAD_FILES): 'too_many_files' | 'too_large' | null {
  if (files.length > maxFiles) return 'too_many_files';
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_UPLOAD_TOTAL_BYTES) return 'too_large';
  return null;
}

export type CheckedFile =
  | { ok: true; file: File; type: SniffedType; /** Cleaned name carrying the sniffed extension. */ filename: string }
  | { ok: false; file: File; reason: string };

/** The per-file gates: size cap, then the actual bytes against the extension. */
export async function checkStatementFile(file: File): Promise<CheckedFile> {
  if (file.size > MAX_UPLOAD_FILE_BYTES) return { ok: false, file, reason: 'too_large' };
  const sniff = await sniffFile(file);
  if (!sniff.ok) return { ok: false, file, reason: sniff.reason };
  return { ok: true, file, type: sniff.type, filename: safeFilename(file.name, sniff.type.ext) };
}
