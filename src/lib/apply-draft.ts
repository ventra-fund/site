import { gateOnTurnstile, type TurnstileWidget } from './turnstile';
import { DRAFT_FIELDS, DRAFT_SAVE_DEBOUNCE_MS, DRAFT_SAVE_MAX_WAIT_MS, type DraftField } from './draft-config';

// Drop-off capture for the apply form: snapshots of what the visitor has typed, saved to
// /api/apply/draft so an application abandoned half way still reaches the team (see
// src/lib/server/drafts.ts). Nothing leaves the page until a Turnstile check passes: the first
// save with something in it spends one token on /api/apply/session, which hands back the draft id
// every later save uses.
//
// Tokens are single-use, and the upload and the submit each need one, so the mint only takes a
// token the widget already holds (never remounting a challenge that is still resolving), never
// while an upload is waiting on one, and re-gates the submit button straight after, exactly as a
// finished upload does.
//
// Capture is best effort and silent: no failure here is ever shown to the applicant or allowed
// to get in the way of submitting.

const SAVE_URL = '/api/apply/draft';
const SESSION_URL = '/api/apply/session';
/** Retry delay when the mint has to wait for a token or an upload. */
const RETRY_MS = 5_000;
const MAX_MINT_FAILURES = 2;

export interface DraftCaptureOptions {
  form: HTMLFormElement;
  widget: TurnstileWidget | null;
  /** Re-gated after the mint spends a token, like after an upload. */
  submitBtn: HTMLElement;
  onGateError: (message: string) => void;
  isUploaderBusy: () => boolean;
  attachments: () => { jobIds: string[]; documentIds: string[] };
  autofilled: () => string[];
}

export interface DraftCapture {
  /** Save soon; for changes made in code, which fire no input event. */
  scheduleSave: () => void;
  /** The id to send with the submission, once a session exists. */
  getDraftId: () => string | undefined;
  /** The application went through: stop capturing. */
  stop: () => void;
}

export function setupDraftCapture(opts: DraftCaptureOptions): DraftCapture {
  const { form, widget } = opts;
  let draftId: string | undefined;
  let stopped = false;
  let dirty = false;
  let firstDirtyAt: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight = false;
  let mintFailures = 0;
  /** The last save body the server took, so an unchanged snapshot isn't sent again. */
  let lastSent: string | undefined;

  function snapshot() {
    const data = new FormData(form);
    const fields: Partial<Record<DraftField, string>> = {};
    for (const name of DRAFT_FIELDS) {
      const value = String(data.get(name) ?? '').trim();
      if (value) fields[name] = value;
    }
    const { jobIds, documentIds } = opts.attachments();
    return { fields, autofilled: opts.autofilled(), jobIds, documentIds };
  }

  function markClean() {
    dirty = false;
    firstDirtyAt = undefined;
  }

  /** What a save would send now, or undefined when it's what the server already has. */
  function pendingBody(): string | undefined {
    const body = JSON.stringify({ draftId, ...snapshot() });
    return body === lastSent ? undefined : body;
  }

  function schedule(delay: number) {
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), delay);
  }

  function scheduleSave() {
    if (stopped) return;
    dirty = true;
    firstDirtyAt ??= Date.now();
    schedule(Math.max(0, Math.min(DRAFT_SAVE_DEBOUNCE_MS, firstDirtyAt + DRAFT_SAVE_MAX_WAIT_MS - Date.now())));
  }

  /** 'ok' with an id, 'later' when the moment is wrong, 'failed' when the server said no. */
  async function mint(): Promise<'ok' | 'later' | 'failed'> {
    if (!widget || opts.isUploaderBusy()) return 'later';
    const token = widget.consumeToken();
    if (!token) return 'later';
    gateOnTurnstile({ widget, button: opts.submitBtn, onError: opts.onGateError });
    const params = new URLSearchParams(location.search);
    const utm = { source: params.get('utm_source') ?? undefined, medium: params.get('utm_medium') ?? undefined, campaign: params.get('utm_campaign') ?? undefined };
    try {
      const res = await fetch(SESSION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, referrer: document.referrer || undefined, utm }),
      });
      if (!res.ok) return 'failed';
      const body = (await res.json()) as { draftId?: string | null };
      // Null means capture is off on this deployment (no database): stop asking.
      if (!body.draftId) { stop(); return 'failed'; }
      draftId = body.draftId;
      return 'ok';
    } catch {
      return 'failed';
    }
  }

  async function flush() {
    if (stopped || !dirty) return;
    if (inFlight) { schedule(RETRY_MS); return; }
    const snap = snapshot();
    // An empty form is not worth a session.
    if (!Object.keys(snap.fields).length) { markClean(); return; }

    inFlight = true;
    try {
      if (!draftId) {
        const minted = await mint();
        if (minted === 'later') { schedule(RETRY_MS); return; }
        if (minted === 'failed') {
          if (++mintFailures >= MAX_MINT_FAILURES) stop();
          else schedule(RETRY_MS);
          return;
        }
      }
      if (stopped) return;
      markClean();
      // Re-read after the mint's round trip so the save carries the latest values.
      const body = pendingBody();
      if (!body) return;
      const res = await fetch(SAVE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (res.ok) lastSent = body;
      else if (res.status === 410) stop();
    } catch {
      // Offline or similar: the next change schedules another try.
    } finally {
      inFlight = false;
    }
  }

  /** The page is going away or out of sight: send what's pending without waiting on a reply. */
  function flushOnHide() {
    if (stopped || !dirty || !draftId) return;
    clearTimeout(timer);
    markClean();
    const body = pendingBody();
    if (!body) return;
    lastSent = body;
    const sent = navigator.sendBeacon?.(SAVE_URL, new Blob([body], { type: 'application/json' }));
    if (!sent) fetch(SAVE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }
  const onVisibility = () => { if (document.visibilityState === 'hidden') flushOnHide(); };

  function stop() {
    stopped = true;
    clearTimeout(timer);
    form.removeEventListener('input', scheduleSave, true);
    form.removeEventListener('change', scheduleSave, true);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', flushOnHide);
  }

  // Capture phase, so a widget whose `change` doesn't bubble (the date picker's calendar) still counts.
  form.addEventListener('input', scheduleSave, true);
  form.addEventListener('change', scheduleSave, true);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', flushOnHide);

  return { scheduleSave, getDraftId: () => draftId, stop };
}
