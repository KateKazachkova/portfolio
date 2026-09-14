"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { WatchItem } from "@/lib/content";
import { quadToMatrix3d } from "@/lib/homography";
import { FRAME, LID_TOP, BASE_TOP, SCREEN, HINGE, LID_STICKERS, BASE_STICKERS, CONTROLS, ENGRAVING, type Quad, type Sticker } from "@/lib/playerFrame";

const mono = "var(--font-mono), ui-monospace, monospace";

/**
 * KATE™ PD-001 — the portable player the discs go into.
 *
 * Photographed layers sharing one frame (public/player/*.webp, mirrored so the
 * player faces the rack): closed body · open base · open lid · paper shadows.
 * Everything sits in a 1000-unit virtual stage scaled to its container, so the
 * perspective planes (screen, lid top, palm rest) are constant matrix3d's.
 *
 * The engraving, the label, the button glyphs and the LCD were erased from the
 * photos and are real HTML pinned to those planes — so the transport buttons
 * actually work: ⏮ ▶❚❚ ■ ⏭ and ⏻ (= eject).
 */
const W = 1000;
const H = Math.round((W * FRAME[1]) / FRAME[0]);
const PLANE_W = 1000, PLANE_H = 750; // lid / palm-rest planes are ~4:3

const px = (q: Quad) => q.map(([x, y]) => [x * W, y * H] as [number, number]);
const uv = ([u, v]: readonly [number, number] | readonly number[]) => ({ x: u * PLANE_W, y: v * PLANE_H });

export type StickerHover = (name: string | null) => void;
type Mode = "play" | "pause" | "stop";

export default function PlayerDock({
  item, index, total, open, onPick, onHoverSticker, onEject, onStep,
}: {
  item: WatchItem | null;
  index: number | null;
  total: number;
  open: boolean;
  onPick: (stickerName: string) => void;
  onHoverSticker: StickerHover;
  onEject: () => void;
  onStep: (dir: 1 | -1) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [mode, setMode] = useState<Mode>("play");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // a new disc always starts playing from 00:00
  useEffect(() => { setMode("play"); setElapsed(0); }, [item?.title]);
  // the counter runs while playing
  useEffect(() => {
    if (!open || !item || mode !== "play") return;
    const id = window.setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, item, mode]);

  const planes = useMemo(() => ({
    screen: { w: 640, h: 360, t: quadToMatrix3d(640, 360, px(SCREEN)) },
    lid: { t: quadToMatrix3d(PLANE_W, PLANE_H, px(LID_TOP)) },
    base: { t: quadToMatrix3d(PLANE_W, PLANE_H, px(BASE_TOP)) },
    lcd: { w: 220, h: 64, t: quadToMatrix3d(220, 64, CONTROLS.lcd.map(([u, v]) => [u * PLANE_W, v * PLANE_H] as [number, number])) },
    hinge: { x: ((HINGE[0][0] + HINGE[1][0]) / 2) * W, y: ((HINGE[0][1] + HINGE[1][1]) / 2) * H },
  }), []);

  const on = open && !!item;
  const btn = CONTROLS.buttonSize * PLANE_W;
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const modeLabel = mode === "play" ? "▶ PLAY" : mode === "pause" ? "❚❚ PAUSE" : "■ STOP";

  const controls: { key: string; pos: readonly number[]; glyph: string; label: string; act: () => void; active?: boolean }[] = [
    { key: "prev", pos: CONTROLS.prev, glyph: "⏮", label: "Previous disc", act: () => onStep(-1) },
    { key: "play", pos: CONTROLS.play, glyph: "▶❚❚", label: mode === "play" ? "Pause" : "Play", act: () => setMode((m) => (m === "play" ? "pause" : "play")), active: mode !== "stop" },
    { key: "stop", pos: CONTROLS.stop, glyph: "■", label: "Stop", act: () => { setMode("stop"); setElapsed(0); }, active: mode === "stop" },
    { key: "next", pos: CONTROLS.next, glyph: "⏭", label: "Next disc", act: () => onStep(1) },
    { key: "power", pos: CONTROLS.power, glyph: "⏻", label: "Power off — eject", act: onEject },
  ];

  return (
    <div className="pd-wrap">
      <div ref={box} className="pd" data-open={open ? "true" : "false"} data-mode={mode} style={{ aspectRatio: `${FRAME[0]} / ${FRAME[1]}` }}>
        <div className="pd-stage" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          {/* paper shadows */}
          <img className="pd-layer pd-shadow pd-shadow--closed" src="/player/closed_shadow.webp" alt="" draggable={false} />
          <img className="pd-layer pd-shadow pd-shadow--open" src="/player/open_shadow.webp" alt="" draggable={false} />

          {/* open base: palm-rest stickers, LCD, working buttons */}
          <img className="pd-layer pd-base" src="/player/open_base.webp" alt="" draggable={false} />
          <Plane cls="pd-plane pd-plane--base" w={PLANE_W} h={PLANE_H} t={planes.base.t}>
            {BASE_STICKERS.map((s) => (
              <StickerButton key={s.name} s={s} onPick={onPick} onHover={onHoverSticker} />
            ))}
            {/* LCD status window */}
            <div className="pd-lcd" style={{ width: planes.lcd.w, height: planes.lcd.h, transform: planes.lcd.t }}>
              <span className="pd-lcd__mode">{on ? (mode === "stop" ? "STOP" : mode === "pause" ? "PAUSE" : "PLAY") : "—"}</span>
              <span className="pd-lcd__time">{on && mode !== "stop" ? clock : "--:--"}</span>
            </div>
            {controls.map((c) => {
              const p = uv(c.pos);
              return (
                <button
                  key={c.key}
                  type="button"
                  className="pd-btn"
                  data-key={c.key}
                  data-active={c.active ? "true" : "false"}
                  aria-label={c.label}
                  title={c.label}
                  style={{ left: p.x, top: p.y, width: btn, height: btn }}
                  onClick={c.act}
                >
                  <span className="pd-btn__glyph">{c.glyph}</span>
                </button>
              );
            })}
          </Plane>

          {/* lid (rises from the hinge) */}
          <img className="pd-layer pd-lid" src="/player/open_lid.webp" alt="" draggable={false} style={{ transformOrigin: `${planes.hinge.x}px ${planes.hinge.y}px` }} />
          <Plane cls="pd-plane pd-plane--screen" w={planes.screen.w} h={planes.screen.h} t={planes.screen.t}>
            <div className="pd-screen" data-on={on ? "true" : "false"} data-mode={mode}>
              {item?.poster && (
                <>
                  <img className="pd-screen__fill" src={item.poster} alt="" draggable={false} />
                  <img className="pd-screen__poster" src={item.poster} alt={item.title} draggable={false} />
                </>
              )}
              {!item?.poster && item && <span className="pd-screen__blank">{item.title}</span>}
              {/* stopped: the player's idle card */}
              <div className="pd-screen__idle">
                <span className="pd-screen__brand">KATE™ <small>DVD</small></span>
                <span className="pd-screen__hint">{item ? "DISC IN · PRESS ▶" : "NO DISC"}</span>
              </div>
              <span className="pd-osd pd-osd--tl">{modeLabel}</span>
              <span className="pd-osd pd-osd--tr">{mode !== "stop" ? clock : ""}</span>
              <span className="pd-osd pd-osd--br">
                {index !== null ? `${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")} · ` : ""}
                {item?.title}{item?.year ? ` · ${item.year}` : ""}
              </span>
              <span className="pd-screen__scan" aria-hidden="true" />
              <span className="pd-screen__glare" aria-hidden="true" />
            </div>
          </Plane>

          {/* shut body: engraving + label + lid stickers */}
          <img className="pd-layer pd-closed" src="/player/closed.webp" alt="KATE™ PD-001 portable player" draggable={false} />
          <Plane cls="pd-plane pd-plane--lid" w={PLANE_W} h={PLANE_H} t={planes.lid.t}>
            <span className="pd-engrave" style={{ left: uv(ENGRAVING.kate).x, top: uv(ENGRAVING.kate).y }}>KATE<sup>™</sup></span>
            <span className="pd-label" style={{ left: uv(ENGRAVING.label).x, top: uv(ENGRAVING.label).y }}>PD-001</span>
            {LID_STICKERS.map((s) => (
              <StickerButton key={s.name} s={s} onPick={onPick} onHover={onHoverSticker} />
            ))}
          </Plane>
        </div>
      </div>

      <p className="pd-controls" style={{ fontFamily: mono }}>
        <button type="button" onClick={onEject} className="pd-eject">Eject</button>
        <span aria-hidden="true">·</span>
        <span>⏻ on the player also ejects</span>
      </p>
    </div>
  );
}

function Plane({ cls, w, h, t, children }: { cls: string; w: number; h: number; t: string; children: React.ReactNode }) {
  return <div className={cls} style={{ width: w, height: h, transform: t } as CSSProperties}>{children}</div>;
}

function StickerButton({ s, onPick, onHover }: { s: Sticker; onPick: (n: string) => void; onHover: StickerHover }) {
  const w = s.w * PLANE_W;
  return (
    <button
      type="button"
      className="pd-sticker"
      data-sticker={s.name}
      aria-label={`Put in the ${s.name.replace(/-/g, " ")} disc`}
      style={{ left: s.u * PLANE_W, top: s.v * PLANE_H, width: w, transform: `translate(-50%, -50%) rotate(${s.rot}deg)` }}
      onClick={() => onPick(s.name)}
      onMouseEnter={() => onHover(s.name)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(s.name)}
      onBlur={() => onHover(null)}
    >
      <img src={`/player/stickers/${s.name}.webp`} alt="" draggable={false} />
    </button>
  );
}
