const MAX_FILENAME = 120;

/**
 * A filename safe to print, to use as an email attachment name, and to send as an HTTP header
 * value (ASCII only): no path separators, no control characters, bounded length, and the
 * extension replaced by the sniffed one so the name can't claim to be something the bytes aren't.
 */
export function safeFilename(original: string, ext: string): string {
  const base = original.replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9 ._-]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, MAX_FILENAME);
  return `${base || 'statement'}.${ext}`;
}
