"use client";

import { useRef, useSyncExternalStore } from "react";

/** A loose stack of square prints on the БУДЬ sheet: the online sessions,
 *  shot off the laptop screen. Any of them can be picked up and moved; the
 *  one in hand comes to the top. A red clip holds them to the sleeve (BudClip, laid on the sleeve).
 *
 *  Where they lie is kept outside the component: while its sleeve turns the
 *  sheet is drawn three more times (Binder's bands), and every copy has to
 *  show the prints where they were left. Positions are in % of the stack. */
const N = 16;
const src = (i: number) => `/profile/bud/photos/${String(i + 1).padStart(2, "0")}.webp`;
// the same scatter on every load, rounded so server and client agree
const rnd = (i: number, k: number) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
const to2 = (v: number) => Math.round(v * 100) / 100;

type Print = { x: number; y: number; r: number; z: number };
let prints: Print[] = Array.from({ length: N }, (_, i) => ({
  x: to2((rnd(i, 1) - 0.5) * 10), y: to2((rnd(i, 2) - 0.5) * 8), r: to2((rnd(i, 3) - 0.5) * 16), z: i + 1,
}));
let top = N + 1;
const subs = new Set<() => void>();
const set = (i: number, p: Partial<Print>) => {
  prints = prints.map((q, k) => (k === i ? { ...q, ...p } : q));
  subs.forEach((f) => f());
};
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export default function PhotoStack() {
  const list = useSyncExternalStore(subscribe, () => prints, () => prints);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ i: number; sx: number; sy: number; x: number; y: number; k: number; moved: boolean } | null>(null);

  return (
    <div ref={box} className="pf-prints" data-drag aria-label="Photographs from the online sessions">
      {list.map((p, i) => (
        <div
          key={i}
          className="pf-print"
          style={{ zIndex: p.z, transform: `translate(${p.x}%, ${p.y}%) rotate(${p.r}deg)` }}
          onPointerDown={(e) => {
            e.stopPropagation();
            const b = box.current!;
            // screen px per % of the stack, whatever the camera's zoom
            const k = b.getBoundingClientRect().width / 100;
            drag.current = { i, sx: e.clientX, sy: e.clientY, x: p.x, y: p.y, k, moved: false };
            e.currentTarget.setPointerCapture(e.pointerId);
            set(i, { z: ++top });
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.i !== i) return;
            const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
            if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
            set(i, { x: d.x + dx / d.k, y: d.y + dy / d.k });
          }}
          onPointerUp={() => {
            // a drag is not a click: the page under it stays where it is
            if (drag.current?.moved) {
              const eat = (c: MouseEvent) => { c.stopPropagation(); c.preventDefault(); };
              addEventListener("click", eat, { capture: true, once: true });
              setTimeout(() => removeEventListener("click", eat, { capture: true }), 0);
            }
            drag.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(i)} alt={i === N - 1 ? "Online mentoring sessions, БУДЬ/BE 2025" : ""} draggable={false} loading="lazy" />
        </div>
      ))}
    </div>
  );
}
