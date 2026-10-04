import {
  ADDRESS_DEBOUNCE_MS,
  ADDRESS_OUTAGE_GRACE_MS,
  ADDRESS_OUTAGE_RETRY_MS,
  ADDRESS_QUERY_MIN,
  type AddressSuggestResponse,
  type AddressSuggestion,
} from './address-config';
import { isFullAddress, missingAddressParts } from './address-shape';

// The suggestions under an address input (src/components/AddressField.astro): as the visitor
// types, /api/address/suggest is asked and its matches are listed below the field; picking one
// puts that full address in the field.
//
// The address has to be a full one. Picking a suggestion is the main way: after a pick the
// visitor may still add a suite or unit, as long as the street and the "city, ST zip" of the pick
// are left standing. An address the provider doesn't know (new construction, rural routes) can be
// typed out instead, and is accepted when it has every part of a full address (address-shape.ts).
// Anything else ("WTC7") is invalid, the form won't submit, and the field says which parts are
// missing. The one way past is an outage:
// when lookups have been failing for ADDRESS_OUTAGE_GRACE_MS, what's typed is accepted, so a
// provider that is down can't stop applications.
//
// Validity is published through the input's custom validity, so src/lib/form.ts treats it like
// any other constraint. It is recomputed whenever it can be read: on every input event and just
// before the form's submit handler runs.
//
// Follows the ARIA combobox pattern with a listbox popup: focus never leaves the input, the
// arrow keys move `aria-activedescendant`, Enter picks, Escape closes.
//
// A pick fires an ordinary bubbling `input` event, so everything already listening to the field
// (drop-off capture, the "same as home" mirror, the pre-filled marker) sees it as typing.

const SUGGEST_URL = '/api/address/suggest';

/** "That address is missing the city, state and ZIP code. Add them, or choose a suggested address." */
function missingMessage(value: string): string {
  const parts = missingAddressParts(value);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
  return `That address is missing the ${list}. Add ${parts.length > 1 ? 'them' : 'it'}, or choose a suggested address.`;
}
/** While lookups are failing, before the outage has lasted long enough to accept what's typed. */
const MESSAGE_OUTAGE = 'Use a suggested address.';

const OPTION_CLASS =
  'group/option flex cursor-default flex-col rounded-sm px-2 py-1.5 text-sm font-normal select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground';
const OPTION_DETAIL_CLASS = 'text-xs text-muted-foreground group-data-highlighted/option:text-accent-foreground';

const normalize = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

// Every address picked on this page, in any field: "Same as home address" copies a picked home
// address into the business field, which never saw the pick itself.
const picks: AddressSuggestion[] = [];

/** Whether `value` is a picked address, give or take a suite or unit added after the street. */
function isPicked(value: string): boolean {
  const text = normalize(value);
  return picks.some((p) => text.startsWith(normalize(p.street)) && text.endsWith(normalize(`${p.city}, ${p.state} ${p.zip}`)));
}

// Lookups failing since this time (0: they work, as far as is known). Shared by the fields: the
// provider is down for all of them or none.
let downSince = 0;
const outageOver = () => downSince > 0 && Date.now() - downSince >= ADDRESS_OUTAGE_GRACE_MS;

export function setupAddressField(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('[data-address-input]');
  const list = root.querySelector<HTMLElement>('[data-address-list]');
  const status = root.querySelector<HTMLElement>('[data-address-status]');
  const error = root.querySelector<HTMLElement>('[data-address-error]');
  if (input && list && status && error) attach(input, list, status, error);
}

function attach(input: HTMLInputElement, list: HTMLElement, status: HTMLElement, error: HTMLElement) {
  let suggestions: AddressSuggestion[] = [];
  let highlighted = -1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let request: AbortController | undefined;
  /** Set while a pick writes to the input, so its own `input` event doesn't ask again. */
  let picking = false;

  const isOpen = () => !list.hidden;
  const optionId = (i: number) => `${list.id}-${i}`;

  /** Publish the field's state as its custom validity. An empty field is left to `required`. */
  function refreshValidity() {
    const value = input.value.trim();
    let message = '';
    if (value && !isPicked(value) && !isFullAddress(value) && !outageOver()) {
      message = downSince ? MESSAGE_OUTAGE : missingMessage(value);
    }
    input.setCustomValidity(message);
    // Once shown, the reason under the field follows the field's state and goes when it is valid.
    if (!message) error.hidden = true;
    else if (!error.hidden) error.textContent = message;
  }

  function close() {
    list.hidden = true;
    highlighted = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function cancelPending() {
    clearTimeout(timer);
    clearTimeout(retryTimer);
    request?.abort();
    request = undefined;
  }

  function highlight(index: number) {
    highlighted = index;
    [...list.children].forEach((el, i) => {
      el.toggleAttribute('data-highlighted', i === index);
      el.setAttribute('aria-selected', String(i === index));
    });
    if (index < 0) { input.removeAttribute('aria-activedescendant'); return; }
    input.setAttribute('aria-activedescendant', optionId(index));
    list.children[index]?.scrollIntoView({ block: 'nearest' });
  }

  function render() {
    list.replaceChildren(
      ...suggestions.map((s, i) => {
        const option = document.createElement('li');
        option.id = optionId(i);
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.className = OPTION_CLASS;
        option.dataset.index = String(i);
        const street = document.createElement('span');
        street.textContent = s.street;
        const detail = document.createElement('span');
        detail.className = OPTION_DETAIL_CLASS;
        detail.textContent = `${s.city}, ${s.state} ${s.zip}`;
        option.append(street, detail);
        return option;
      }),
    );
    highlighted = -1;
    input.removeAttribute('aria-activedescendant');
    if (!suggestions.length) { close(); status.textContent = ''; return; }
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    status.textContent = `${suggestions.length} address suggestion${suggestions.length === 1 ? '' : 's'}. Use the up and down arrow keys to choose one.`;
  }

  function pick(index: number) {
    const chosen = suggestions[index];
    if (!chosen) return;
    cancelPending();
    picks.push(chosen);
    picking = true;
    input.value = chosen.text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    picking = false;
    suggestions = [];
    close();
    list.replaceChildren();
    status.textContent = `${chosen.text} selected.`;
  }

  async function ask(query: string) {
    request?.abort();
    const mine = (request = new AbortController());
    let body: AddressSuggestResponse | undefined;
    try {
      const res = await fetch(`${SUGGEST_URL}?q=${encodeURIComponent(query)}`, { signal: mine.signal });
      if (res.ok) body = (await res.json()) as AddressSuggestResponse;
    } catch {
      // Superseded by a newer keystroke: not a failure. Anything else (offline) is one, below.
      if (mine.signal.aborted) return;
    }
    if (request !== mine) return;

    if (!body || body.degraded) {
      // The provider, our endpoint or the connection failed. Keep trying while the field still
      // needs an answer; once the outage has lasted long enough the field stops insisting.
      downSince ||= Date.now();
      suggestions = [];
      render();
      // No further once the outage has lasted long enough for the field to accept what's typed.
      if (!outageOver()) retryTimer = setTimeout(() => { if (input.value.trim() === query && !isPicked(query) && !isFullAddress(query)) void ask(query); }, ADDRESS_OUTAGE_RETRY_MS);
    } else {
      downSince = 0;
      suggestions = body.suggestions;
      // The list is only shown to someone still in the field.
      if (document.activeElement === input) render();
    }
    refreshValidity();
  }

  /** Look the current text up, unless it is already a picked address or too short to match. */
  function lookUp(delay: number) {
    cancelPending();
    const query = input.value.trim();
    if (query.length < ADDRESS_QUERY_MIN || input.readOnly || isPicked(query)) {
      suggestions = [];
      render();
      return;
    }
    timer = setTimeout(() => void ask(query), delay);
  }

  // Capture phase: validity is up to date before form.ts's own input listener reads it.
  input.addEventListener('input', () => {
    refreshValidity();
    if (!picking) lookUp(ADDRESS_DEBOUNCE_MS);
  }, true);

  // A value the field didn't get from a pick (pre-filled from a statement, or typed and left)
  // gets its suggestions as soon as the visitor comes back to it.
  input.addEventListener('focus', () => { if (!isOpen()) lookUp(0); });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!suggestions.length) return;
      e.preventDefault();
      if (!isOpen()) { list.hidden = false; input.setAttribute('aria-expanded', 'true'); }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      // From "nothing highlighted", down goes to the first and up to the last.
      const from = highlighted < 0 && step < 0 ? suggestions.length : highlighted;
      highlight((from + step + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      // Only when a suggestion is highlighted; otherwise Enter submits the form as usual.
      if (!isOpen() || highlighted < 0) return;
      e.preventDefault();
      pick(highlighted);
    } else if (e.key === 'Escape') {
      if (!isOpen()) return;
      e.preventDefault();
      close();
    }
  });

  // Leaving the field (Tab, a click elsewhere) drops the list. A lookup already under way is left
  // to finish: its answer still decides what the field's error says.
  input.addEventListener('blur', () => { clearTimeout(timer); close(); });

  // mousedown, not click: keeps focus in the input, so the blur above doesn't close the list first.
  list.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const option = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (option) pick(Number(option.dataset.index));
  });
  list.addEventListener('mousemove', (e) => {
    const option = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (option && Number(option.dataset.index) !== highlighted) highlight(Number(option.dataset.index));
  });

  // Values also arrive without an input event (statement pre-fill, the "same as home" mirror),
  // so validity is settled again right before the form's submit handler checks it (capture phase,
  // to run ahead of that handler). Once that handler has ringed the field, the reason is shown
  // under it: form.ts keeps its own copy of the message for screen readers only. Not shown while
  // typing, when the visitor simply hasn't picked yet.
  input.form?.addEventListener('submit', () => {
    refreshValidity();
    setTimeout(() => {
      if (!input.validity.customError || input.getAttribute('aria-invalid') !== 'true') return;
      error.textContent = input.validationMessage;
      error.hidden = false;
    });
  }, true);
}
