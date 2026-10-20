// Client-side filtering for the prototype pipeline table. Stage buttons, the three selects and
// the search box all narrow the same rows. `?stage=` in the URL preselects a stage (the dashboard
// KPIs link that way).
const rows = [...document.querySelectorAll<HTMLElement>('[data-row]')];
const stageButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-stage]')];
const selects = [...document.querySelectorAll<HTMLSelectElement>('select[data-filter]')];
const search = document.querySelector<HTMLInputElement>('[data-search]');
const empty = document.querySelector<HTMLElement>('[data-empty]');

let stage = new URLSearchParams(location.search).get('stage') ?? '';

function apply() {
  const q = (search?.value ?? '').trim().toLowerCase();
  const filters = Object.fromEntries(selects.map((s) => [s.dataset.filter!, s.value]));
  let shown = 0;
  for (const row of rows) {
    const stageOk = stage === '' ? row.dataset.open === '1' : row.dataset.stage === stage;
    const ok =
      stageOk &&
      (!filters.status || row.dataset.status === filters.status) &&
      (!filters.submitter || row.dataset.submitter === filters.submitter) &&
      (!filters.source || row.dataset.source === filters.source) &&
      (!q || (row.dataset.text ?? '').includes(q));
    row.hidden = !ok;
    if (ok) shown++;
  }
  if (empty) empty.hidden = shown > 0;
  for (const b of stageButtons) b.setAttribute('aria-pressed', String((b.dataset.stage ?? '') === stage));
}

for (const b of stageButtons) {
  b.addEventListener('click', () => {
    stage = b.dataset.stage ?? '';
    // A status pick from another stage would hide everything; clear it when the stage changes.
    const status = selects.find((s) => s.dataset.filter === 'status');
    if (status) status.value = '';
    apply();
  });
}
for (const s of selects) s.addEventListener('change', apply);
search?.addEventListener('input', apply);
apply();
