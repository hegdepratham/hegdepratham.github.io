/**
 * main.js — Entry point, feature detection, init.
 *
 * Responsibilities:
 *   1. Set `.js` on <html> before first paint.
 *   2. Init all modules once DOM is ready.
 *   3. Expose a simple event bus for cross-module communication.
 */

// ─── 1. Set .js synchronously ─────────────────────────────────────────────────
document.documentElement.classList.add('js');

// ─── 2. Minimal event bus ─────────────────────────────────────────────────────
export const bus = {
  _handlers: {},
  on(event, fn)     { (this._handlers[event] ??= []).push(fn); },
  emit(event, data) { (this._handlers[event] ?? []).forEach(fn => fn(data)); },
};

// ─── 3. Feature detection ──────────────────────────────────────────────────────
export const features = {
  reducedMotion:        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  intersectionObserver: 'IntersectionObserver' in window,
  canvas:               !!document.createElement('canvas').getContext,
};

// ─── 4. Init sequence ─────────────────────────────────────────────────────────
async function init() {
  const [{ init: bootInit }, { init: navInit }, { init: fieldInit }, { init: revealInit }] =
    await Promise.all([
      import('./boot.js'),
      import('./nav.js'),
      import('./field.js'),
      import('./reveal.js'),
    ]);

  // Boot sequence first — it owns the load-in animation
  bootInit();

  // Live nav tracking — independent of boot
  navInit();

  // Hero field — starts as soon as canvas is ready
  fieldInit();

  // Scroll reveals
  revealInit();

  // Utilities
  initCopyButtons();
  initMobileNav();
}

// ─── 5. Copy-to-clipboard ─────────────────────────────────────────────────────
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const label = btn.querySelector('.copy-btn__label');
        btn.classList.add('is-copied');
        if (label) label.textContent = 'Copied';
        setTimeout(() => {
          btn.classList.remove('is-copied');
          if (label) label.textContent = 'Copy';
        }, 2000);
      } catch {
        // Clipboard API unavailable — silent fail
      }
    });
  });
}

// ─── 6. Mobile nav toggle ─────────────────────────────────────────────────────
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const list   = document.querySelector('.nav-list');
  if (!toggle || !list) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    list.classList.toggle('is-open', !expanded);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
