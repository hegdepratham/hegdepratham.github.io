/**
 * nav.js — Live section status in the rail.
 *
 * Uses IntersectionObserver to track which section is currently in view.
 * Updates:
 *   - .is-active on the matching .nav-item
 *   - aria-current="page" on the matching nav link
 *
 * Also handles mobile nav toggle (collapse on link click).
 */

export function init() {
  const navItems = [...document.querySelectorAll('.nav-item[data-section]')];
  if (!navItems.length) return;

  // Build a section-id → nav-item map
  const map = new Map();
  navItems.forEach(item => {
    const id = item.dataset.section;
    const section = document.getElementById(id);
    // hero lives inside <header>, try both
    const target = section || document.querySelector(`[id="${id}"]`);
    if (target) map.set(target, item);
  });

  if (!('IntersectionObserver' in window)) {
    // Fallback: mark first item active
    navItems[0]?.classList.add('is-active');
    return;
  }

  let currentActive = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const item = map.get(entry.target);
        if (!item) return;
        if (entry.isIntersecting) {
          // Deactivate previous
          if (currentActive && currentActive !== item) {
            currentActive.classList.remove('is-active');
            const prevLink = currentActive.querySelector('a');
            if (prevLink) prevLink.removeAttribute('aria-current');
          }
          // Activate this one
          item.classList.add('is-active');
          const link = item.querySelector('a');
          if (link) link.setAttribute('aria-current', 'page');
          currentActive = item;
        }
      });
    },
    {
      // Section is "active" when its top edge is within the upper 60% of viewport
      rootMargin: '-5% 0px -40% 0px',
      threshold: 0,
    }
  );

  map.forEach((_, section) => observer.observe(section));

  // Mobile nav: close on link click
  const toggle = document.querySelector('.nav-toggle');
  const list   = document.querySelector('.nav-list');
  if (toggle && list) {
    list.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        list.classList.remove('is-open');
      });
    });
  }
}
