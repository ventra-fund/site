// Live recalculation for /partner/calculator, with the same functions the server rendered the
// initial numbers from. The plan is the default one here; the real page injects the org's plan.
import { DEFAULT_COMMISSION_PLAN as plan, quote, formatMoney, type PaperGrade } from '@/data/commission-plan';

const form = document.querySelector<HTMLFormElement>('[data-calc]');
if (form) {
  const out = (key: string) => document.querySelector<HTMLElement>(`[data-out="${key}"]`);
  const pointsLabel = document.querySelector<HTMLElement>('[data-points-label]');
  const table = document.querySelector<HTMLElement>('[data-table]');

  // A deal page can hand an offer over in the query string.
  const params = new URLSearchParams(location.search);
  const preset = (name: string, value: string | null) => {
    if (value == null) return;
    const el = form.elements.namedItem(name);
    if (el instanceof RadioNodeList) el.value = value;
    else if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.value = value;
  };
  preset('amount', params.get('amount'));
  preset('grade', params.get('grade'));
  preset('points', params.get('points'));
  preset('term', params.get('term'));

  const read = () => {
    const fd = new FormData(form);
    const grade = (fd.get('grade') === 'C' ? 'C' : 'B') as PaperGrade;
    return {
      fundedAmount: Math.max(0, Number(fd.get('amount')) || 0),
      grade,
      upsellPoints: Number(fd.get('points')) || 0,
      termMonths: Math.max(1, Number(fd.get('term')) || 1),
      frequency: fd.get('frequency') === 'weekly' ? ('weekly' as const) : ('daily' as const),
    };
  };

  const render = () => {
    const input = read();
    const q = quote(plan, input);
    if (pointsLabel) pointsLabel.textContent = String(q.points);
    out('commission')!.textContent = formatMoney(q.commission);
    out('sellRate')!.textContent = q.sellRate.toFixed(2);
    out('payback')!.textContent = formatMoney(q.payback);
    out('buyRate')!.textContent = q.buyRate.toFixed(2);
    out('points')!.textContent = String(q.points);
    out('cost')!.textContent = formatMoney(q.payback - input.fundedAmount);
    out('payment')!.textContent = `${formatMoney(q.payment, true)} × ${q.periods}`;
    if (table) {
      table.innerHTML = '';
      for (let p = 0; p <= plan.maxUpsellPoints; p += 1) {
        const row = quote(plan, { ...input, upsellPoints: p });
        const tr = document.createElement('tr');
        tr.className = p === q.points ? 'bg-primary/5 font-medium' : '';
        tr.innerHTML = `<td class="py-1 pr-3 tabular-nums">${p}</td><td class="py-1 pr-3 text-right tabular-nums">${row.sellRate.toFixed(2)}</td><td class="py-1 pr-3 text-right tabular-nums">${formatMoney(row.payback)}</td><td class="py-1 text-right tabular-nums">${formatMoney(row.commission)}</td>`;
        table.append(tr);
      }
    }
  };
  form.addEventListener('input', render);
  render();
}
