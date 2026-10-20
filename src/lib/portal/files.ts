// Shared file picking for the prototype's upload areas. Checks what the server will check
// (extension and size from src/lib/upload-config.ts, the PDF/JPG/PNG signature from
// content-sniff.ts) so a bad file is refused before it would ever be sent, and lists the rest.
import { UPLOAD_ALLOWED_EXTENSIONS, MAX_UPLOAD_FILE_BYTES, UPLOAD_TYPE_LABEL, fileExtension, formatMb } from '@/lib/upload-config';
import { sniffFile } from '@/lib/server/doc-extract/content-sniff';
import type { FileKind } from '@/data/portal-fixtures';

export interface PickedFile {
  file: File;
  kind: FileKind;
  ok: boolean;
  reason?: string;
}

interface Options {
  dropzone: HTMLElement;
  input: HTMLInputElement;
  /** Where rows are appended. */
  list: HTMLElement;
  /** How to classify a new file (the submit form asks per section; the deal page says "other"). */
  kindOf: (file: File) => FileKind;
  onChange?: (files: PickedFile[]) => void;
}

const REASONS: Record<string, string> = {
  empty: 'This file is empty.',
  not_a_pdf: "This isn't a PDF.",
  truncated_pdf: 'This PDF looks cut off. Download it again.',
  not_an_image: "This isn't a JPG or PNG.",
  unsupported_type: `Only ${UPLOAD_TYPE_LABEL} files.`,
  too_large: `Over ${formatMb(MAX_UPLOAD_FILE_BYTES)}.`,
};

export function listPickedFiles(opts: Options): { files: () => PickedFile[] } {
  const picked: PickedFile[] = [];
  const seen = new Set<string>();

  const render = () => {
    for (const row of opts.list.querySelectorAll('[data-picked]')) row.remove();
    for (const [i, p] of picked.entries()) {
      const li = document.createElement('li');
      li.dataset.picked = String(i);
      li.className = 'flex items-center gap-3 py-2 text-sm';
      li.innerHTML = `
        <span class="size-4 shrink-0 ${p.ok ? 'text-emerald-600' : 'text-destructive'}" aria-hidden="true">${p.ok ? '✓' : '!'}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium"></p>
          <p class="text-xs text-muted-foreground"></p>
        </div>
        <button type="button" class="text-xs text-muted-foreground hover:text-foreground" data-remove>Remove</button>`;
      li.querySelector('p')!.textContent = p.file.name;
      li.querySelectorAll('p')[1]!.textContent = p.ok ? `${labelFor(p.kind)} · ${(p.file.size / 1e6).toFixed(1)} MB · ready to upload` : p.reason ?? '';
      li.querySelector('[data-remove]')!.addEventListener('click', () => {
        picked.splice(i, 1);
        render();
      });
      opts.list.append(li);
    }
    opts.onChange?.(picked);
  };

  const add = async (files: FileList | File[]) => {
    for (const file of files) {
      // The same bytes twice in one pick (an ISO dragging a folder in) is skipped, as the server
      // skips a duplicate by etag.
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const kind = opts.kindOf(file);
      if (!UPLOAD_ALLOWED_EXTENSIONS.has(fileExtension(file.name))) picked.push({ file, kind, ok: false, reason: REASONS.unsupported_type });
      else if (file.size > MAX_UPLOAD_FILE_BYTES) picked.push({ file, kind, ok: false, reason: REASONS.too_large });
      else {
        const sniff = await sniffFile(file);
        picked.push(sniff.ok ? { file, kind, ok: true } : { file, kind, ok: false, reason: REASONS[sniff.reason] ?? 'Could not read this file.' });
      }
    }
    render();
  };

  opts.input.addEventListener('change', () => {
    if (opts.input.files) void add(opts.input.files);
    opts.input.value = '';
  });
  opts.dropzone.addEventListener('click', () => opts.input.click());
  opts.dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      opts.input.click();
    }
  });
  opts.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    opts.dropzone.dataset.dragging = '';
  });
  opts.dropzone.addEventListener('dragleave', () => delete opts.dropzone.dataset.dragging);
  opts.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    delete opts.dropzone.dataset.dragging;
    if (e.dataTransfer?.files) void add(e.dataTransfer.files);
  });

  return { files: () => picked };
}

function labelFor(kind: FileKind): string {
  return { application: 'Signed application', bank_statement: 'Bank statement', id: 'Owner ID', voided_check: 'Voided check', processing: 'Processing statement', other: 'Document' }[kind];
}
