// Allowlist sanitizer for the contact form's Quill HTML, built on HTMLRewriter (the Workers
// runtime's native streaming HTML parser; there is no DOM here for DOMPurify). HTMLRewriter passes
// everything through by default, so all the safety is in the handlers below: every element is
// checked against the allowlist, and every attribute is stripped except a vetted `href`.
//
// This is sized for HTML that ends up in an inbox. If messages are ever rendered on a web page,
// sanitize again at render time with a DOM-based sanitizer.

// The tags the editor toolbar can produce (see QuillEditor.astro).
const ALLOWED_TAGS = new Set(['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a']);
// Removed along with their contents, which would otherwise survive as visible text or markup.
const DROPPED_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math', 'textarea', 'title', 'head',
]);
const SAFE_HREF = /^(https?:|mailto:)/i;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Throws if the parser finds the markup ambiguous; callers should treat that as invalid input. */
export async function sanitizeHtml(html: string): Promise<string> {
  const rewriter = new HTMLRewriter()
    .on('*', {
      element(el) {
        const name = el.tagName.toLowerCase();
        if (DROPPED_WITH_CONTENT.has(name)) { el.remove(); return; }
        if (!ALLOWED_TAGS.has(name)) { el.removeAndKeepContent(); return; }
        const href = name === 'a' ? el.getAttribute('href')?.trim() : undefined;
        for (const [attr] of [...el.attributes]) el.removeAttribute(attr);
        if (href && SAFE_HREF.test(href)) {
          el.setAttribute('href', href);
          el.setAttribute('rel', 'noopener noreferrer');
        }
      },
    })
    .onDocument({
      comments(comment) { comment.remove(); },
      // Text is already entity-encoded by Quill; only stray angle brackets need escaping. Quill's
      // getSemanticHTML() also turns every space into `&nbsp;`, which stops mail clients from
      // wrapping long lines, so those go back to plain spaces.
      text(chunk) {
        if (chunk.removed || !/[<>]|&nbsp;/.test(chunk.text)) return;
        chunk.replace(
          chunk.text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&nbsp;/g, ' '),
          { html: true },
        );
      },
    });
  return rewriter.transform(new Response(html)).text();
}

/** Plain-text rendering of (sanitized) HTML, for length checks and the email's text part. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
