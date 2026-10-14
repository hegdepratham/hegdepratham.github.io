/**
 * boot.js — Boot sequence orchestration.
 *
 * Sequence (total ≤ 1.6 s):
 *   0 ms   → rail border fades in
 *   80 ms  → nav entries come online one by one (idle → powered)
 *   960 ms → hero eyebrow resolves
 *  1080 ms → hero h1 resolves
 *  1280 ms → hero role resolves
 *  1440 ms → hero CTA resolves
 *
 * Under prefers-reduced-motion: skip to final state instantly.
 * Called once by main.js after DOM ready.
 */

import { features } from './main.js';

const ENTRY_STAGGER  = 110;  // ms between each nav entry
const HERO_EYEBROW   = 960;
const HERO_NAME      = 1080;
const HERO_ROLE      = 1280;
const HERO_CTA       = 1440;

export function init() {
  if (features.reducedMotion) {
    skipToFinalState();
    return;
  }
  runSequence();
}

function runSequence() {
  const navItems   = [...document.querySelectorAll('.nav-item')];
  const eyebrow    = document.querySelector('.hero__eyebrow');
  const heroName   = document.querySelector('.hero__name');
  const heroRole   = document.querySelector('.hero__role');
  const heroCta    = document.querySelector('.hero__cta');

  // Hide hero content initially (boot-hidden class sets opacity:0)
  [eyebrow, heroName, heroRole, heroCta].forEach(el => {
    if (el) el.classList.add('boot-hidden');
  });

  // Stagger nav entries online
  navItems.forEach((item, i) => {
    setTimeout(() => {
      item.classList.add('is-powered');
    }, 80 + i * ENTRY_STAGGER);
  });

  // Hero elements resolve in sequence
  const resolve = (el, delay) => {
    if (!el) return;
    setTimeout(() => {
      el.classList.remove('boot-hidden');
      el.classList.add('boot-visible');
    }, delay);
  };

  resolve(eyebrow,  HERO_EYEBROW);
  resolve(heroName, HERO_NAME);
  resolve(heroRole, HERO_ROLE);
  resolve(heroCta,  HERO_CTA);
}

function skipToFinalState() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.add('is-powered');
  });
  // Hero elements: remove boot-hidden if present (none added under reduced-motion)
}
