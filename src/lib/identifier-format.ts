// EIN and SSN formats: display on the admin page (server render and the reveal script), and the
// as-you-type mask on the signing page. Formatters take the nine digits as stored.

/** Digit groups, joined by dashes. */
export const EIN_GROUPS = [2, 7];
export const SSN_GROUPS = [3, 2, 4];

/** Up to the groups' total of digits, dashed between groups as far as they're filled ("123-4"). */
export function groupDigits(digits: string, groups: number[]): string {
  const parts: string[] = [];
  let at = 0;
  for (const size of groups) {
    if (at >= digits.length) break;
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  return parts.join('-');
}

export const formatEin = (d: string) => groupDigits(d, EIN_GROUPS);
export const formatSsn = (d: string) => groupDigits(d, SSN_GROUPS);

/**
 * Keep an input in the grouped format while it is typed in or pasted into: anything but digits is
 * dropped, digits past the groups' total are refused, dashes are put in as each group fills, and
 * the caret stays after the same digit it was after. Backspacing over a dash deletes the digit
 * before it rather than getting stuck on the dash the mask would put straight back.
 */
export function maskIdentifierInput(input: HTMLInputElement, groups: number[]): void {
  const max = groups.reduce((a, b) => a + b, 0);
  const digitsBefore = (s: string, caret: number) => s.slice(0, caret).replace(/\D/g, '').length;
  // The caret position just after the nth digit of the formatted value.
  const caretAfter = (formatted: string, n: number) => {
    if (n === 0) return 0;
    let seen = 0;
    for (let i = 0; i < formatted.length; i++) if (/\d/.test(formatted[i]) && ++seen === n) return i + 1;
    return formatted.length;
  };
  const apply = (raw: string, caret: number) => {
    const digits = raw.replace(/\D/g, '').slice(0, max);
    const formatted = groupDigits(digits, groups);
    const at = caretAfter(formatted, Math.min(digitsBefore(raw, caret), digits.length));
    input.value = formatted;
    input.setSelectionRange(at, at);
  };

  input.addEventListener('beforeinput', (e) => {
    const { selectionStart: start, selectionEnd: end, value } = input;
    if (start == null || end == null) return;
    // Refuse typing past the last digit (a replacement of selected digits is fine).
    if (e.inputType === 'insertText' && /\d/.test(e.data ?? '') && start === end && value.replace(/\D/g, '').length >= max) {
      e.preventDefault();
      return;
    }
    if (e.inputType === 'deleteContentBackward' && start === end && value[start - 1] === '-') {
      e.preventDefault();
      apply(value.slice(0, start - 2) + value.slice(start), start - 2);
    }
  });
  input.addEventListener('input', () => apply(input.value, input.selectionStart ?? input.value.length));
  // A pre-filled or browser-restored value gets the format too.
  if (input.value) apply(input.value, input.value.length);
}
