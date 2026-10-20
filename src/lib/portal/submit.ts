// The full submission form: step navigation, owner and position repeaters, per-section file
// pickers, a localStorage draft, and the review summary. Prototype: submit shows an alert and
// goes to a fixture deal. The real submit is one multipart POST per file to
// /api/partner/deals/<id>/files, then the JSON submit, like /api/apply.
import { listPickedFiles, type PickedFile } from './files';
import { maskIdentifierInput, EIN_GROUPS, SSN_GROUPS } from '@/lib/identifier-format';
import type { FileKind } from '@/data/portal-fixtures';

const DRAFT_KEY = 'vf-partner-submit-draft';
const form = document.querySelector<HTMLFormElement>('[data-submit-form]');
if (form) setup(form);

function setup(form: HTMLFormElement) {
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const tabs = [...document.querySelectorAll<HTMLElement>('[data-step-tab]')];
  const prev = form.querySelector<HTMLButtonElement>('[data-prev]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const errorEl = form.querySelector<HTMLElement>('[data-form-error]')!;
  const draftStatus = form.querySelector<HTMLElement>('[data-draft-status]')!;
  const draftNote = form.querySelector<HTMLElement>('[data-draft-note]')!;
  let at = 0;
  const pickers = new Map<FileKind, { files: () => PickedFile[] }>();

  // ── Steps ──
  const show = (i: number) => {
    at = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, j) => (s.hidden = j !== at));
    tabs.forEach((t, j) => {
      t.toggleAttribute('data-done', j < at);
      t.querySelector('[data-step-num]')?.toggleAttribute('data-done', j < at);
      if (j === at) t.setAttribute('aria-current', 'step');
      else t.removeAttribute('aria-current');
    });
    prev.hidden = at === 0;
    next.hidden = at === steps.length - 1;
    submit.hidden = at !== steps.length - 1;
    errorEl.hidden = true;
    if (steps[at].dataset.step === 'review') renderReview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const valid = (section: HTMLElement) => {
    const controls = [...section.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')];
    const bad = controls.find((c) => !c.disabled && !c.checkValidity());
    if (bad) {
      bad.focus();
      errorEl.textContent = bad.validationMessage || 'Please complete the highlighted field.';
      errorEl.hidden = false;
      return false;
    }
    if (section.dataset.step === 'owners') {
      const total = [...section.querySelectorAll<HTMLInputElement>('input[name$=".percent"]')].reduce((s, i) => s + Number(i.value || 0), 0);
      if (total < 51) {
        errorEl.textContent = `Owners listed hold ${total}%. Add owners until at least 51% is covered.`;
        errorEl.hidden = false;
        return false;
      }
    }
    if (section.dataset.step === 'documents') {
      const have = (k: FileKind) => (pickers.get(k)?.files() ?? []).some((f) => f.ok);
      if (!have('application') || !have('bank_statement')) {
        errorEl.textContent = 'Add the signed application and bank statements. Everything else can follow from the deal page.';
        errorEl.hidden = false;
        return false;
      }
    }
    return true;
  };
  next.addEventListener('click', () => valid(steps[at]) && show(at + 1));
  prev.addEventListener('click', () => show(at - 1));
  tabs.forEach((t, i) => t.addEventListener('click', () => i < at && show(i)));

  // ── Repeaters ──
  const owners = form.querySelector<HTMLElement>('[data-owners]')!;
  form.querySelector('[data-add-owner]')?.addEventListener('click', () => {
    const n = owners.querySelectorAll('[data-owner]').length;
    const clone = owners.querySelector<HTMLElement>('[data-owner]')!.cloneNode(true) as HTMLElement;
    clone.querySelector('legend')!.textContent = `Owner ${n + 1}`;
    clone.querySelectorAll<HTMLInputElement>('input, select').forEach((c) => {
      c.name = c.name.replace(/\[\d+\]/, `[${n}]`);
      if (c.id) c.id = c.id.replace(/\[\d+\]/, `[${n}]`);
      c.value = '';
    });
    clone.querySelectorAll('label[for]').forEach((l) => l.setAttribute('for', l.getAttribute('for')!.replace(/\[\d+\]/, `[${n}]`)));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'text-xs text-muted-foreground hover:text-foreground sm:col-span-2 justify-self-end';
    remove.textContent = 'Remove this owner';
    remove.addEventListener('click', () => clone.remove());
    clone.append(remove);
    owners.append(clone);
    clone.querySelectorAll<HTMLInputElement>('[data-mask="ssn"]').forEach((i) => maskIdentifierInput(i, SSN_GROUPS));
  });
  const positions = form.querySelector<HTMLElement>('[data-positions]')!;
  form.querySelector('[data-add-position]')?.addEventListener('click', () => addPosition());
  function addPosition(values: Partial<Record<'funder' | 'balance' | 'payment', string>> = {}) {
    const n = positions.children.length;
    const row = document.createElement('div');
    row.className = 'grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]';
    row.innerHTML = `
      <input name="position[${n}].funder" required placeholder="Funder" class="h-9 border border-input bg-background px-2 text-sm" />
      <input name="position[${n}].balance" type="number" inputmode="numeric" min="0" step="100" required placeholder="Balance $" class="h-9 border border-input bg-background px-2 text-sm" />
      <input name="position[${n}].payment" type="number" inputmode="numeric" min="0" step="10" placeholder="Payment $" class="h-9 border border-input bg-background px-2 text-sm" />
      <button type="button" class="text-xs text-muted-foreground hover:text-foreground" data-remove>Remove</button>`;
    row.querySelector<HTMLInputElement>('[name$=".funder"]')!.value = values.funder ?? '';
    row.querySelector<HTMLInputElement>('[name$=".balance"]')!.value = values.balance ?? '';
    row.querySelector<HTMLInputElement>('[name$=".payment"]')!.value = values.payment ?? '';
    row.querySelector('[data-remove]')!.addEventListener('click', () => row.remove());
    positions.append(row);
  }

  // ── Masks and file pickers ──
  form.querySelectorAll<HTMLInputElement>('[data-mask="ein"]').forEach((i) => maskIdentifierInput(i, EIN_GROUPS));
  form.querySelectorAll<HTMLInputElement>('[data-mask="ssn"]').forEach((i) => maskIdentifierInput(i, SSN_GROUPS));
  for (const section of form.querySelectorAll<HTMLElement>('[data-doc-section]')) {
    const kind = section.dataset.docSection as FileKind;
    const count = section.querySelector<HTMLElement>('[data-doc-count]')!;
    pickers.set(
      kind,
      listPickedFiles({
        dropzone: section.querySelector('[data-upload-dropzone]')!,
        input: section.querySelector('[data-upload-input]')!,
        list: section.querySelector('[data-file-list]')!,
        kindOf: () => kind,
        onChange: (files) => (count.textContent = files.length ? `${files.filter((f) => f.ok).length} ready` : ''),
      }),
    );
  }

  // ── Draft (fields only; files can't be kept across a reload) ──
  const fields = () => [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input:not([type=file]):not([type=checkbox]), select, textarea')];
  const save = () => {
    const data: Record<string, string> = {};
    for (const f of fields()) if (f.name && f.value && !/ssn/.test(f.name)) data[f.name] = f.value;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ at, data }));
      draftStatus.textContent = 'Draft saved';
    } catch {
      /* storage blocked: nothing to save to */
    }
  };
  let timer: number | undefined;
  form.addEventListener('input', () => {
    draftStatus.textContent = 'Saving…';
    clearTimeout(timer);
    timer = window.setTimeout(save, 800);
  });
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const { at: savedAt, data } = JSON.parse(raw) as { at: number; data: Record<string, string> };
      const positionsSaved = new Set(Object.keys(data).filter((k) => k.startsWith('position[')).map((k) => k.slice(9, k.indexOf(']'))));
      for (const i of positionsSaved) addPosition({ funder: data[`position[${i}].funder`], balance: data[`position[${i}].balance`], payment: data[`position[${i}].payment`] });
      for (const f of fields()) if (f.name in data) f.value = data[f.name];
      draftNote.hidden = false;
      show(Math.min(savedAt, 2));
    } else show(0);
  } catch {
    show(0);
  }
  form.querySelector('[data-draft-clear]')?.addEventListener('click', () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    location.reload();
  });

  // ── Review ──
  function renderReview() {
    const dl = form.querySelector<HTMLElement>('[data-review]')!;
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? '').trim();
    const ownerCount = owners.querySelectorAll('[data-owner]').length;
    const rows: [string, string][] = [
      ['Legal name', get('legalName')],
      ['DBA', get('dba') || '—'],
      ['EIN', get('ein').replace(/\d(?=\d{4})/g, '•')],
      ['Entity', get('entityType')],
      ['Address', get('businessAddress')],
      ['Owners', Array.from({ length: ownerCount }, (_, i) => `${get(`owner[${i}].firstName`)} ${get(`owner[${i}].lastName`)} (${get(`owner[${i}].percent`)}%)`).join(', ')],
      ['Product', get('product')],
      ['Requested', get('amountRequested') ? `$${Number(get('amountRequested')).toLocaleString()}` : '—'],
      ['Monthly revenue', get('monthlyRevenue') ? `$${Number(get('monthlyRevenue')).toLocaleString()}` : '—'],
      ['Open positions', String(positions.children.length)],
      ['Documents', [...pickers.entries()].map(([k, p]) => `${p.files().filter((f) => f.ok).length} ${k.replace('_', ' ')}`).join(' · ')],
    ];
    dl.innerHTML = '';
    for (const [k, v] of rows) {
      const dt = document.createElement('dt');
      dt.className = 'text-muted-foreground';
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.className = 'sm:text-right';
      dd.textContent = v || '—';
      dl.append(dt, dd);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.querySelector<HTMLInputElement>('[name=consent]')?.checked) {
      errorEl.textContent = 'Please confirm the authorisation.';
      errorEl.hidden = false;
      return;
    }
    const files = [...pickers.values()].flatMap((p) => p.files()).filter((f) => f.ok).length;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    alert(`Prototype: ${files} file(s) would be uploaded one at a time, the deal created as "Received" and the package emailed to underwriting.`);
    location.assign('/partner/deals/VF-10241');
  });
}
