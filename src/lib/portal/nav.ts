// Phone-width disclosure for the portal sidebar. At lg and up the panel is always shown by CSS.
const nav = document.querySelector<HTMLElement>('[data-partner-nav]');
const toggle = nav?.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const panel = nav?.querySelector<HTMLElement>('[data-nav-panel]');
if (toggle && panel) {
  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
}
