"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { ShelfItem } from "@/lib/content";
import { CM, WALL, come, here, px, usePutBack } from "./offduty";
import "./BookShelf.css";

// Off Duty's shelf: a birch plywood plank on the wall over the CD wallet
// and the player, the books standing on it spine out, the comics leaning
// against the wall face out. Box px, as OffDutyShelf: x across, y down to
// the desk line (656), z out from the case's plane, the wall at z -269;
// 26 cm is 280 px.
// 74 cm long, 19 cm deep, 3 cm thick (the still's edge is 1230 × 50);
// y is its top.
export const SHELF = { x: -1160, w: 800, y: 312, d: 205 };
const T = Math.round(SHELF.w * 50 / 1230);
// Books and comics stand at their real size (Size: in the files).
// the books stand 1.5 cm back from the front edge; each is as deep as its
// cover is wide for its height (15 cm until the cover has loaded)
const BOOK_D = Math.round(15 * CM);
const BOOK_Z = WALL + SHELF.d - Math.round(1.5 * CM);
// the comics lean back against the wall, 11°
const LEAN = 11;

// "Sapiens: A Brief History of Humankind" → "Sapiens" on the spine
const short = (t: string) => t.replace(/:.*$/, "");

export default function BookShelf() {
  const [shelf, setShelf] = useState<{ books: ShelfItem[]; comics: ShelfItem[] }>({ books: [], comics: [] });
  // the one taken off the shelf: a book turned cover out, or a comic
  const [open, setOpen] = useState<string | null>(null);
  // each cover's width over its height, read off the picture itself
  const [ratio, setRatio] = useState<Record<string, number>>({});
  useEffect(() => {
    shelf.books.forEach((b) => {
      if (!b.poster) return;
      const im = new Image();
      im.onload = () => { const r = im.naturalWidth / im.naturalHeight; if (r) setRatio((m) => ({ ...m, [b.title]: r })); };
      im.src = b.poster;
    });
  }, [shelf.books]);
  useEffect(() => {
    let on = true;
    fetch("/api/shelf").then((r) => r.json()).then((d) => on && setShelf(d)).catch(() => {});
    return () => { on = false; };
  }, []);
  usePutBack(open !== null, () => setOpen(null));
  const toggle = (title: string) => (e: React.MouseEvent) => {
    if (!here()) return;
    e.stopPropagation();
    setOpen((o) => (o === title ? null : title));
  };

  // the books from the plank's left end, 3 cm in, standing side by side;
  // the comics after them, 6 cm on
  type Placed = { item: ShelfItem; x: number; h: number; w: number; d?: number };
  const books: Placed[] = [];
  const comics: Placed[] = [];
  let x = SHELF.x + Math.round(3 * CM);
  for (const b of shelf.books) {
    const [h, t] = b.size ?? [21, 2.6];
    const w = Math.max(7, Math.round(t * CM));
    const bh = Math.round(h * CM);
    books.push({ item: b, x, h: bh, w, d: ratio[b.title] ? Math.round(bh * ratio[b.title]) : BOOK_D });
    x += w + 1;
  }
  x += Math.round(6 * CM);
  for (const c of shelf.comics) {
    const [h, cw] = c.size ?? [26, 17];
    const w = Math.round(cw * CM);
    comics.push({ item: c, x, h: Math.round(h * CM), w });
    x += Math.round(w * 0.55);   // each one half in front of the last
  }

  return (
    <div className="bs" onClick={come}>
      {/* its shadow on the wall, under the plank */}
      <span className="bs-shadow" aria-hidden style={{
        left: px(SHELF.x - 20), top: px(SHELF.y), width: px(SHELF.w + 40), height: px(90),
        transform: `translateZ(${px(WALL + 1)})`,
      }} />
      {/* two black steel brackets on the wall */}
      {[0.1, 0.9].map((f) => (
        <span key={f} className="bs-bracket" aria-hidden style={{
          left: px(SHELF.x + SHELF.w * f - 7), top: px(SHELF.y + T), width: px(14), height: px(58),
          transform: `translateZ(${px(WALL + 2)})`,
        }} />
      ))}
      <span className="bs-top" aria-hidden style={{
        left: px(SHELF.x), top: px(SHELF.y), width: px(SHELF.w), height: px(SHELF.d),
        transform: `translateZ(${px(WALL)}) rotateX(90deg)`,
      }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bs-front" src="/items/off-duty/shelf-front.webp" alt="" aria-hidden draggable={false} style={{
        left: px(SHELF.x), top: px(SHELF.y), width: px(SHELF.w), height: px(T),
        transform: `translateZ(${px(WALL + SHELF.d)})`,
      }} />

      {books.map(({ item: b, x, h, w, d = BOOK_D }) => {
        const [bg, ink] = b.spine ?? ["#5b4a3a", "#f3ecdd"];
        const isOpen = open === b.title;
        return (
          <button key={b.title} type="button" className="bs-book" data-open={isOpen ? "" : undefined}
            tabIndex={-1} aria-label={`${b.title}${b.author ? ` by ${b.author}` : ""}`} onClick={toggle(b.title)}
            style={{
              left: px(x), top: px(SHELF.y - h), width: px(w), height: px(h),
              "--z": BOOK_Z, "--d": d, "--w": w, "--h": h, "--bg": bg, "--ink": ink,
            } as CSSProperties}>
            <span className="bs-book__body">
              <span className="bs-book__spine">
                <span className="bs-book__title">{short(b.title)}</span>
                {b.author && <span className="bs-book__author">{b.author.split(" ").slice(-1)[0]}</span>}
              </span>
              <span className="bs-book__cover" style={b.poster ? { backgroundImage: `url("${b.poster}")` } : undefined} />
              <span className="bs-book__back" />
              <span className="bs-book__pages" />
            </span>
            <Card item={b} style={{ left: px(w / 2 + d / 2 + 14), top: px(0) }} />
          </button>
        );
      })}

      {comics.map(({ item: c, x, h, w }) => {
        const isOpen = open === c.title;
        // its foot far enough out that the top rests on the wall
        const foot = WALL + Math.ceil(h * Math.sin(LEAN * Math.PI / 180)) + 3;
        return (
          <button key={c.title} type="button" className="bs-comic" data-open={isOpen ? "" : undefined}
            tabIndex={-1} aria-label={`${c.title}${c.author ? ` by ${c.author}` : ""}`} onClick={toggle(c.title)}
            style={{
              left: px(x), top: px(SHELF.y - h), width: px(w), height: px(h),
              "--z": foot, "--lean": `${LEAN}deg`,
              backgroundImage: c.poster ? `url("${c.poster}")` : undefined,
            } as CSSProperties}>
            <Card item={c} style={{ left: px(w + 14), top: px(0) }} />
          </button>
        );
      })}
    </div>
  );
}

/** What it is and why it is here, beside it once it is off the shelf. */
function Card({ item, style }: { item: ShelfItem; style: CSSProperties }) {
  return (
    <span className="bs-card" style={style} aria-hidden>
      <span className="bs-card__title">{item.title}</span>
      {(item.author || item.year) && (
        <span className="bs-card__meta">{[item.author, item.year].filter(Boolean).join(" · ")}</span>
      )}
      {item.why && <span className="bs-card__why">{item.why}</span>}
    </span>
  );
}
