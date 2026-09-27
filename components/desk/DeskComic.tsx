"use client";

import { useState, type CSSProperties } from "react";
import { come, here, usePutBack } from "./offduty";

// Off Duty: the Batman omnibus (Detective Comics, The New 52, vol. 1)
// lying on the desk in front of the CD wallet, a little askew. A click
// lifts it up to you, cover out, with a note beside it; a second click
// or Escape lays it back down. Box px, as OffDutyShelf; the cover is
// 364 × 549, drawn 17.5 cm across.
const COMIC = { x: -860, z: 40, w: 188, r: -9 };
const H = Math.round(COMIC.w * 549 / 364);

export default function DeskComic() {
  const [open, setOpen] = useState(false);
  usePutBack(open, () => setOpen(false));

  return (
    <button type="button" className="od-comic" data-open={open ? "" : undefined} tabIndex={-1}
      aria-label="Batman: Detective Comics – The New 52 Omnibus, vol. 1"
      onClick={(e) => {
        e.stopPropagation();
        if (!here()) { come(); return; }
        setOpen((o) => !o);
      }}
      style={{
        left: `calc(${COMIC.x - COMIC.w / 2} * var(--u))`, top: `calc(656 * var(--u))`,
        width: `calc(${COMIC.w} * var(--u))`, height: `calc(${H} * var(--u))`,
        "--z": COMIC.z, "--r": `${COMIC.r}deg`, "--h": H,
        backgroundImage: `url("/items/off-duty/batman-omnibus.webp")`,
      } as CSSProperties}>
      <span className="bs-card od-comic__card" aria-hidden>
        <span className="bs-card__title">Batman: Detective Comics</span>
        <span className="bs-card__meta">The New 52 Omnibus · vol. 1</span>
        <span className="bs-card__why">Ask me about the comic-book universes: I can talk about them for a very long time.</span>
      </span>
    </button>
  );
}
