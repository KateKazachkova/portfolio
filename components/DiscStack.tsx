"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { WatchItem } from "@/lib/content";
import DiscBody from "@/components/DiscBody";
import PlayerDock from "@/components/PlayerDock";
import { STICKER_TARGETS, LID_TOP } from "@/lib/playerFrame";
import { homography, applyH, quadToMatrix3d } from "@/lib/homography";

const mono = "var(--font-mono), ui-monospace, monospace";

/* ────────────────────────────────────────────────────────────────────────────
 * Timings (ms) — the choreography of putting a disc in.
 * ──────────────────────────────────────────────────────────────────────────── */
const T_DOCK = 480;   // rack slides left, player arrives shut
const T_FLY = 620;    // disc flies to the back slot
const T_LID = 380;    // lid closes before the player leaves

type Flight = { key: number; from: DOMRect; matrix: string; item: WatchItem };

export default function DiscStack({ series }: { series: WatchItem[] }) {
  const [selected, setSelected] = useState<number | null>(null);   // disc taken from the rack
  const [shown, setShown] = useState<number | null>(null);         // disc actually in the player
  const [docked, setDocked] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [hint, setHint] = useState<number | null>(null);           // disc highlighted from a sticker

  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const dock = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Where the disc lands: flat on the shut lid, just in front of the back slot.
  // The lid is a photographed plane, so we project a disc-sized square in lid
  // units through the lid's homography and hand the flyer a matrix3d to ease into.
  const landing = useCallback((from: DOMRect): string | null => {
    const el = dock.current?.querySelector(".pd-stage") as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const lidPx = LID_TOP.map(([x, y]) => [r.left + x * r.width, r.top + y * r.height] as [number, number]);
    const H = homography(1000, 750, lidPx);           // lid plane (1000×750 units) → viewport
    const size = 470, cx = 500, cy = 330;              // disc ≈ half the lid width, centred, a bit toward the hinge
    const corners: [number, number][] = [[cx - size / 2, cy - size / 2], [cx + size / 2, cy - size / 2], [cx + size / 2, cy + size / 2], [cx - size / 2, cy + size / 2]];
    const q = corners.map(([x, y]) => { const [vx, vy] = applyH(H, x, y); return [vx - from.left, vy - from.top] as [number, number]; });
    return quadToMatrix3d(from.width, from.height, q);
  }, []);

  const fly = useCallback((i: number, then: () => void) => {
    const from = buttons.current[i]?.getBoundingClientRect();
    const matrix = from ? landing(from) : null;
    if (!from || !matrix) { then(); return; }
    setFlight({ key: Date.now(), from, matrix, item: series[i] });
    later(() => { setFlight(null); then(); }, T_FLY);
  }, [series, landing, later]);

  const insert = useCallback((i: number) => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setSelected(i);
    if (!docked) {
      setDocked(true);
      later(() => fly(i, () => { setShown(i); setLidOpen(true); }), T_DOCK);
    } else {
      // swap: the lid stays open, the new disc slides in, the screen changes when it lands
      fly(i, () => setShown(i));
    }
  }, [docked, fly, later]);

  const eject = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setLidOpen(false);
    later(() => { setDocked(false); setShown(null); setSelected(null); }, T_LID);
  }, [later]);

  const step = useCallback((dir: 1 | -1) => {
    if (series.length === 0) return;
    const cur = selected ?? (dir === 1 ? -1 : 0);
    insert((cur + dir + series.length) % series.length);
  }, [selected, series.length, insert]);

  const pickSticker = useCallback((name: string) => {
    const re = STICKER_TARGETS[name];
    const i = series.findIndex((s) => re?.test(s.title));
    if (i >= 0) insert(i);
  }, [series, insert]);

  const hoverSticker = useCallback((name: string | null) => {
    if (!name) { setHint(null); return; }
    const re = STICKER_TARGETS[name];
    const i = series.findIndex((s) => re?.test(s.title));
    setHint(i >= 0 ? i : null);
  }, [series]);

  if (series.length === 0) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    if (e.key === "Escape" && docked) { e.preventDefault(); eject(); }
  };

  const track = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    e.currentTarget.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const untrack = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.removeProperty("--px");
    e.currentTarget.style.removeProperty("--py");
  };

  const shownItem = shown !== null ? series[shown] : null;

  return (
    <div className="cd-shelf" data-docked={docked ? "true" : "false"}>
      {/* ── Disc rack ── */}
      <div className="cd-rack-wrap">
        <div className="cd-rack" role="listbox" aria-label="Series discs" onKeyDown={onKey}>
          {series.map((s, i) => {
            const isActive = i === selected;
            return (
              <div key={s.title} className="cd-cell" data-hint={hint === i ? "true" : "false"}>
                <button
                  ref={(el) => { buttons.current[i] = el; }}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-label={isActive ? `${s.title} — in the player, click to eject` : `Put ${s.title} in the player`}
                  className="cd"
                  data-active={isActive ? "true" : "false"}
                  data-taken={isActive && docked ? "true" : "false"}
                  onClick={() => (isActive ? eject() : insert(i))}
                  onPointerMove={track}
                  onPointerLeave={untrack}
                >
                  <DiscBody poster={s.poster} title={s.title} />
                </button>
                <span className="cd-cap">{s.title}</span>
              </div>
            );
          })}
        </div>
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)" }} className="uppercase mt-8">
          {docked ? "← → next disc · Esc to eject" : `Put a disc in · ${series.length} in collection`}
        </p>
      </div>

      {/* ── Player, slides in from the right ── */}
      <div className="cd-dock" ref={dock} aria-hidden={!docked}>
        <div className="cd-dock-inner">
          <PlayerDock
            item={shownItem}
            index={shown}
            total={series.length}
            open={lidOpen}
            onPick={pickSticker}
            onHoverSticker={hoverSticker}
            onEject={eject}
            onStep={step}
          />
          {/* spec label printed under the device */}
          <dl className="pd-card">
            <Row label="Title">{shownItem ? <span className="font-black uppercase leading-tight" style={{ fontSize: 14 }}>{shownItem.title}</span> : <Dash />}</Row>
            <Row label="Year">{shownItem?.year ? <span style={{ fontFamily: mono, fontSize: 12 }}>{shownItem.year}</span> : <Dash />}</Row>
            <Row label="Why I like it" last>{shownItem?.why ? <span className="italic text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{shownItem.why}</span> : <Dash />}</Row>
          </dl>
        </div>
      </div>

      {/* ── Flying disc ── */}
      {flight && <FlyingDisc key={flight.key} f={flight} />}
    </div>
  );
}

/** A clone of the picked disc that travels from its cell to the player's back slot. */
function FlyingDisc({ f }: { f: Flight }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setGo(true)); return () => cancelAnimationFrame(id); }, []);
  return (
    <div
      className="cd-fly"
      data-go={go ? "true" : "false"}
      style={{ left: f.from.left, top: f.from.top, width: f.from.width, height: f.from.height, "--m": f.matrix } as CSSProperties}
    >
      <DiscBody poster={f.item.poster} title={f.item.title} />
    </div>
  );
}

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 px-4 py-3" style={{ borderBottom: last ? "none" : "1px solid var(--hairline)", color: "var(--fg)" }}>
      <dt style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: "0.14em", color: "var(--muted)" }} className="uppercase pt-[3px]">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
function Dash() { return <span style={{ color: "var(--hairline)" }}>—</span>; }
