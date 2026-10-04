import { ADDRESS_DEBOUNCE_MS, ADDRESS_QUERY_MIN, type AddressSuggestResponse, type AddressSuggestion } from './address-config';

// The suggestions under an address input (src/components/AddressField.astro): as the visitor
// types, /api/address/suggest is asked and its matches are listed below the field; picking one
// puts that address in the field. The field stays an ordinary text input throughout: what's typed
// is kept whether or not anything is picked, and when suggestions can't be had (no key, quota,
// offline) nothing shows and nothing is in the way.
//
// Follows the ARIA combobox pattern with a listbox popup: focus never leaves the input, the
// arrow keys move `aria-activedescendant`, Enter picks, Escape closes.
//
// A pick fires an ordinary bubbling `input` event, so everything already listening to the field
// (drop-off capture, the "same as home" mirror, the pre-filled marker) sees it as typing.

const SUGGEST_URL = '/api/address/suggest';
/** After the endpoint answers 429, how long this field stops asking. */
const BACKOFF_MS = 30_000;

const OPTION_CLASS =
  'group/option flex cursor-default flex-col rounded-sm px-2 py-1.5 text-sm font-normal select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground';
const OPTION_DETAIL_CLASS = 'text-xs text-muted-foreground group-data-highlighted/option:text-accent-foreground';

export function setupAddressField(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('[data-address-input]');
  const list = root.querySelector<HTMLElement>('[data-address-list]');
  const status = root.querySelector<HTMLElement>('[data-address-status]');
  if (input && list && status) attach(input, list, status);
}

function attach(input: HTMLInputElement, list: HTMLElement, status: HTMLElement) {
  let suggestions: AddressSuggestion[] = [];
  let highlighted = -1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request: AbortController | undefined;
  let pausedUntil = 0;
  /** Set while a pick writes to the input, so its own `input` event doesn't ask again. */
  let picking = false;

  const isOpen = () => !list.hidden;
  const optionId = (i: number) => `${list.id}-${i}`;

  function close() {
    list.hidden = true;
    highlighted = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function cancelPending() {
    clearTimeout(timer);
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
        detail.textContent = `${s.city}, ${[s.state, s.zip].filter(Boolean).join(' ')}`;
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
    try {
      const res = await fetch(`${SUGGEST_URL}?q=${encodeURIComponent(query)}`, { signal: mine.signal });
      if (res.status === 429) pausedUntil = Date.now() + BACKOFF_MS;
      const body = res.ok ? ((await res.json()) as AddressSuggestResponse) : { suggestions: [] };
      // A newer keystroke has taken over, or the visitor has moved on.
      if (request !== mine || document.activeElement !== input) return;
      suggestions = body.suggestions;
      render();
    } catch {
      // Aborted or offline: the field carries on as plain text.
      if (request === mine) { suggestions = []; render(); }
    }
  }

  input.addEventListener('input', () => {
    if (picking) return;
    cancelPending();
    const query = input.value.trim();
    if (query.length < ADDRESS_QUERY_MIN || input.readOnly || Date.now() < pausedUntil) {
      suggestions = [];
      render();
      return;
    }
    timer = setTimeout(() => void ask(query), ADDRESS_DEBOUNCE_MS);
  });

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

  // Leaving the field (Tab, a click elsewhere) keeps what was typed and drops the list.
  input.addEventListener('blur', () => { cancelPending(); close(); });

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
}
