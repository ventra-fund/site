// Deal page interactions for the prototype: reveal the dropzone, list picked files with the same
// client-side checks the apply form uses, and stub the forms. Nothing leaves the browser.
import { listPickedFiles } from './files';

const dropzone = document.querySelector<HTMLElement>('[data-upload-dropzone]');
const input = document.querySelector<HTMLInputElement>('[data-upload-input]');
const list = document.querySelector<HTMLElement>('[data-file-list]');

for (const trigger of document.querySelectorAll<HTMLElement>('[data-upload-trigger]')) {
  trigger.addEventListener('click', () => {
    if (!dropzone) return;
    dropzone.hidden = false;
    dropzone.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    input?.click();
  });
}
if (dropzone && input && list) listPickedFiles({ dropzone, input, list, kindOf: () => 'other' });

// Deep links from the pipeline (#files, #offers) open the dropzone when the deal is waiting on docs.
if (location.hash === '#files' && dropzone && document.querySelector('[data-stip]')) dropzone.hidden = false;

const stub = (selector: string, message: string) =>
  document.querySelector<HTMLFormElement>(selector)?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert(message);
  });
stub('[data-details-form]', 'Prototype: the details would be saved and the deal sent to review.');
stub('[data-note-form]', 'Prototype: the note would be added to the timeline.');
document.querySelector('[data-withdraw]')?.addEventListener('click', () => {
  if (confirm('Withdraw this deal? Underwriting stops work and the merchant is released after 90 days.')) alert('Prototype: the deal would be marked withdrawn.');
});
