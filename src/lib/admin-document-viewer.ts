// The drop-off page's statement viewer (src/pages/admin/drop-offs/[id].astro): a full-screen
// dialog with the document's pages floating on a dark backdrop, like Gmail's attachment preview.
// PDFs are drawn page by page with PDF.js rather than the browser's own viewer, so they look the
// same in every browser and sit on the backdrop without a viewer frame around them. Each page
// gets PDF.js's text layer over it, so its text can be selected and copied. PDF.js is imported on
// the first open, so the page itself doesn't carry it.
import '@/styles/pdf-text-layer.css';

/** Widest a page is drawn, in CSS pixels; narrower screens get the screen's width. */
const MAX_PAGE_WIDTH = 896;
const PAGE_CLASS = 'block rounded-sm bg-white shadow-2xl';

export function setupDocumentViewer(dialog: HTMLElement) {
  // Looked up now: while the dialog is open its content is moved to <body>, outside `dialog`.
  const backdrop = dialog.querySelector<HTMLElement>('[data-document-backdrop]');
  const pages = dialog.querySelector<HTMLElement>('[data-document-pages]');
  if (!backdrop || !pages) return;
  let loaded = false;

  dialog.addEventListener('dialog:change', (e) => {
    if (!(e as CustomEvent<{ open: boolean }>).detail.open || loaded) return;
    loaded = true;
    // After the move to <body>, so the width is measured where the pages will be.
    requestAnimationFrame(() => void load(backdrop, pages));
  });

  // The backdrop fills the screen, so the dialog's own click-outside never fires; a click on the
  // backdrop itself (not on a page) closes, as in Gmail. Only when the press started there too:
  // a text selection dragged off a page ends in a click on the backdrop, and mustn't close it.
  const isBackdrop = (t: EventTarget | null) => t === backdrop || t === pages;
  let pressedOnBackdrop = false;
  backdrop.addEventListener('pointerdown', (e) => { pressedOnBackdrop = isBackdrop(e.target); });
  backdrop.addEventListener('click', (e) => {
    if (pressedOnBackdrop && isBackdrop(e.target)) dialog.dispatchEvent(new CustomEvent('dialog:set', { detail: { open: false } }));
  });
}

async function load(backdrop: HTMLElement, pages: HTMLElement) {
  const { src, kind, filename = '' } = pages.dataset;
  if (!src) return;
  if (kind === 'image') {
    const img = document.createElement('img');
    img.src = src;
    img.alt = filename;
    img.className = `${PAGE_CLASS} max-w-full h-auto`;
    pages.replaceChildren(img);
    return;
  }
  if (kind !== 'pdf') return showMessage(pages, "This file can't be previewed. Open it in a new tab or download it.");

  showMessage(pages, 'Loading…');
  try {
    const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ url: src }).promise;
    const width = Math.min(MAX_PAGE_WIDTH, backdrop.clientWidth - 32);
    const ratio = window.devicePixelRatio || 1;
    pages.replaceChildren();
    // One page at a time, top down: the first page shows while the rest are still being drawn.
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      // Laid out in CSS pixels; the canvas alone is drawn at the screen's pixel ratio so it stays sharp.
      const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
      const sheet = document.createElement('div');
      sheet.className = `${PAGE_CLASS} relative overflow-hidden`;
      sheet.style.width = `${Math.floor(viewport.width)}px`;
      // What the text layer sizes and places its runs by (see src/styles/pdf-text-layer.css).
      sheet.style.setProperty('--total-scale-factor', String(viewport.scale * viewport.userUnit));

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.className = 'block h-auto w-full';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `${filename}, page ${n} of ${pdf.numPages}`);

      const text = document.createElement('div');
      text.className = 'textLayer';
      sheet.append(canvas, text);
      pages.append(sheet);

      await Promise.all([
        page.render({ canvas, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] }).promise,
        new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: text, viewport }).render(),
      ]);
      page.cleanup();
    }
  } catch (err) {
    console.error('document preview failed', err);
    showMessage(pages, "Couldn't display this file. Open it in a new tab or download it.");
  }
}

function showMessage(pages: HTMLElement, text: string) {
  const p = document.createElement('p');
  p.className = 'py-24 text-sm text-white/70';
  p.textContent = text;
  pages.replaceChildren(p);
}
