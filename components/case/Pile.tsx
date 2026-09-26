"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PileItem } from "@/content/work/types";
import Spans from "./Spans";

/**
 * The archive, laid out on a table.
 *
 * Everything is visible from the start — the reader never has to drag to see
 * a card. Dragging just moves one from place to place, and it stays where it
 * is put. Below 901px, and until this mounts, the same cards render as a plain
 * contact sheet: pushing things around a phone screen fights the scroll, and a
 * gesture is not a way to deliver content.
 */

/** Where they were dropped, as fractions of the free space, so the scatter
 *  holds its shape at any width instead of spilling off the table: a loose
 *  grid, COLS across, each card knocked off its cell by a fixed amount (the
 *  same every visit), in the archive's order. */
const COLS = 5;
const CARD_MAX_H = 330;
const jig = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v) - 0.5;   // -0.5 … 0.5
};
const homeOf = (i: number, n: number) => {
  const rows = Math.max(1, Math.ceil(n / COLS) - 1), col = i % COLS, row = Math.floor(i / COLS);
  const x = (col + jig(i, 1) * 0.7) / (COLS - 1), y = (row + jig(i, 2) * 0.6) / rows;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)), r: jig(i, 3) * 9 };
};
/** the table grows with the pile: about 200px of it for every row */
const tableH = (n: number) => Math.max(520, Math.ceil(n / COLS) * 200);

type Pos = { x: number; y: number; r: number };

export default function Pile({
  items,
  title,
  count,
  help,
}: {
  items: PileItem[];
  title: string;
  count: string;
  help: string;
}) {
  const stackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const pos = useRef<Pos[]>([]);
  const drag = useRef<{ i: number; x: number; y: number } | null>(null);
  const top = useRef(items.length * 2 + 1);
  const [loose, setLoose] = useState(false);

  const paint = useCallback((i: number) => {
    const el = cardRefs.current[i];
    const p = pos.current[i];
    if (!el || !p) return;
    el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.r}deg)`;
  }, []);

  /** Free space a card can travel in, measured now rather than assumed. */
  const room = useCallback((i: number) => {
    const box = stackRef.current?.getBoundingClientRect();
    const card = cardRefs.current[i]?.getBoundingClientRect();
    if (!box || !card) return { w: 0, h: 0 };
    // a card's picture may not have loaded yet (they are lazy): reckon on the
    // tallest a card gets (260 of picture + caption, times its size), so none
    // ends up hanging off the bottom once it has
    return { w: Math.max(0, box.width - card.width), h: Math.max(0, box.height - Math.max(card.height, CARD_MAX_H * (items[i].size ?? 1))) };
  }, [items]);

  const clamp = useCallback(
    (i: number) => {
      const r = room(i);
      const p = pos.current[i];
      p.x = Math.max(-12, Math.min(p.x, r.w + 12));
      p.y = Math.max(-12, Math.min(p.y, r.h + 12));
    },
    [room],
  );

  const reset = useCallback(
    (animate: boolean) => {
      items.forEach((_, i) => {
        const home = homeOf(i, items.length);
        const r = room(i);
        pos.current[i] = { x: home.x * r.w, y: home.y * r.h, r: home.r };
        const el = cardRefs.current[i];
        if (el) {
          // the ones made bigger lie on top of the rest
          el.style.zIndex = String(items[i].size ? items.length + i + 1 : i + 1);
          if (animate) {
            el.classList.add("is-returning");
            window.setTimeout(() => el.classList.remove("is-returning"), 520);
          }
        }
        paint(i);
      });
      top.current = items.length * 2 + 1;
    },
    [items, paint, room],
  );

  // Loose layout needs room. Below that the contact sheet is the better answer.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const apply = () => setLoose(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (loose) reset(false);
  }, [loose, reset]);

  // On resize, pull everything back inside rather than re-scattering it —
  // whatever the reader arranged is theirs to keep.
  useEffect(() => {
    if (!loose) return;
    let tick: number;
    const onResize = () => {
      window.clearTimeout(tick);
      tick = window.setTimeout(() => {
        items.forEach((_, i) => {
          clamp(i);
          paint(i);
        });
      }, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(tick);
      window.removeEventListener("resize", onResize);
    };
  }, [loose, items, clamp, paint]);

  function onPointerDown(e: React.PointerEvent) {
    if (!loose || e.button !== 0) return;
    const card = (e.target as HTMLElement).closest(".pcard") as HTMLElement | null;
    const i = cardRefs.current.findIndex((c) => c === card);
    if (i < 0) return;
    drag.current = { i, x: e.clientX - pos.current[i].x, y: e.clientY - pos.current[i].y };
    card!.style.zIndex = String(++top.current); // picked up = on top, and it stays there
    card!.classList.add("is-held");
    try {
      card!.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic or already-released pointer */
    }
    e.preventDefault();
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    pos.current[d.i].x = e.clientX - d.x;
    pos.current[d.i].y = e.clientY - d.y;
    paint(d.i);
  }

  function onPointerUp() {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    cardRefs.current[d.i]?.classList.remove("is-held");
    clamp(d.i);
    paint(d.i);
  }

  // The same move, from the keyboard. Shift takes a bigger step.
  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const d = step[e.key];
    if (!d || !loose) return;
    const by = e.shiftKey ? 32 : 8;
    pos.current[i].x += d[0] * by;
    pos.current[i].y += d[1] * by;
    const el = cardRefs.current[i];
    if (el) el.style.zIndex = String(++top.current);
    clamp(i);
    paint(i);
    e.preventDefault();
  }

  return (
    <section className="pile" data-ready={loose ? "" : undefined} aria-labelledby="pile-h">
      <div className="pile__head">
        <h3 id="pile-h" style={{ margin: 0 }}>{title}</h3>
        <span className="pile__count">{count}</span>
      </div>

      <div
        ref={stackRef}
        className="pile__stack"
        style={loose ? { height: tableH(items.length) } : undefined}
        role="group"
        aria-label="The archive, laid out"
        aria-describedby="pile-help"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {items.map((item, i) => (
          <figure
            key={item.src}
            className="pcard"
            ref={(el) => { cardRefs.current[i] = el; }}
            style={item.size ? ({ "--s": item.size } as React.CSSProperties) : undefined}
            tabIndex={loose ? 0 : undefined}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.alt} draggable={false} loading="lazy" />
            <figcaption>
              <b>{String(i + 1).padStart(2, "0")}</b>&nbsp; {item.kind}{item.caption && <> – <Spans spans={item.caption} /></>}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="pile__hint">
        <span id="pile-help">{loose ? help : "The archive, as it was sorted"}</span>
        {loose && (
          <span className="pile__btns">
            <button type="button" onClick={() => reset(true)}>Put them back</button>
          </span>
        )}
      </p>
    </section>
  );
}
