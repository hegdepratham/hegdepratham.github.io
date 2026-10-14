/**
 * field.js — Hero canvas particle/line field.
 *
 * Behaviour:
 *   - Points drift autonomously with gentle random velocity
 *   - Cursor / touch position bends drift toward or away from pointer
 *   - Lines drawn between particles within a proximity threshold
 *   - aria-hidden, pointer-events: none (set in CSS)
 *   - Pauses when tab is hidden (visibilitychange) or canvas is offscreen (IO)
 *   - Particle count scales with viewport area and devicePixelRatio
 *   - Under prefers-reduced-motion: renders one static frame then stops
 *
 * Exported init() is called by main.js.
 */

import { features } from './main.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_PARTICLE_AREA = 18000; // one particle per N px²
const MAX_PARTICLES      = 120;
const MIN_PARTICLES      = 20;
const CONNECT_DIST       = 140;   // px — max distance to draw a line
const CURSOR_RADIUS      = 180;   // px — cursor influence radius
const CURSOR_STRENGTH    = 0.018; // how strongly particles are pushed/pulled
const DRIFT_SPEED        = 0.28;  // base drift speed (px/frame)
const DAMPING            = 0.96;  // velocity damping per frame

// Accent colour matching --accent: #5B6FFF
const PARTICLE_COLOR = '91, 111, 255';

// ─── State ────────────────────────────────────────────────────────────────────
let canvas, ctx, particles;
let rafId    = null;
let paused   = false;
let running  = false;

let pointer = { x: -9999, y: -9999, active: false };

// ─── Particle factory ─────────────────────────────────────────────────────────
function makeParticle(w, h) {
  const angle = Math.random() * Math.PI * 2;
  const speed = DRIFT_SPEED * (0.4 + Math.random() * 0.6);
  return {
    x:  Math.random() * w,
    y:  Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r:  1 + Math.random() * 1.5,
    // Slow random walk target for organic drift
    ax: 0,
    ay: 0,
    noiseSeed: Math.random() * 1000,
  };
}

// ─── Resize / reinitialise ────────────────────────────────────────────────────
function resize() {
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w    = rect.width;
  const h    = rect.height;

  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.scale(dpr, dpr);

  const count = Math.min(
    MAX_PARTICLES,
    Math.max(MIN_PARTICLES, Math.floor((w * h) / BASE_PARTICLE_AREA))
  );

  particles = Array.from({ length: count }, () => makeParticle(w, h));
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function draw() {
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);
  const w    = canvas.width  / dpr;
  const h    = canvas.height / dpr;

  ctx.clearRect(0, 0, w, h);

  // Update and draw particles
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    if (!features.reducedMotion) {
      // Organic drift: nudge velocity with slow sinusoidal noise
      p.noiseSeed += 0.004;
      const noiseAngle = p.noiseSeed * 2.5;
      p.ax = Math.cos(noiseAngle) * DRIFT_SPEED * 0.06;
      p.ay = Math.sin(noiseAngle * 0.7) * DRIFT_SPEED * 0.06;

      // Cursor influence
      if (pointer.active) {
        const dx    = pointer.x - p.x;
        const dy    = pointer.y - p.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < CURSOR_RADIUS * CURSOR_RADIUS) {
          const dist   = Math.sqrt(dist2);
          const factor = (1 - dist / CURSOR_RADIUS) * CURSOR_STRENGTH;
          // Bend toward cursor (positive factor bends toward)
          p.ax += (dx / dist) * factor * 12;
          p.ay += (dy / dist) * factor * 12;
        }
      }

      p.vx = (p.vx + p.ax) * DAMPING;
      p.vy = (p.vy + p.ay) * DAMPING;

      // Clamp max speed
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = DRIFT_SPEED * 2.5;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges with margin so particles don't pop
      const margin = 20;
      if (p.x < -margin)  p.x = w + margin;
      if (p.x > w + margin) p.x = -margin;
      if (p.y < -margin)  p.y = h + margin;
      if (p.y > h + margin) p.y = -margin;
    }

    // Draw particle dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${PARTICLE_COLOR}, 0.7)`;
    ctx.fill();
  }

  // Draw connecting lines
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a  = particles[i];
      const b  = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d  = Math.sqrt(dx * dx + dy * dy);

      if (d < CONNECT_DIST) {
        const alpha = (1 - d / CONNECT_DIST) * 0.35;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${PARTICLE_COLOR}, ${alpha})`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }
    }
  }
}

// ─── Animation loop ───────────────────────────────────────────────────────────
function loop() {
  draw();
  if (!features.reducedMotion) {
    rafId = requestAnimationFrame(loop);
  }
  // Under reduced-motion: draw() is called once and we stop here
}

function start() {
  if (running && !paused) return;
  paused  = false;
  running = true;
  loop();
}

function pause() {
  paused = true;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// ─── Pointer tracking ─────────────────────────────────────────────────────────
function onMouseMove(e) {
  const rect  = canvas.getBoundingClientRect();
  pointer.x   = e.clientX - rect.left;
  pointer.y   = e.clientY - rect.top;
  pointer.active = true;
}

function onMouseLeave() {
  pointer.active = false;
  pointer.x = -9999;
  pointer.y = -9999;
}

function onTouchMove(e) {
  if (!e.touches.length) return;
  // passive listener — do NOT call preventDefault
  const rect = canvas.getBoundingClientRect();
  pointer.x  = e.touches[0].clientX - rect.left;
  pointer.y  = e.touches[0].clientY - rect.top;
  pointer.active = true;
}

function onTouchEnd() {
  pointer.active = false;
}

// ─── Visibility / offscreen pause ─────────────────────────────────────────────
function setupPauseHandlers() {
  // Tab visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
    } else {
      start();
    }
  });

  // Canvas offscreen
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start();
        } else {
          pause();
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);
  }
}

// ─── Public init ──────────────────────────────────────────────────────────────
export function init() {
  canvas = document.getElementById('hero-canvas');
  if (!canvas || !features.canvas) return;

  ctx = canvas.getContext('2d');

  resize();

  // Pointer events — passive for touch perf
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  canvas.parentElement?.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('touchmove',  onTouchMove, { passive: true });
  window.addEventListener('touchend',   onTouchEnd,  { passive: true });

  // Resize — debounced
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (paused) draw(); // Refresh static frame
    }, 150);
  }, { passive: true });

  setupPauseHandlers();

  // Under reduced-motion: draw once only
  if (features.reducedMotion) {
    draw();
    return;
  }

  start();
}
