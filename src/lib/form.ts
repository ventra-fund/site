// Client-side helpers shared by the apply, contact and partner forms: validation feedback that
// works without the browser's tooltip, and the submit choreography around a Turnstile-gated
// JSON POST. Page scripts keep only what's specific to them (which fields go in the body, what
// happens on success).

import { gateOnTurnstile, takeTurnstileToken, type TurnstileWidget } from './turnstile';

export type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** The shape of a 400 `invalid_body` response from the API routes (see src/lib/server/http.ts). */
export interface FieldIssue {
  name: string;
  message: string;
}

const CONTROL_SELECTOR = 'input:not([type="hidden"]), textarea, select';
let hintCounter = 0;

function controls(form: HTMLFormElement): FormControl[] {
  return Array.from(form.querySelectorAll<FormControl>(CONTROL_SELECTOR));
}

/**
 * The visually-hidden message a control's `aria-describedby` points at. Sighted visitors get the
 * red ring plus the form-level alert; screen readers additionally hear the specific reason when
 * the control is focused. There's no reliable way to detect assistive tech client-side (browsers
 * hide it on purpose), so this is always present and costs nothing for everyone else.
 */
function hintFor(el: FormControl): HTMLElement {
  if (!el.id) el.id = `${el.name || 'field'}-${++hintCounter}`;
  const hintId = `${el.id}-error`;
  let hint = document.getElementById(hintId);
  if (!hint) {
    hint = document.createElement('span');
    hint.id = hintId;
    hint.className = 'sr-only';
    hint.dataset.fieldError = '';
    el.insertAdjacentElement('afterend', hint);
    const described = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    el.setAttribute('aria-describedby', [...described, hintId].join(' '));
  }
  return hint;
}

export function markInvalid(el: FormControl, message: string): void {
  // Tailwind's `aria-invalid:` variant matches `[aria-invalid="true"]` specifically, not just the
  // attribute's presence, so setAttribute here rather than toggleAttribute.
  el.setAttribute('aria-invalid', 'true');
  hintFor(el).textContent = message;
}

export function clearInvalid(el: FormControl): void {
  el.removeAttribute('aria-invalid');
  const hint = el.id && document.getElementById(`${el.id}-error`);
  if (hint) hint.textContent = '';
}

export function showMessage(el: HTMLElement, message: string): void {
  el.textContent = message;
  el.hidden = false;
}

/**
 * Turn off the browser's one-at-a-time validation tooltip (the red ring plus the alert below do
 * that job for everyone at once) and clear a control's ring live as soon as it becomes valid again.
 * Constraint checking itself (required/type/min/max/pattern/custom validity) still runs as before.
 */
export function setupValidation(form: HTMLFormElement): void {
  for (const el of controls(form)) {
    el.addEventListener('invalid', (e) => e.preventDefault());
    el.addEventListener('input', () => { if (el.checkValidity()) clearInvalid(el); });
  }
}

/**
 * Run constraint validation on every control. Invalid ones get the ring and their own
 * `validationMessage` as a hidden hint; `errorEl` announces a summary and focus moves to the first
 * problem, which is what the suppressed tooltip used to do for keyboard and screen-reader users.
 */
export function validateForm(form: HTMLFormElement, errorEl: HTMLElement): boolean {
  const invalid: FormControl[] = [];
  for (const el of controls(form)) {
    if (el.checkValidity()) clearInvalid(el);
    else { markInvalid(el, el.validationMessage); invalid.push(el); }
  }
  if (!invalid.length) return true;
  showMessage(errorEl, invalid.length === 1 ? 'Please fix the highlighted field.' : `Please fix the ${invalid.length} highlighted fields.`);
  invalid[0].focus();
  return false;
}

/** The visible control for a field name; a hidden input (e.g. DateField's) maps to its visible sibling. */
function controlFor(form: HTMLFormElement, name: string): FormControl | null {
  const el = form.elements.namedItem(name);
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return null;
  if (el instanceof HTMLInputElement && el.type === 'hidden') {
    return el.parentElement?.querySelector<FormControl>(CONTROL_SELECTOR) ?? null;
  }
  return el;
}

/** Surface a 400 `invalid_body` response on the fields the server named. */
export function markServerIssues(form: HTMLFormElement, issues: FieldIssue[], errorEl: HTMLElement): void {
  let first: FormControl | undefined;
  for (const issue of issues) {
    const el = controlFor(form, issue.name);
    if (!el) continue;
    markInvalid(el, issue.message);
    first ??= el;
  }
  const detail = issues.find((i) => !controlFor(form, i.name))?.message;
  showMessage(errorEl, first ? 'Please check the highlighted fields and try again.' : (detail ?? 'Please check your entries and try again.'));
  first?.focus();
}

export interface SubmitOptions {
  form: HTMLFormElement;
  widget: TurnstileWidget | null;
  button: HTMLButtonElement;
  errorEl: HTMLElement;
  successEl: HTMLElement;
  url: string;
  /** Everything but the Turnstile token, which is added here. */
  body: () => Record<string, unknown>;
  onSuccess?: () => void;
}

/**
 * POST the form as JSON behind the Turnstile gate: take the token, disable the button, send, show
 * the outcome, then re-gate for the next attempt (a token is single-use). Server-side validation
 * failures are mapped back onto the fields they name.
 */
export async function submitJson(opts: SubmitOptions): Promise<void> {
  const { form, widget, button, errorEl, successEl, url, body, onSuccess } = opts;
  const showError = (msg: string) => showMessage(errorEl, msg);

  const token = widget ? takeTurnstileToken(widget) : undefined;
  if (!token) { showError('Please complete the security check and try again.'); return; }

  button.disabled = true;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body(), token }),
    });
    if (res.ok) {
      onSuccess?.();
      successEl.hidden = false;
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: FieldIssue[] };
    if (data.error === 'invalid_body' && data.fields?.length) markServerIssues(form, data.fields, errorEl);
    else if (data.error === 'invalid_message') showError('Please check your message and try again.');
    else if (data.error === 'verification_failed') showError('The security check expired. Please try again.');
    else if (data.error === 'too_many_requests') showError("Too many submissions from your network in the last minute, so this one wasn't sent. Please wait a minute and try again. If you're on a shared office connection, someone else may have just submitted a form.");
    else showError('Something went wrong. Please try again.');
  } catch {
    showError('Something went wrong. Please check your connection and try again.');
  } finally {
    // A Turnstile token is single-use: get a fresh one before the next attempt.
    if (widget) gateOnTurnstile({ widget, button, onError: showError });
    else button.disabled = false;
  }
}
