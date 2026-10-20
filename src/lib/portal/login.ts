// Prototype sign-in flow for /partner/login: switches between the email, password and code
// steps without calling anything. The real one is src/pages/admin/sign-in.astro's script with
// the partner endpoints (docs/partner-portal.md, "Auth and tenancy").
const steps = {
  email: document.querySelector<HTMLFormElement>('[data-step="email"]'),
  password: document.querySelector<HTMLFormElement>('[data-step="password"]'),
  code: document.querySelector<HTMLFormElement>('[data-step="code"]'),
};
const errorEl = document.querySelector<HTMLElement>('[data-auth-error]');
let email = '';

const show = (step: keyof typeof steps) => {
  for (const [key, form] of Object.entries(steps)) if (form) form.hidden = key !== step;
  document.querySelectorAll<HTMLElement>('[data-email]').forEach((el) => (el.textContent = email));
  steps[step]?.querySelector<HTMLInputElement>('input:not([type=checkbox])')?.focus();
  if (errorEl) errorEl.hidden = true;
};
const fail = (message: string) => {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
};

steps.email?.addEventListener('submit', (e) => {
  e.preventDefault();
  email = String(new FormData(steps.email!).get('email') ?? '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return fail('Enter your work email.');
  // A user with "password + code" on sees the password step first; everyone else gets a code.
  show(/\+pw@/.test(email) ? 'password' : 'code');
});

steps.password?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!String(new FormData(steps.password!).get('password') ?? '')) return fail('Enter your password.');
  show('code');
});

steps.code?.addEventListener('submit', (e) => {
  e.preventDefault();
  const otp = String(new FormData(steps.code!).get('otp') ?? '').trim();
  if (!/^\d{6}$/.test(otp)) return fail('Enter the 6-digit code.');
  location.assign('/partner/dashboard');
});

document.querySelector('[data-passkey]')?.addEventListener('click', () => location.assign('/partner/dashboard'));
document.querySelectorAll('[data-restart]').forEach((b) => b.addEventListener('click', () => show('email')));
document.querySelector('[data-resend]')?.addEventListener('click', () => fail('Prototype: a new code would be sent.'));
