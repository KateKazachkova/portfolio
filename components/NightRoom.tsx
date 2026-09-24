"use client";

import { useEffect, useRef } from "react";
import { useTime } from "@/components/TimeProvider";

/**
 * The room at night, while she sleeps.
 *
 * NicheLight turns the case down, but the studio round it stayed at noon: a
 * white tiled desk and a lit wall around a sleeping doll. This puts the whole
 * room out. One multiply layer over the stage, in the box's own px (1118 ×
 * 745), carried far past its edges so the desk and wall beyond the plate go
 * down with it. Two things are left lit:
 *
 *  - moonlight through a window out of frame on the left: four panes and
 *    their cross laid across the desk in front of the case, cold and
 *    soft-edged;
 *  - a small warm lamp low in front of the case, whose pool keeps the case
 *    itself readable while the desk falls away from it.
 *
 * Multiply, like NicheLight, so the tiles and the mahogany go deeper rather
 * than grey; the lit shapes are simply lighter colours in the same layer.
 * Only at rest: once the camera travels (html[data-desk]) the pool no longer
 * sits where the case is, so the layer fades out (globals.css).
 *
 * It is also what the dark theme means once you pin it (☾): the room goes out
 * whatever she is wearing, rather than only the page round it turning dark.
 * Left on auto, the theme follows the hour and the room follows the edition.
 *
 * And in the dark there is a torch: a warm circle of light that follows the
 * pointer, so the things on the desk are found rather than shown. It waits
 * for the first move, goes out when the pointer leaves the page, and on touch
 * stays where the last tap put it.
 */

const ON: Record<string, true> = { night: true };
const W = 1118;
const H = 745;

export default function NightRoom({ edition }: { edition: string }) {
  const { themePref } = useTime();
  const on = !!ON[edition] || themePref === "dark";
  const svg = useRef<SVGSVGElement>(null);
  const torch = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!on) return;
    const el = svg.current, t = torch.current;
    if (!el || !t) return;
    let frame = 0;
    let x = 0, y = 0;
    const paint = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const sx = ((x - r.left) / r.width) * W;
      const sy = ((y - r.top) / r.height) * H;
      t.setAttribute("transform", `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
      t.style.opacity = "1";
    };
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !e.relatedTarget) t.style.opacity = "0";
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.addEventListener("pointerout", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.removeEventListener("pointerout", leave);
      t.style.opacity = "0";
    };
  }, [on]);

  return (
    <svg
      aria-hidden
      ref={svg}
      className="night-room"
      data-on={on || undefined}
      viewBox="0 0 1118 745"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="nr-pool" cx="553" cy="470" r="600" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(553 470) scale(1 0.62) translate(-553 -470)">
          <stop offset="0" stopColor="rgb(236,206,168)" />
          <stop offset="0.32" stopColor="rgb(200,166,132)" />
          <stop offset="0.7" stopColor="rgb(120,100,96)" stopOpacity="0.5" />
          <stop offset="1" stopColor="rgb(80,74,90)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nr-moon-floor" x1="-120" y1="600" x2="420" y2="820" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgb(196,212,240)" />
          <stop offset="1" stopColor="rgb(140,158,196)" />
        </linearGradient>
        <radialGradient id="nr-torch">
          <stop offset="0" stopColor="rgb(255,244,226)" />
          <stop offset="0.5" stopColor="rgb(240,214,178)" stopOpacity="0.9" />
          <stop offset="1" stopColor="rgb(236,208,170)" stopOpacity="0" />
        </radialGradient>
        <filter id="nr-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* the room, out */}
      <rect x="-3000" y="-2000" width="7118" height="6000" fill="rgb(58,62,86)" />

      {/* the lamp's pool */}
      <rect x="-3000" y="-2000" width="7118" height="6000" fill="url(#nr-pool)" />

      {/* the window, out of frame on the left: its panes and their cross laid
          long across the desk in front of the case. Only the desk: a second
          set on the wall would be a second window. */}
      <g filter="url(#nr-soft)" fill="url(#nr-moon-floor)" opacity="0.9">
        <path d="M-150 640 L40 612 L150 690 L-60 726 Z" />
        <path d="M58 609 L240 582 L360 654 L168 687 Z" />
        <path d="M-40 742 L170 704 L300 800 L70 846 Z" />
        <path d="M188 700 L380 666 L520 758 L318 796 Z" />
      </g>

      {/* the torch, moved by the pointer (see the effect above) */}
      <g ref={torch} className="night-room__torch">
        <circle r="175" fill="url(#nr-torch)" />
      </g>
    </svg>
  );
}
