/**
 * reveal.js — Scroll-linked module "power-on" reveal system.
 *
 * Vocabulary (same across every section — M3, M4, M5 all reuse this):
 *   1. Border accent line sweeps across the module top edge (200 ms)
 *   2. Module body fades in with a subtle upward nudge (300 ms)
 *   3. Child [data-readout] elements tick on in sequence (80 ms stagger each)
 *
 * Under prefers-reduced-motion: skip to final state instantly (no animation).
 * Without JS: all [data-reveal] elements are visible (no .js class on <html>).
 *
 * Usage:
 *   Add data-reveal to any element that should animate on scroll entry.
 *   Add data-readout to children that should stagger-in after the module.
 */

import { features } from './main.js';

const READOUT_STAGGER = 80;   // ms between each readout child
const OBSERVER_OPTIONS = {
  rootMargin: '0px 0px -60px 0px',   // trigger 60px before bottom of viewport
  threshold: 0.08,                    // 8% of element must be visible
};

export function init() {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;

  if (features.reducedMotion || !features.intersectionObserver) {
    // Power everything on immediately — no animation
    targets.forEach(el => powerOn(el, true));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        powerOn(entry.target, false);
        observer.unobserve(entry.target);  // fire once per element
      }
    });
  }, OBSERVER_OPTIONS);

  targets.forEach(el => observer.observe(el));
}

/**
 * powerOn(el, instant)
 * Adds .is-powered and sets --reveal-index on each [data-readout] child.
 * instant=true: skip delays (reduced-motion / no-JS paths).
 */
function powerOn(el, instant) {
  if (instant) {
    el.classList.add('is-powered');
    el.querySelectorAll('[data-readout]').forEach((child, i) => {
      child.style.setProperty('--reveal-index', i);
      child.classList.add('is-powered');
    });
    return;
  }

  // Normal animated path
  // The CSS animation on .is-powered handles the border sweep + fade-in.
  el.classList.add('is-powered');

  // Stagger readout children after module starts to appear
  el.querySelectorAll('[data-readout]').forEach((child, i) => {
    child.style.setProperty('--reveal-index', i);
    setTimeout(() => {
      child.classList.add('is-powered');
    }, 160 + i * READOUT_STAGGER);
  });
}
