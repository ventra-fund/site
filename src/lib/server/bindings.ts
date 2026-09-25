// Bindings (the rate limiters) arrive through `cloudflare:workers`, which only exists inside the
// Worker. `astro dev` runs on plain Node (see astro.config.mjs), so the import is dynamic and a
// missing module simply means "no bindings": each caller decides what that degrades to (the
// limiter waves requests through). `pnpm build && pnpm preview` runs the real thing.

let envPromise: Promise<Record<string, unknown> | undefined> | undefined;

function getEnv(): Promise<Record<string, unknown> | undefined> {
  envPromise ??= import(/* @vite-ignore */ 'cloudflare:workers')
    .then((mod) => mod.env as Record<string, unknown> | undefined)
    .catch(() => undefined);
  return envPromise;
}

/** The binding declared under `name` in wrangler.jsonc, or undefined outside the Worker. */
export async function getBinding<T>(name: string): Promise<T | undefined> {
  const env = await getEnv();
  return env?.[name] as T | undefined;
}
