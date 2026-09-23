"use client";

import { useEffect, useRef } from "react";

/**
 * The grass in front of the case, and the cursor brushing through it.
 *
 * The strip is one picture, so it is cut into narrow vertical slices, each
 * showing its own column of the same image. A slice bends by skewing from its
 * foot — the roots stay put and the tips travel, the way a blade does. What
 * pushes it is the pointer's horizontal speed, weighted by how near the pointer
 * is to that slice, so a pass of the mouse drags a bow through the grass that
 * follows the cursor. Each slice is a damped spring, so it overshoots a little
 * and settles; a faint idle sway keeps it from ever freezing into a picture.
 *
 * Neighbouring slices bend by nearly the same angle — the falloff is wide next
 * to a slice's width — so the tops stay continuous instead of tearing apart.
 * The loop only runs while the strip is actually shown (dark theme) and never
 * with reduced motion.
 */

const SLICES = 48;
/** How far the pointer's influence reaches, in slice widths either side. */
const REACH = 7;
/** Spring constants per frame at 60fps. */
const STIFF = 0.06;
const DAMP = 0.86;
/** Degrees of lean per px/frame of pointer speed, and the hard ceiling. */
const PUSH = 0.9;
const MAX_DEG = 14;

export default function NightGrass() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const slices = Array.from(el.children) as HTMLElement[];
    const angle = new Float32Array(SLICES);
    const vel = new Float32Array(SLICES);
    let px = -1e9, py = -1e9, lastX = 0, speed = 0;
    let raf = 0, running = false, t = 0;

    const shown = () => el.offsetParent !== null;

    const onMove = (e: PointerEvent) => {
      // The first event has no previous position to measure from.
      if (px > -1e9) speed = Math.max(-40, Math.min(40, speed + e.clientX - lastX));
      lastX = e.clientX;
      px = e.clientX; py = e.clientY;
      if (!running && shown()) { running = true; raf = requestAnimationFrame(tick); }
    };

    const tick = () => {
      t += 1;
      const r = el.getBoundingClientRect();
      const w = r.width / SLICES;
      // Only grass the pointer is actually near: within the strip's height,
      // plus a margin, since the tall blades reach above the dense band.
      const near = py > r.top - r.height * 0.2 && py < r.bottom;
      const at = (px - r.left) / w;
      for (let i = 0; i < SLICES; i++) {
        const d = (i + 0.5 - at) / REACH;
        const weight = near ? Math.exp(-d * d) : 0;
        const idle = Math.sin(t * 0.02 + i * 0.35) * 0.6;
        const target = Math.max(-MAX_DEG, Math.min(MAX_DEG, speed * PUSH * weight));
        vel[i] = (vel[i] + (target + idle - angle[i]) * STIFF) * DAMP;
        angle[i] += vel[i];
        slices[i].style.transform = `skewX(${(-angle[i]).toFixed(2)}deg)`;
      }
      speed *= 0.8;
      // The idle sway keeps the loop alive while the strip is on screen; it
      // stops when the strip is hidden and restarts on the next move.
      if (shown()) raf = requestAnimationFrame(tick);
      else running = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    if (shown()) { running = true; raf = requestAnimationFrame(tick); }
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} className="case-grass" aria-hidden>
      {Array.from({ length: SLICES }, (_, i) => (
        <div
          key={i}
          className="case-grass__slice"
          style={{
            left: `${(i / SLICES) * 100}%`,
            backgroundPosition: `${(i / (SLICES - 1)) * 100}% 0`,
          }}
        />
      ))}
    </div>
  );
}
