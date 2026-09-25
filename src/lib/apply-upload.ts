// Client side of the apply form's statement upload: the drop zone, the file list with each
// file's progress, the upload behind the Turnstile gate, and the polling that turns finished
// reads into pre-fill suggestions. Nothing is stored server-side between the upload check and
// the submit, so this module is also where the files live: it keeps the File objects and hands
// them (plus the reader's job ids) to the page for the final multipart POST. The page script
// keeps only what's specific to it (which fields the suggestions land in, how they're marked).
// Server code is never imported here: the limits come from the browser-safe upload-config module.

import { showMessage } from './form';
import {
  MAX_FILES_PER_UPLOAD,
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_FILE_BYTES,
  MAX_UPLOAD_TOTAL_BYTES,
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_TYPE_LABEL,
  fileExtension,
  formatMb,
  type ParseStatusResponse,
  type Suggestions,
  type UploadResult,
} from './upload-config';

export type { Suggestions };

/**
 * A file's journey. `queued`/`uploading` are the check request in flight; the rest are terminal
 * except `reading`, which the poll advances. Everything from `reading` on is a verified statement
 * that will be attached to the application.
 */
type EntryStatus = 'queued' | 'uploading' | 'reading' | 'done' | 'unreadable' | 'unavailable' | 'rejected' | 'failed';
const ATTACHED: ReadonlySet<EntryStatus> = new Set(['reading', 'done', 'unreadable', 'unavailable']);
const PENDING: ReadonlySet<EntryStatus> = new Set(['queued', 'uploading']);
const NOT_ATTACHED: ReadonlySet<EntryStatus> = new Set(['rejected', 'failed']);

interface Entry {
  file: File;
  status: EntryStatus;
  /** The reader's job id; null when the file was verified but the reader couldn't take it. */
  jobId?: string | null;
  /** Why it was rejected or failed, ready to print. */
  note?: string;
  months?: string[];
  /** When the reader took it (Date.now()), so each statement gets its own reading budget. */
  readingSince?: number;
}

export interface UploadOptions {
  dropzone: HTMLElement;
  input: HTMLInputElement;
  list: HTMLElement;
  errorEl: HTMLElement;
  /** Make sure the Turnstile gate has started; dropping a file fires none of the events that start it. */
  startGate: () => void;
  /** Resolves with a token once the widget has one, or undefined if it never does. */
  waitForToken: () => Promise<string | undefined>;
  /** An upload is in flight: the form must not submit meanwhile (the token is spoken for). */
  onUploadStart: () => void;
  /** The upload is over and its token is spent: re-gate so submit gets a fresh one. */
  onUploadEnd: () => void;
  onSuggestions: (s: Suggestions) => void;
  /** No statements are attached any more: whatever they pre-filled should go. */
  onCleared: () => void;
}

export interface StatementUploader {
  /** Every attached statement, for the submit: the files themselves and the reader's job ids. */
  attachments(): { files: File[]; jobIds: string[] };
  /** True while an upload request is in flight. */
  isBusy(): boolean;
}

const POLL_INTERVAL_MS = 6_000;
// Agentic extraction takes a few minutes per statement; past this the file stays attached and
// the visitor simply types what wasn't read.
const POLL_BUDGET_MS = 12 * 60 * 1000;

// Per-file reasons from /api/apply/upload (and the client pre-check), phrased to follow the filename.
const REASON_COPY: Record<string, string> = {
  too_large: `is over ${formatMb(MAX_UPLOAD_FILE_BYTES)}`,
  empty: 'is empty',
  unsupported_type: `isn't a ${UPLOAD_TYPE_LABEL}`,
  not_a_pdf: "isn't a valid PDF",
  truncated_pdf: 'looks truncated or corrupted',
  not_an_image: "isn't a valid image",
  not_a_bank_statement: "doesn't look like a bank statement, so it wasn't attached",
  read_failed: "couldn't be read just now. Please try it again in a moment",
};

// Whole-request failures from /api/apply/upload.
const ERROR_COPY: Record<string, string> = {
  too_many_requests: 'Too many uploads from your network in the last minute. Please wait a minute and try again.',
  verification_failed: 'The security check expired. Please remove the files and add them again.',
  not_configured: 'Statement uploads are unavailable right now. You can still submit the form without them.',
  too_large: `Those files are too large together; each upload can carry up to ${formatMb(MAX_UPLOAD_TOTAL_BYTES)}.`,
};
const GENERIC_ERROR = 'Upload failed. Please try again.';

const quoted = (name: string) => `“${name}”`;

export function setupStatementUpload(opts: UploadOptions): StatementUploader {
  const { dropzone, input, list, errorEl } = opts;
  const entries: Entry[] = [];
  let busy = false;
  // One poll loop at a time: `polling` covers the request in flight as well as the wait between.
  let polling = false;
  // Set when the attached set changes during a poll: that poll's suggestions describe the old
  // set, so the loop asks once more before it stops.
  let stale = false;

  const attached = () => entries.filter((e) => ATTACHED.has(e.status));
  const counted = () => entries.filter((e) => ATTACHED.has(e.status) || PENDING.has(e.status));
  const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size;
  /** Attached statements the reader has or is working on: what the status poll asks about. */
  const readable = () => attached().filter((e) => e.jobId && (e.status === 'reading' || e.status === 'done'));

  // ── Rendering ─────────────────────────────────────────────────────────────────────────────

  function statusCopy(e: Entry): { text: string; tone: 'busy' | 'ok' | 'bad' } {
    switch (e.status) {
      case 'queued':
      case 'uploading':
        return { text: 'Uploading…', tone: 'busy' };
      case 'reading':
        return { text: 'Attached · reading the statement…', tone: 'busy' };
      case 'done': {
        const n = e.months?.length ?? 0;
        return { text: n ? `Attached · read ${n} month${n === 1 ? '' : 's'}` : 'Attached · read', tone: 'ok' };
      }
      case 'unreadable':
        return { text: "Attached · couldn't be read, so nothing was pre-filled from it", tone: 'ok' };
      case 'unavailable':
        return { text: 'Attached · reading is unavailable right now', tone: 'ok' };
      case 'rejected':
      case 'failed':
        return { text: e.note ?? 'Not attached', tone: 'bad' };
    }
  }

  function render() {
    list.replaceChildren(
      ...entries.map((e, index) => {
        const { text, tone } = statusCopy(e);
        const li = document.createElement('li');
        li.className = 'flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm';

        const dot = document.createElement('span');
        dot.setAttribute('aria-hidden', 'true');
        dot.className =
          'size-2 shrink-0 rounded-full ' +
          (tone === 'busy' ? 'animate-pulse bg-primary' : tone === 'ok' ? 'bg-accent' : 'bg-destructive');

        const body = document.createElement('div');
        body.className = 'min-w-0 flex-1';
        const name = document.createElement('p');
        name.className = 'truncate font-medium';
        name.textContent = e.file.name;
        const status = document.createElement('p');
        status.className = tone === 'bad' ? 'text-xs text-destructive' : 'text-xs text-muted-foreground';
        status.textContent = text;
        body.append(name, status);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.remove = String(index);
        remove.className = 'shrink-0 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', `Remove ${e.file.name}`);
        remove.disabled = PENDING.has(e.status);

        li.append(dot, body, remove);
        return li;
      }),
    );
  }

  const showError = (message: string) => showMessage(errorEl, message);

  // ── Adding files ──────────────────────────────────────────────────────────────────────────

  // The pre-check mirrors the server gate (type, size, count, total) so an obviously-bad file
  // is refused instantly and never costs a round trip. Reports every problem in the pick at
  // once. The server re-checks everything, including the actual bytes.
  function addFiles(fileList: FileList | File[]) {
    errorEl.hidden = true;
    const problems: string[] = [];
    const accepted: File[] = [];
    let total = counted().reduce((sum, e) => sum + e.file.size, 0);
    let count = counted().length;

    for (const file of Array.from(fileList)) {
      if (!UPLOAD_ALLOWED_EXTENSIONS.has(fileExtension(file.name))) { problems.push(`${quoted(file.name)} ${REASON_COPY.unsupported_type}`); continue; }
      if (file.size === 0) { problems.push(`${quoted(file.name)} ${REASON_COPY.empty}`); continue; }
      if (file.size > MAX_UPLOAD_FILE_BYTES) { problems.push(`${quoted(file.name)} ${REASON_COPY.too_large}`); continue; }
      if (counted().some((e) => sameFile(e.file, file))) continue; // already in the list
      if (count >= MAX_UPLOAD_FILES) { problems.push(`${quoted(file.name)} would be more than ${MAX_UPLOAD_FILES} statements`); continue; }
      if (total + file.size > MAX_UPLOAD_TOTAL_BYTES) { problems.push(`${quoted(file.name)} would take the total over ${formatMb(MAX_UPLOAD_TOTAL_BYTES)}`); continue; }
      accepted.push(file);
      count++;
      total += file.size;
    }

    if (problems.length) {
      showError(`${problems.length === 1 ? "This file can't be added" : `${problems.length} files can't be added`}: ${problems.join('; ')}.`);
    }
    if (!accepted.length) return;
    for (const file of accepted) {
      // Trying a file again after it failed or was refused replaces its old row rather than adding one.
      const previous = entries.findIndex((e) => NOT_ATTACHED.has(e.status) && sameFile(e.file, file));
      if (previous >= 0) entries.splice(previous, 1);
      entries.push({ file, status: 'queued' });
    }
    render();
    void pump();
  }

  // ── Uploading ─────────────────────────────────────────────────────────────────────────────

  // One request at a time, of up to MAX_FILES_PER_UPLOAD files; the rest (and files picked
  // during an upload) wait for the next one, which gets its own security token.
  async function pump() {
    if (busy) return;
    const batch = entries.filter((e) => e.status === 'queued').slice(0, MAX_FILES_PER_UPLOAD);
    if (!batch.length) return;
    await uploadBatch(batch);
    void pump();
  }

  async function uploadBatch(batch: Entry[]) {
    busy = true;
    opts.onUploadStart();
    for (const e of batch) e.status = 'uploading';
    render();

    const fail = (note: string) => {
      for (const e of batch) { e.status = 'failed'; e.note = note; }
    };

    try {
      opts.startGate();
      const token = await opts.waitForToken();
      if (!token) {
        fail("The security check didn't complete. Please remove the file and add it again.");
        return;
      }

      const body = new FormData();
      body.append('token', token);
      for (const e of batch) body.append('files', e.file, e.file.name);

      const res = await fetch('/api/apply/upload', { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { error?: string; results?: UploadResult[] };
      if (!res.ok) {
        fail(ERROR_COPY[data.error ?? ''] ?? GENERIC_ERROR);
        return;
      }
      batch.forEach((e, i) => {
        const result = data.results?.[i];
        if (result && 'jobId' in result) {
          e.jobId = result.jobId;
          e.status = result.jobId ? 'reading' : 'unavailable';
          e.readingSince = Date.now();
        } else {
          e.status = 'rejected';
          const reason = result && 'reason' in result ? result.reason : '';
          e.note = `${quoted(e.file.name)} ${REASON_COPY[reason] ?? "couldn't be uploaded. Please try it again"}.`;
        }
      });
    } catch {
      fail(`${GENERIC_ERROR} Check your connection first.`);
    } finally {
      busy = false;
      // The token went with the request whether or not the server got to spend it.
      opts.onUploadEnd();
      render();
      startPolling();
    }
  }

  // ── Polling the reader ────────────────────────────────────────────────────────────────────

  function startPolling() {
    if (polling) { stale = true; return; }
    polling = true;
    void poll();
  }

  // One request over every statement that has been or is being read (not just the pending
  // ones, so the suggestions come back computed over the whole set; see parse-status.ts), then
  // another after an interval while any is still being read. Also the refresh after a removal:
  // the one request recomputes the suggestions over what's left.
  async function poll() {
    stale = false;
    const expired = attached().filter((e) => e.status === 'reading' && Date.now() - (e.readingSince ?? 0) > POLL_BUDGET_MS);
    if (expired.length) {
      for (const e of expired) e.status = 'unavailable';
      render();
    }
    const polled = readable();
    if (!polled.length) { polling = false; return; }

    try {
      const res = await fetch(`/api/apply/parse-status?jobs=${polled.map((e) => e.jobId).join(',')}`);
      if (res.ok) {
        const data = (await res.json()) as ParseStatusResponse;
        for (const d of data.documents) {
          const e = polled.find((p) => p.jobId === d.jobId);
          if (!e) continue;
          switch (d.status) {
            case 'done': e.status = 'done'; e.months = d.monthsCovered; break;
            case 'unreadable':
            case 'failed': e.status = 'unreadable'; break;
            // 'reading': unchanged.
          }
        }
        // Suggestions over a set that has since changed are dropped; the re-poll below brings the right ones.
        if (!stale && attached().length) opts.onSuggestions(data.suggestions);
        render();
      }
    } catch {
      // Network blip: the next poll tries again.
    }
    if (stale) void poll();
    else if (attached().some((e) => e.status === 'reading')) window.setTimeout(poll, POLL_INTERVAL_MS);
    else polling = false;
  }

  // ── Wiring ────────────────────────────────────────────────────────────────────────────────

  // The input's own click (the one `input.click()` dispatches) bubbles back here; don't loop on it.
  dropzone.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', () => {
    if (input.files) addFiles(input.files);
    input.value = '';
  });
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.dataset.dragging = 'true'; });
  dropzone.addEventListener('dragleave', () => { delete dropzone.dataset.dragging; });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    delete dropzone.dataset.dragging;
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  });

  list.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-remove]');
    if (!button || button.disabled) return;
    const index = Number(button.dataset.remove);
    if (!Number.isInteger(index) || !entries[index]) return;
    entries.splice(index, 1);
    errorEl.hidden = true;
    render();
    // The suggestions were computed over the old set; refresh them, or drop them if nothing is left.
    if (!attached().length) opts.onCleared();
    else startPolling();
  });

  return {
    attachments: () => ({
      files: attached().map((e) => e.file),
      jobIds: attached().flatMap((e) => (e.jobId ? [e.jobId] : [])),
    }),
    isBusy: () => busy,
  };
}
