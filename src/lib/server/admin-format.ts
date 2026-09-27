// Display helpers shared by the admin pages.

/** Unix seconds as "Sep 26, 2026, 14:05 UTC". */
export const formatTime = (seconds: number | null | undefined) =>
  seconds == null
    ? '—'
    : `${new Date(seconds * 1000).toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} UTC`;

export const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '—');

/** "Jane Doe" from whichever name parts are known ('' when neither is). */
export const formatName = (first: string | null, last: string | null) => [first, last].filter(Boolean).join(' ');

/** "Austin, US · Comcast" from whatever location parts are known. */
export const formatPlace = (city: string | null, country: string | null, org?: string | null) =>
  [[city, country].filter(Boolean).join(', '), org].filter(Boolean).join(' · ') || '—';
