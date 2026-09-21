// Minimal ambient types for the Workers runtime's HTMLRewriter, covering only what
// src/lib/sanitize.ts uses. The full `wrangler types` output isn't used because its globals
// collide with the DOM types the pages' client scripts rely on.

interface HTMLRewriterElement {
  readonly tagName: string;
  readonly attributes: IterableIterator<[name: string, value: string]>;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): this;
  removeAttribute(name: string): this;
  remove(): this;
  removeAndKeepContent(): this;
}

interface HTMLRewriterText {
  readonly text: string;
  readonly removed: boolean;
  replace(content: string, options?: { html?: boolean }): this;
}

interface HTMLRewriterComment {
  remove(): this;
}

interface HTMLRewriterHandlers {
  element?(element: HTMLRewriterElement): void | Promise<void>;
  comments?(comment: HTMLRewriterComment): void | Promise<void>;
  text?(text: HTMLRewriterText): void | Promise<void>;
}

declare class HTMLRewriter {
  on(selector: string, handlers: HTMLRewriterHandlers): this;
  onDocument(handlers: Omit<HTMLRewriterHandlers, 'element'>): this;
  transform(response: Response): Response;
}
