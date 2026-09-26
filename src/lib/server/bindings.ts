// Bindings (the rate limiters, the auth database) arrive through `cloudflare:workers`, which only
// exists inside the Worker. `astro dev` runs on plain Node (see astro.config.mjs), so the import is
// dynamic and a missing module simply means "no bindings": each caller decides what that degrades
// to (the limiter waves requests through, admin sign-in is unavailable). `pnpm build && pnpm
// preview` runs the real thing.

type WorkersModule = typeof import('cloudflare:workers');

let modulePromise: Promise<WorkersModule | undefined> | undefined;

function getModule(): Promise<WorkersModule | undefined> {
  modulePromise ??= import(/* @vite-ignore */ 'cloudflare:workers').catch(() => undefined);
  return modulePromise;
}

/** The binding declared under `name` in wrangler.jsonc, or undefined outside the Worker. */
export async function getBinding<T>(name: string): Promise<T | undefined> {
  const mod = await getModule();
  return mod?.env?.[name] as T | undefined;
}

/**
 * Keep `promise` running after the response has gone out (the Worker's `waitUntil`). Outside the
 * Worker there is nothing to extend, so it is just left to settle.
 */
export async function runInBackground(promise: Promise<unknown>): Promise<void> {
  const mod = await getModule();
  if (mod?.waitUntil) mod.waitUntil(promise);
}
