// Minimal ambient type for the Workers runtime module, covering only what
// src/lib/server/bindings.ts reads. The full `wrangler types` output isn't used because its
// globals collide with the DOM types the pages' client scripts rely on (see html-rewriter.d.ts).

declare module 'cloudflare:workers' {
  /** The Worker's bindings, as declared in wrangler.jsonc. */
  export const env: Record<string, unknown>;
  /** Extend the current request's lifetime until `promise` settles. */
  export function waitUntil(promise: Promise<unknown>): void;
}
