import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { ADMIN_EMAILS, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CONTACT_FROM_EMAIL, RESEND_API_KEY } from 'astro:env/server';
import { getBinding, runInBackground } from './bindings';
import { sendEmail } from './email';

// Admin sign-in: email one-time codes (Better Auth's emailOTP plugin), limited to the addresses in
// ADMIN_EMAILS. Users, sessions, codes and rate-limit counters live in the AUTH_DB D1 database
// (schema in migrations/). D1 only exists inside the Worker, so under `astro dev` there is no auth
// at all and /admin says so; use `pnpm build && pnpm preview`.
//
// The allowlist is checked three times: no code is emailed to an address outside it, no user can
// be created for one, and /admin re-checks the signed-in email on every request, so removing an
// address locks it out at once rather than when its session expires. Sign-in itself isn't
// pre-screened: every address gets the same answers (a code is stored either way, only admins are
// sent it), so the endpoints don't reveal which emails are admins.

const TAG = 'auth';

/** The only Better Auth endpoints reachable from outside; the catch-all route 404s the rest. */
export const AUTH_PATHS = new Set(['/email-otp/send-verification-otp', '/sign-in/email-otp', '/get-session', '/sign-out']);

const allowlist = () =>
  new Set(
    (ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );

export const isAdminEmail = (email: string) => allowlist().has(email.trim().toLowerCase());

async function sendOtp(email: string, otp: string) {
  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) {
    console.error(`[${TAG}] RESEND_API_KEY or CONTACT_FROM_EMAIL missing; sign-in code not sent`);
    return;
  }
  await sendEmail(TAG, RESEND_API_KEY, {
    from: CONTACT_FROM_EMAIL,
    to: email,
    subject: `Your Ventra Fund sign-in code: ${otp}`,
    html: `<p>Your sign-in code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${otp}</p><p>It expires in 5 minutes. If you didn't request it, ignore this email.</p>`,
    text: `Your sign-in code is ${otp}. It expires in 5 minutes. If you didn't request it, ignore this email.`,
  });
}

function createAuth(database: NonNullable<BetterAuthOptions['database']>, secret: string) {
  return betterAuth({
    appName: 'Ventra Fund',
    database,
    secret,
    // Unset, Better Auth takes the origin from the request, which is fine locally. Set it in
    // production so cookies and the origin check are pinned to the real host.
    baseURL: BETTER_AUTH_URL,
    session: {
      expiresIn: 60 * 60 * 24, // a day
      updateAge: 60 * 60, // slid forward at most hourly
    },
    rateLimit: {
      enabled: true,
      // In-memory counters would be per isolate; D1 makes them hold across the fleet.
      storage: 'database',
      customRules: {
        '/email-otp/send-verification-otp': { window: 60, max: 3 },
        '/sign-in/email-otp': { window: 60, max: 5 },
      },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      // The code email goes out after the response, so an allowlisted address answers no slower
      // than any other (no telling which addresses are admins by timing).
      backgroundTasks: { handler: (promise) => void runInBackground(promise) },
    },
    databaseHooks: {
      user: {
        create: {
          // Nothing outside the allowlist ever gets a user row, so a sign-in with such an address
          // can't produce a session even with a correct code.
          before: async (user) => (isAdminEmail(user.email) ? { data: user } : false),
        },
      },
    },
    plugins: [
      emailOTP({
        allowedAttempts: 3,
        expiresIn: 300,
        storeOTP: 'hashed',
        async sendVerificationOTP({ email, otp, type }) {
          // Everything else (verification, password reset) is unused; answer the same way for
          // every address and only actually send to admins.
          if (type !== 'sign-in' || !isAdminEmail(email)) return;
          await sendOtp(email, otp);
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let authPromise: Promise<Auth | null> | undefined;

/** The auth instance, or null when the D1 binding or the secret is missing (fails closed). */
export function getAuth(): Promise<Auth | null> {
  authPromise ??= (async () => {
    const db = await getBinding<NonNullable<BetterAuthOptions['database']>>('AUTH_DB');
    if (!db) return null;
    if (!BETTER_AUTH_SECRET) {
      console.error(`[${TAG}] BETTER_AUTH_SECRET missing; admin sign-in disabled`);
      return null;
    }
    const auth = createAuth(db, BETTER_AUTH_SECRET);
    // Setup (including reading the D1 schema) starts on creation and is shared by every later
    // request in this isolate. A Worker drops a request's unfinished I/O once it responds, which
    // would leave that shared promise pending forever and hang all auth from then on, so it is
    // finished here, inside the creating request, and kept alive by waitUntil even if that
    // request ends first.
    const ready = auth.$context;
    void runInBackground(ready);
    await ready;
    return auth;
  })();
  return authPromise;
}

/** The signed-in admin's session, or null (not signed in, auth unavailable, or no longer allowlisted). */
export async function getAdminSession(headers: Headers) {
  const auth = await getAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers });
  if (!session || !isAdminEmail(session.user.email)) return null;
  return session;
}
