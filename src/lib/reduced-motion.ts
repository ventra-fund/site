/**
 * SMIL animations ignore CSS, so `prefers-reduced-motion` has to be honoured by pausing the SVGs
 * by hand. Re-evaluated whenever the OS setting changes, not just at load.
 */
export function pauseSmilForReducedMotion(selector: string): void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const apply = () => {
    for (const svg of document.querySelectorAll<SVGSVGElement>(selector)) {
      if (query.matches) svg.pauseAnimations();
      else svg.unpauseAnimations();
    }
  };
  apply();
  query.addEventListener("change", apply);
}
