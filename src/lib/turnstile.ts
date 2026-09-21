const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).turnstile) { resolve(); return; }
    const existing = document.querySelector(`script[src="${TURNSTILE_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
    } else {
      const s = document.createElement('script');
      s.src = TURNSTILE_SRC;
      s.addEventListener('load', () => resolve(), { once: true });
      document.head.appendChild(s);
    }
    // Poll fallback: if the script's load event already fired before the
    // listener was attached, resolve as soon as window.turnstile is assigned.
    const id = setInterval(() => {
      if ((window as any).turnstile) { clearInterval(id); resolve(); }
    }, 100);
  });
}

export function preloadTurnstile(): void {
  loadScript();
}

export class TurnstileWidget extends HTMLElement {
  private _id?: string;

  async mount(onVerified?: () => void) {
    await loadScript();
    if (this._id != null) return;
    this._id = (window as any).turnstile.render(this, {
      sitekey: this.dataset.sitekey,
      action: this.dataset.action ?? 'turnstile-spin-v1',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      appearance: this.dataset.appearance ?? 'interaction-only',
      size: this.dataset.size ?? 'normal',
      callback: onVerified,
    });
  }

  unmount() {
    if (this._id == null) return;
    (window as any).turnstile.remove(this._id);
    this._id = undefined;
  }

  getToken(): string | undefined {
    if (this._id == null) return undefined;
    return (window as any).turnstile.getResponse(this._id) || undefined;
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

/**
 * Mount `widget` and keep `button` disabled until it verifies. If the interaction-only challenge
 * hasn't resolved within 5s, remount it in visible ('always') mode so the user can complete it by
 * hand. While pending, the button itself shows the "Checking security…" copy; its ready label comes
 * from `data-label` (falling back to its initial text) and is restored once verified.
 */
export function gateOnTurnstile(opts: { widget: TurnstileWidget; button: MaybeEl }): void {
  const { widget, button } = opts;
  const label = button ? (button.dataset.label ??= button.textContent?.trim() ?? '') : '';
  const setLabel = (text: string) => { if (button) button.textContent = text; };
  button?.setAttribute('disabled', '');
  setLabel('Checking security…');
  widget.unmount();
  delete widget.dataset.appearance;

  // Idempotent: enabling the button and clearing the "Checking security…" label happen together
  // and exactly once, so a late timeout callback can never re-show the label after we're ready.
  let done = false;
  const ready = () => {
    if (done) return;
    done = true;
    clearInterval(poll);
    button?.removeAttribute('disabled');
    setLabel(label);
  };

  // Safety net: the interaction-only challenge can hand us a token without
  // invoking the mount callback, leaving "Checking security…" up even though the button is
  // usable. Poll for a token and finish as soon as one exists, so the label never lingers.
  const poll = setInterval(() => { if (widget.getToken()) ready(); }, 500);

  let timedOut = false;
  const tid = setTimeout(() => {
    if (done) return;
    // Past the interaction-only window the poll's silent-token case no longer applies: we
    // remount visibly below and rely on that widget's `mount(ready)` callback. Stopping the
    // poll here also bounds it, so an abandoned challenge can't leave it firing forever.
    clearInterval(poll);
    timedOut = true;
    setLabel('Please complete the security check…');
    widget.unmount();
    widget.dataset.appearance = 'always';
    widget.mount(ready);
  }, 5000);

  widget.mount(() => {
    clearTimeout(tid);
    if (!timedOut) ready();
  });
}

/**
 * Read the widget's current token. If none is present yet, silently reset + remount so the next
 * attempt gets a fresh challenge, and return undefined. Callers treat undefined as "not ready".
 */
export function takeTurnstileToken(widget: TurnstileWidget): string | undefined {
  const token = widget.getToken();
  if (!token) {
    widget.reset();
    widget.unmount();
    delete widget.dataset.appearance;
    widget.mount();
  }
  return token || undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'turnstile-widget': TurnstileWidget;
  }
}
