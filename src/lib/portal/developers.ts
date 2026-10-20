// Developers page interactions for the prototype: the create-key flow with the one-time reveal,
// the webhook form, copy buttons. The real page calls Better Auth's api-key endpoints and the
// webhook-endpoint routes (src/data/openapi-v1.json).
const q = <T extends Element>(s: string) => document.querySelector<T>(s);

const keyForm = q<HTMLFormElement>('[data-key-form]');
const keyReveal = q<HTMLElement>('[data-key-reveal]');
const keyValue = q<HTMLElement>('[data-key-value]');
const keyRows = q<HTMLElement>('[data-key-rows]');

q('[data-key-create-open]')?.addEventListener('click', () => {
  if (!keyForm) return;
  keyForm.hidden = false;
  keyForm.querySelector('input')?.focus();
});
q('[data-key-cancel]')?.addEventListener('click', () => keyForm && (keyForm.hidden = true));
keyForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(keyForm);
  const name = String(fd.get('name') ?? '').trim();
  if (!name) return keyForm.querySelector('input')?.focus();
  const env = fd.get('environment') === 'test' ? 'test' : 'live';
  const key = `vf_${env}_${random(32)}`;
  keyForm.hidden = true;
  keyForm.reset();
  if (keyValue) keyValue.textContent = key;
  if (keyReveal) keyReveal.hidden = false;
  // The list only ever shows the prefix and last four.
  const tr = document.createElement('tr');
  tr.className = 'border-t border-border';
  tr.innerHTML = `<td class="py-2 pr-3"><p class="font-medium"></p><p class="text-xs text-muted-foreground">${env === 'test' ? 'Sandbox' : 'Live'}</p></td><td class="py-2 pr-3 font-mono text-xs">vf_${env}_…${key.slice(-4)}</td><td class="py-2 pr-3 text-xs text-muted-foreground">${fd.getAll('scopes').length} scopes</td><td class="py-2 pr-3 text-muted-foreground">Never</td><td class="py-2 pr-3 text-muted-foreground">Just now · you</td><td class="py-2 text-right text-xs text-muted-foreground">Rotate · Revoke</td>`;
  tr.querySelector('p')!.textContent = name;
  keyRows?.prepend(tr);
});
q('[data-key-done]')?.addEventListener('click', () => {
  if (keyReveal) keyReveal.hidden = true;
  if (keyValue) keyValue.textContent = '';
});
q('[data-key-copy]')?.addEventListener('click', () => copy(keyValue?.textContent ?? ''));

const webhookForm = q<HTMLFormElement>('[data-webhook-form]');
q('[data-webhook-open]')?.addEventListener('click', () => webhookForm && ((webhookForm.hidden = false), webhookForm.querySelector('input')?.focus()));
q('[data-webhook-cancel]')?.addEventListener('click', () => webhookForm && (webhookForm.hidden = true));
webhookForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  alert(`Prototype: the endpoint would be created and its signing secret shown once: whsec_${random(24)}`);
  webhookForm.hidden = true;
});
q('[data-webhook-test]')?.addEventListener('click', () => alert('Prototype: a submission.status_changed test event would be queued and show up under deliveries.'));

document.querySelectorAll<HTMLElement>('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(b.dataset.copy ?? '')));

function copy(text: string) {
  void navigator.clipboard?.writeText(text);
}
function random(n: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return [...bytes].map((b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
}
