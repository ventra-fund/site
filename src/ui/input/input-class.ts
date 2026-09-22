/**
 * The text-input look shared by every form field on the site, including the DateField's typable
 * input (which can't render <Input> itself because it needs extra data attributes and padding).
 * The `aria-invalid:` styles pair with src/lib/form.ts, which sets that attribute.
 */
export const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-base font-normal outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";
