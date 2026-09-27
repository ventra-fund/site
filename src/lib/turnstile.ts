const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const DEFAULT_APPEARANCE = 'interaction-only';
// Past this the script is treated as blocked, not slow: without it the gate below would sit on
// "Please complete the security check…" forever with nothing to complete.
const SCRIPT_LOAD_TIMEOUT_MS = 30_000;

let scriptPromise: Promise<void> | undefined;

/**
 * Loads the Turnstile script once, sharing one promise across every widget on the page. Rejects
 * when the script can't load (privacy extensions, corporate proxies and strict CSPs all block
 * challenges.cloudflare.com), so callers can tell the visitor instead of spinning silently.
 */
function loadScript(): Promise<void> {
  if ((window as any).turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    let poll = 0;
    let deadline = 0;
    const settle = () => { clearInterval(poll); clearTimeout(deadline); };
    const done = () => { settle(); resolve(); };
    const fail = () => {
      settle();
      // Let a later attempt (say, after the visitor disables a blocker) try again.
      scriptPromise = undefined;
      reject(new Error('Turnstile script failed to load'));
    };

    let script = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = TURNSTILE_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', fail, { once: true });
    // If the script's load event already fired before the listener was attached, catch up as soon
    // as window.turnstile is assigned.
    poll = window.setInterval(() => { if ((window as any).turnstile) done(); }, 100);
    deadline = window.setTimeout(fail, SCRIPT_LOAD_TIMEOUT_MS);
  });
  return scriptPromise;
}

export function preloadTurnstile(): void {
  loadScript().catch(() => {});
}

export class TurnstileWidget extends HTMLElement {
  private _id?: string;
  /** The last token handed out by `consumeToken`; a token is single-use, so it is never handed out twice. */
  private _spent?: string;

  connectedCallback() {
    // Remember the appearance the page asked for: the gate below flips to 'always' as a fallback
    // and needs to know what to go back to on the next attempt.
    this.dataset.baseAppearance ??= this.dataset.appearance ?? DEFAULT_APPEARANCE;
  }

  /** The appearance the page rendered the widget with (see Turnstile.astro). */
  get baseAppearance(): string {
    return this.dataset.baseAppearance ?? DEFAULT_APPEARANCE;
  }

  /** True once `turnstile.render` has actually run (as opposed to a mount still awaiting the script). */
  get isRendered(): boolean {
    return this._id != null;
  }

  /**
   * Render the widget, loading the script on first use. Resolves once rendered (or immediately if
   * already rendered; the earlier callback stays). Rejects only when the script can't load.
   */
  async mount(onVerified?: () => void): Promise<void> {
    await loadScript();
    if (this._id != null) return;
    this._id = (window as any).turnstile.render(this, {
      sitekey: this.dataset.sitekey,
      // Must match the `action` the matching API route checks; the component always sets it.
      action: this.dataset.action ?? 'contact',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      appearance: this.dataset.appearance ?? this.baseAppearance,
      size: this.dataset.size ?? 'normal',
      callback: onVerified,
    });
  }

  unmount() {
    if (this._id == null) return;
    (window as any).turnstile.remove(this._id);
    this._id = undefined;
  }

  /** The current token, unless it has already been consumed. */
  getToken(): string | undefined {
    if (this._id == null) return undefined;
    const token: string | undefined = (window as any).turnstile.getResponse(this._id) || undefined;
    return token === this._spent ? undefined : token;
  }

  /**
   * Take the current token for a request. The same token is never returned again, so two
   * requests on one page (the apply form's upload and its submit) can't both send it.
   */
  consumeToken(): string | undefined {
    const token = this.getToken();
    if (token) this._spent = token;
    return token;
  }

  reset() {
    if (this._id == null) return;
    (window as any).turnstile.reset(this._id);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('turnstile-widget')) {
  customElements.define('turnstile-widget', TurnstileWidget);
}

// ── Shared form choreography ──────────────────────────────────────────────────────────────
// The invisible-first-with-visible-fallback flow for any form gated on Turnstile. Kept here so a
// tweak to the timeout or fallback behaviour lands in one place.

type MaybeEl = HTMLElement | null;

export interface GateOptions {
  widget: TurnstileWidget;
  button: MaybeEl;
  /** Called with a visitor-facing message when the challenge script can't load at all. */
  onError?: (message: string) => void;
}

export const TURNSTILE_UNAVAILABLE_MESSAGE =
  "The security check couldn't load. If you use a content blocker, allow challenges.cloudflare.com and reload the page.";

/**
 * Mount `widget` and keep `button` disabled until it verifies. If the interaction-only challenge
 * hasn't resolved within 5s, switch to visible ('always') mode so the user can complete it by
 * hand. While pending, the button itself shows the "Checking security…" copy; its ready label comes
 * from `data-label` (falling back to its initial text) and is restored once verified.
 */
export function gateOnTurnstile(opts: GateOptions): void {
  const { widget, button, onError } = opts;
  const label = button ? (button.dataset.label ??= button.textContent?.trim() ?? '') : '';
  const setLabel = (text: string) => { if (button) button.textContent = text; };
  button?.setAttribute('disabled', '');
  setLabel('Checking security…');
  widget.unmount();
  widget.dataset.appearance = widget.baseAppearance;

  // Every path out of the gate funnels through one idempotent `ready`, whichever widget instance
  // (the invisible one or its visible replacement) ends up verifying. A callback from a widget
  // rendered before the fallback kicked in therefore still counts, and nothing can re-disable the
  // button or re-show the pending label once it's usable.
  let done = false;
  const stopTimers = () => { clearInterval(poll); clearTimeout(tid); };
  const ready = () => {
    if (done) return;
    done = true;
    stopTimers();
    // A locked button (see lockButton) stays disabled with its locked label; unlockButton
    // re-enables it later if a token is waiting by then.
    if (button?.dataset.locked !== undefined) { setLabel(button.dataset.locked); return; }
    button?.removeAttribute('disabled');
    setLabel(label);
  };
  const failed = () => {
    if (done) return;
    done = true;
    stopTimers();
    setLabel('Security check unavailable');
    onError?.(TURNSTILE_UNAVAILABLE_MESSAGE);
  };

  // Safety net: the interaction-only challenge can hand us a token without invoking the mount
  // callback, leaving "Checking security…" up even though the button is usable. Poll for a token
  // and finish as soon as one exists, so the label never lingers.
  const poll = setInterval(() => { if (widget.getToken()) ready(); }, 500);

  const tid = setTimeout(() => {
    if (done) return;
    // Past the interaction-only window the poll's silent-token case no longer applies; from here
    // we rely on the visible widget's callback. Stopping the poll also bounds it, so an abandoned
    // challenge can't leave it firing forever.
    clearInterval(poll);
    setLabel('Please complete the security check…');
    widget.dataset.appearance = 'always';
    if (widget.isRendered) {
      // Rendered invisibly and still unresolved: swap it for a visible one.
      widget.unmount();
      widget.mount(ready).catch(failed);
    }
    // Otherwise the first mount is still waiting on the script. It reads the appearance when it
    // renders, so it comes up visible on its own, and its callback is the same `ready`.
  }, 5000);

  widget.mount(ready).catch(failed);
}

/**
 * After a request spent the widget's token: gate `button` on a fresh one, or with no widget just
 * re-enable it. Either way a locked button (see lockButton) stays locked.
 */
export function releaseButton(button: HTMLElement, widget: TurnstileWidget | null, onError?: (message: string) => void): void {
  if (widget) gateOnTurnstile({ widget, button, onError });
  else if (button.dataset.locked === undefined) button.removeAttribute('disabled');
}

/**
 * Keep `button` disabled, showing `label`, whatever the gate does, until `unlockButton`. For a
 * reason to hold submit that has nothing to do with the security check (the apply form, after
 * it has been sent, until something changes).
 */
export function lockButton(button: HTMLElement, label: string): void {
  button.dataset.locked = label;
  button.setAttribute('disabled', '');
  button.textContent = label;
}

/**
 * Lift `lockButton`. The button comes back enabled straight away if a token is waiting;
 * otherwise a fresh gate runs and enables it once verified.
 */
export function unlockButton(button: HTMLElement, widget: TurnstileWidget | null, onError?: (message: string) => void): void {
  if (button.dataset.locked === undefined) return;
  delete button.dataset.locked;
  if (!widget || widget.getToken()) {
    button.removeAttribute('disabled');
    button.textContent = button.dataset.label ?? '';
  } else {
    gateOnTurnstile({ widget, button, onError });
  }
}

/**
 * `gateOnTurnstile`, but only once the user first touches the form. Until then nothing is fetched
 * from challenges.cloudflare.com, so the page's initial load carries no third-party script. Both
 * `focusin` (keyboard, and clicks into inputs/contenteditables) and `pointerdown` (Safari doesn't
 * focus buttons on click) count as touching; `pointerdown` also fires before `click`, so a
 * submit-first user still sees the button disable before it could submit.
 *
 * Returns the starter, for interactions that touch the form without either event: dropping a
 * file onto it fires neither, and the upload behind it needs a token.
 */
export function gateOnFirstInteraction(opts: GateOptions & { form: HTMLElement }): () => void {
  const { form, ...gate } = opts;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    form.removeEventListener('focusin', start);
    form.removeEventListener('pointerdown', start);
    gateOnTurnstile(gate);
  };
  form.addEventListener('focusin', start);
  form.addEventListener('pointerdown', start);
  return start;
}

/**
 * Resolve with the widget's token once it has one, polling until `timeoutMs` passes (undefined
 * then). For work that starts on its own, like an upload kicked off by picking files, where
 * there is no submit button to keep disabled until the gate opens: the interaction-only
 * challenge usually resolves within a second or two, and the visible fallback takes over after
 * five, so the wait is generous enough to include a visitor completing that by hand. The token
 * is consumed: one spent by a request still in flight (a submit) is waited past, not reused.
 */
export function waitForTurnstileToken(widget: TurnstileWidget, timeoutMs = 60_000): Promise<string | undefined> {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const token = widget.consumeToken();
      if (token) return resolve(token);
      if (Date.now() - started >= timeoutMs) return resolve(undefined);
      setTimeout(tick, 250);
    };
    tick();
  });
}

/**
 * Read the widget's current token. If none is present yet, silently remount so the next attempt
 * gets a fresh challenge, and return undefined. Callers treat undefined as "not ready".
 */
export function takeTurnstileToken(widget: TurnstileWidget): string | undefined {
  const token = widget.consumeToken();
  if (!token) {
    widget.unmount();
    widget.dataset.appearance = widget.baseAppearance;
    widget.mount().catch(() => {});
  }
  return token || undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'turnstile-widget': TurnstileWidget;
  }
}
