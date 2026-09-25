"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import type { WatchItem } from "@/lib/content";
import DiscBody from "@/components/DiscBody";
import { OFFDUTY_EVENT } from "./BikeComputer";

// Off Duty's corner of the room: against the wall, well left of the case
// (past the plate's own left edge, on the room's extension), the series
// live in a zip-around CD wallet standing open like a book, and a cream
// PD-001 stands to its right, always open, its disc bay waiting.
//
// Box px, as the trophy: x across, z out from the case's plane (the wall is
// at z -269), everything standing on the desk line (y 656).

// The wallet: its spine against the wall at x -900, 32 cm tall (346 px).
// Three stills cut from one Higgsfield shot: the spine, a flat strip 3 cm
// across (34 px) facing the room, and a half hinged at each of its edges,
// swung 35° toward the room so the wallet stands on its own and its inside
// faces the camera (815 / 99 / 847 × 1000 stills).
export const WALLET = { x: -900, z: -255, h: 346, open: 35 };
const WL = Math.round(WALLET.h * 815 / 1000);
const SP = Math.round(WALLET.h * 99 / 1000);
const WR = Math.round(WALLET.h * 847 / 1000);
export { WL as WALLET_L, WR as WALLET_R, SP as WALLET_SPINE };
// The pegs the sleeves hang on: twelve down the spine, 2.6 px right of its
// middle, the first 60.5 px from the top and 16.5 px apart (measured off the
// spine's still).
const PEG = 2.6;
const PEGS = { first: 60.5, step: 16.5, n: 12 };
// It stands on its zip, 88% of the way down the stills; the pull below
// that lies on the desk.
const WALLET_FOOT = 0.88;

// The player: 26 cm across (280 px), in front of the wallet and a little
// right of it, standing on the desk as three planes cut from one
// Higgsfield still (its disc lid broken off, as Kate asked): the base's top
// lying flat (1000 × 713, unwarped from the photo so its spindle is round —
// 26 × 18.5 cm), its front edge (1000 × 74) and the lid with the screen
// (1000 × 763), hinged at the base's back edge and leaning back 10°.
export const DVD = { x: -500, z: -120, w: 280 };
const BD = Math.round(DVD.w * 713 / 1000);    // base depth
const FH = Math.round(DVD.w * 74 / 1000);     // base thickness
const LH = Math.round(DVD.w * 763 / 1000);    // lid height
const LEAN = 10;
export const DVD_DEPTH = BD;
// The spindle on the base's top, % of it, and a 12 cm disc on it (46% of
// the player across).
const BAY = { x: 48.7, y: 58.2, w: 46 };
const FLY_MS = 900;

// Stickers on the bezel round the screen (the screen is 9.1 / 9.6 %,
// 81.5 × 56.6 % of the lid; the speakers sit under it at either end):
// fan-made, from PD-001's own sheet. Position is the sticker's centre,
// size its width, both % of the lid.
const STICKERS = [
  { src: "trust-no-one", x: 38, y: 4.9, w: 15, r: -2 },
  { src: "kaz-2y5", x: 62, y: 5, w: 11, r: 3 },
  { src: "umbrella", x: 42, y: 80, w: 14, r: -8 },
  { src: "beavers", x: 60, y: 81, w: 13, r: 6 },
  { src: "chakram", x: 93, y: 7, w: 8, r: 12 },
  { src: "wolf-medallion", x: 8, y: 90, w: 6, r: -6 },
] as const;

const come = () => {
  if (document.documentElement.dataset.desk !== "offduty") dispatchEvent(new Event(OFFDUTY_EVENT));
};
const here = () => document.documentElement.dataset.desk === "offduty";

// The sleeves: matte PVC refills hung on the spine's pegs by a clear
// punched strip, four discs to a pocket (2 × 2), a pocket each side of a
// spread — eight series a spread. Box px: hinged at the pegs, 278 across,
// 266 tall from 17 below the top; the strip runs 6 px either side of the
// pegs, so both sleeves of a spread hang on the same holes.
const SLEEVE = { w: 278, strip: 6, top: 17, h: 266 };
const PER = 4;
const TURN_MS = 640;   // folds flat to the pegs, then opens on the other side

// The sleeves still underneath one: their edges stand out past its far
// edge and its foot, a step each, so the wallet shows how much is left to
// turn (right) and how much has been (left).
const stack = (n: number, dir: 1 | -1) =>
  Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    return `calc(${dir * k * 3.4} * var(--u)) calc(${k * 1.8} * var(--u)) 0 calc(-.3 * var(--u)) rgba(232, 240, 234, ${0.78 - i * 0.1}), ` +
      `calc(${dir * (k * 3.4 + .8)} * var(--u)) calc(${k * 1.8 + .8} * var(--u)) 0 calc(-.3 * var(--u)) rgba(16, 32, 22, .45)`;
  }).join(", ") || "0 0 transparent";

function Sleeve({ items, out, under = 0, dir = 1, onPick }: {
  items: WatchItem[]; out?: string; under?: number; dir?: 1 | -1; onPick: (s: WatchItem, from: DOMRect) => void;
}) {
  const track = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    e.currentTarget.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const untrack = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.removeProperty("--px");
    e.currentTarget.style.removeProperty("--py");
  };
  return (
    <div className="od-sleeve" style={{
      "--strip": SLEEVE.strip, "--stack": stack(under, dir),
      "--holes": PEGS.first - SLEEVE.top - PEGS.step / 2, "--hole-step": PEGS.step, "--hole-n": PEGS.n,
    } as CSSProperties}>
      <span className="od-sleeve__strip" aria-hidden />
      <div className="od-sleeve__pockets">
      {Array.from({ length: PER }, (_, i) => items[i]).map((s, i) => (
        <div className="od-sleeve__cell" key={s?.title ?? i}>
          {s && s.title !== out && (
            <button type="button" className="cd od-disc" tabIndex={-1} aria-label={s.title}
              onPointerMove={track} onPointerLeave={untrack}
              onClick={(e) => { if (!here()) return; e.stopPropagation(); onPick(s, e.currentTarget.getBoundingClientRect()); }}>
              <DiscBody poster={s.disc ?? s.poster} title={s.title} />
            </button>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}

/** The series in the wallet: the spread it is open at, and a sleeve turning
 *  over the spine when it changes (clicks on a side's margin, or ← →). */
function useSpreads(n: number) {
  const [at, setAt] = useState(0);
  const [turn, setTurn] = useState<null | { dir: 1 | -1; to: number }>(null);
  const spreads = Math.max(1, Math.ceil(n / (PER * 2)));
  const go = (dir: 1 | -1) => {
    if (turn) return;
    const to = at + dir;
    if (to < 0 || to >= spreads) return;
    setTurn({ dir, to });
    setTimeout(() => { setAt(to); setTurn(null); }, TURN_MS);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = document.documentElement;
      if (root.dataset.desk !== "offduty" || root.dataset.deskFocus) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });
  return { at, turn, go, spreads };
}

export default function OffDutyShelf() {
  const [series, setSeries] = useState<WatchItem[]>([]);
  const [picked, setPicked] = useState<WatchItem | null>(null);
  // A disc with a clip plays it on the screen (YouTube's own player, muted,
  // as a browser will only start a video by itself that way); a click on
  // the screen gives it sound. It runs only while the camera is here.
  const [atCorner, setAtCorner] = useState(false);
  // The disc whose clip has sound: another disc, or leaving the corner,
  // mutes it again.
  const [soundFor, setSoundFor] = useState<WatchItem | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const here = root.dataset.desk === "offduty";
      setAtCorner(here);
      if (!here) setSoundFor(null);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk"] });
    return () => mo.disconnect();
  }, []);
  const sound = atCorner && picked !== null && soundFor === picked;
  // Sound goes on and off in the running player, through YouTube's iframe
  // API (enablejsapi): it used to reload the whole player with sound on at
  // the second it had reached, scripts, buffering and all. The click on the
  // screen is the gesture the browser wants before a page may unmute.
  const tube = useRef<HTMLIFrameElement>(null);
  const tell = (func: string, args: unknown[] = []) =>
    tube.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  const toggleSound = () => {
    if (sound) tell("mute");
    else { tell("unMute"); tell("setVolume", [100]); tell("playVideo"); }
    setSoundFor(sound ? null : picked);
  };
  const clip = atCorner ? picked?.clip : null;
  const [flight, setFlight] = useState<null | { item: WatchItem; from: DOMRect; to: DOMRect }>(null);
  const bay = useRef<HTMLSpanElement>(null);
  const flyer = useRef<HTMLDivElement>(null);
  // A disc taken out of its pocket flies over to the player and settles on
  // the spindle; the screen comes on when it is down. It flies outside the
  // room (a portal on <body>), from where it was on screen to the bay.
  const pick = (item: WatchItem, from: DOMRect) => {
    // the bay's disc-sized square on the base, as the camera sees it
    const to = bay.current?.getBoundingClientRect();
    if (!to || flight) return;
    setPicked(null);
    setFlight({ item, from, to });
  };
  useEffect(() => {
    const el = flyer.current;
    if (!flight || !el) return;
    const { from, to } = flight;
    const at = (r: DOMRect, sy = 1, rot = 0) =>
      `translate(${r.left}px, ${r.top}px) scale(${r.width / from.width}) scaleY(${sy}) rotate(${rot}deg)`;
    // straight across and down onto the spindle, laying itself flat on the way
    const a = el.animate([
      { transform: at(from) },
      { transform: at(to, to.height / to.width, 200) },
    ], { duration: FLY_MS, easing: "cubic-bezier(.5, 0, .3, 1)", fill: "forwards" });
    a.onfinish = () => { setPicked(flight.item); setFlight(null); };
    return () => a.cancel();
  }, [flight]);
  useEffect(() => {
    let on = true;
    // filed newest first; titles in a year alphabetically, undated at the back
    const byYear = (a: WatchItem, b: WatchItem) =>
      (b.year ?? -1) - (a.year ?? -1) || a.title.localeCompare(b.title);
    fetch("/api/series").then((r) => r.json()).then((d: WatchItem[]) => on && setSeries([...d].sort(byYear))).catch(() => {});
    return () => { on = false; };
  }, []);
  const { at, turn, go, spreads } = useSpreads(series.length);
  // Decode the corner's pictures before the camera comes: this is built while
  // home sits idle (DeskScene's useStops), and a picture is otherwise only
  // decoded when it first enters the frame — mid-flight, which is where the
  // move hitched and the wallet showed grey. The wallet and the player are
  // decoded as the elements they are; the open spread's labels (CSS
  // backgrounds on the discs) through images of the same files.
  useEffect(() => {
    if (!series.length) return;
    const run = () => {
      document.querySelectorAll<HTMLImageElement>(".od-wallet img, .od-dvd img").forEach((i) => { i.decode().catch(() => {}); });
      series.slice(at * PER * 2, at * PER * 2 + PER * 2).forEach((s) => {
        const src = s.disc ?? s.poster;
        if (!src) return;
        const im = new Image();
        im.src = src;
        im.decode().catch(() => {});
      });
    };
    const id = typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(run, { timeout: 3000 }) : window.setTimeout(run, 300);
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id as number); else clearTimeout(id as number);
    };
  }, [series, at]);
  const page = (spread: number, side: 0 | 1) => series.slice(spread * PER * 2 + side * PER, spread * PER * 2 + side * PER + PER);
  // under a turning sleeve the halves already show where it is going on the
  // side it leaves, and where it came from on the side it lands on
  const leftAt = turn && turn.dir === -1 ? turn.to : at;
  const rightAt = turn && turn.dir === 1 ? turn.to : at;
  // a sleeve hung at the pegs, lying along the left or the right half
  const hang = (k: "l" | "r") => ({
    [k === "l" ? "right" : "left"]: `calc(${k === "l" ? -PEG : PEG} * var(--u))`,
    top: `calc(${SLEEVE.top} * var(--u))`, width: `calc(${SLEEVE.w} * var(--u))`, height: `calc(${SLEEVE.h} * var(--u))`,
    "--open": `${k === "l" ? WALLET.open : -WALLET.open}deg`,
  }) as CSSProperties;
  const out = (flight?.item ?? picked)?.title;

  return (
    <>
      <div
        className="od-wallet"
        onClick={come}
        style={{
          left: `calc(${WALLET.x} * var(--u))`, top: `calc(${656 - WALLET.h * WALLET_FOOT} * var(--u))`,
          height: `calc(${WALLET.h} * var(--u))`,
          transform: `translateZ(calc(${WALLET.z} * var(--u)))`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="od-wallet__spine" src="/items/off-duty/wallet-spine.webp" alt="" draggable={false}
          style={{ left: `calc(${-SP / 2} * var(--u))`, width: `calc(${SP} * var(--u))` }} />
        <div className="od-wallet__half od-wallet__half--l" style={{
          right: `calc(${SP / 2} * var(--u))`, width: `calc(${WL} * var(--u))`, transform: `rotateY(${WALLET.open}deg)`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/items/off-duty/wallet-l3.webp" alt="" draggable={false} />
        </div>
        <div className="od-wallet__half od-wallet__half--r" style={{
          left: `calc(${SP / 2} * var(--u))`, width: `calc(${WR} * var(--u))`, transform: `rotateY(${-WALLET.open}deg)`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/items/off-duty/wallet-r3.webp" alt="" draggable={false} />
        </div>
        {/* the sleeves on the pegs: one lying on each half, and, while the
            spread changes, the one being turned — it folds flat against
            the pegs on the side it leaves and opens out on the other */}
        {([
          ["l", leftAt, 0, go.bind(null, -1)],
          ["r", rightAt, 1, go.bind(null, 1)],
        ] as const).map(([k, spread, side, turnTo]) => (
          <div key={k} className={`od-hang od-hang--${k}`} style={hang(k)}
            onClick={(e) => { if (here()) { e.stopPropagation(); turnTo(); } }}>
            <Sleeve items={page(spread, side)} out={out} onPick={pick}
              dir={side === 1 ? 1 : -1} under={side === 1 ? spreads - 1 - spread : spread} />
          </div>
        ))}
        {turn && (
          <>
            <div className={`od-hang od-hang--${turn.dir === 1 ? "r" : "l"} od-hang--fold`} key={`f${at}${turn.to}`} style={hang(turn.dir === 1 ? "r" : "l")}>
              <Sleeve items={page(at, turn.dir === 1 ? 1 : 0)} out={out} onPick={pick} />
            </div>
            <div className={`od-hang od-hang--${turn.dir === 1 ? "l" : "r"} od-hang--unfold`} key={`u${at}${turn.to}`} style={hang(turn.dir === 1 ? "l" : "r")}>
              <Sleeve items={page(turn.to, turn.dir === 1 ? 0 : 1)} out={out} onPick={pick} />
            </div>
          </>
        )}
      </div>

      <div className="od-dvd" data-on={picked ? "" : undefined} onClick={come}>
        {/* the lid, hinged at the base's back edge */}
        <div className="od-dvd__lid" style={{
          left: `calc(${DVD.x - DVD.w / 2} * var(--u))`, top: `calc(${656 - FH - LH} * var(--u))`,
          width: `calc(${DVD.w} * var(--u))`, height: `calc(${LH} * var(--u))`,
          transform: `translateZ(calc(${DVD.z} * var(--u))) rotateX(${LEAN}deg)`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/items/off-duty/dvd-lid.webp" alt="" draggable={false} />
          <div className="od-dvd__screen" aria-live="polite" data-clip={clip ? "" : undefined}
            onClick={(e) => { if (clip && here()) { e.stopPropagation(); toggleSound(); } }}>
            {picked?.poster && <span className="od-dvd__picture" key={picked.title} style={{ backgroundImage: `url(${picked.poster})` }} />}
            {clip && (
              <iframe
                ref={tube} key={clip} className="od-dvd__tube" data-sound={sound || undefined} title={`${picked?.title} — clip`}
                src={`https://www.youtube-nocookie.com/embed/${clip}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&iv_load_policy=3&loop=1&playlist=${clip}&enablejsapi=1`}
                allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
            <span className="od-dvd__osd">{picked ? (clip ? (sound ? "▶ PLAY · SOUND ON" : "▶ PLAY · CLICK FOR SOUND") : "▶ PLAY") : "KATE™ DVD"}</span>
            {picked
              ? <span className="od-dvd__osd od-dvd__osd--title">{picked.title}{picked.year ? ` · ${picked.year}` : ""}</span>
              : <span className="od-dvd__osd od-dvd__osd--blink">NO DISC</span>}
          </div>
          {STICKERS.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s.src} className="od-dvd__sticker" src={`/player/stickers/${s.src}.webp`} alt="" draggable={false}
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, transform: `translate(-50%, -50%) rotate(${s.r}deg)` }} />
          ))}
        </div>
        {/* the base's top, lying on it; the disc goes onto its spindle */}
        <div className="od-dvd__base" style={{
          left: `calc(${DVD.x - DVD.w / 2} * var(--u))`, top: `calc(${656 - FH} * var(--u))`,
          width: `calc(${DVD.w} * var(--u))`, height: `calc(${BD} * var(--u))`,
          transform: `translateZ(calc(${DVD.z} * var(--u))) rotateX(90deg)`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/items/off-duty/dvd-base.webp" alt="" draggable={false} />
          <span ref={bay} className="od-dvd__bay" style={{ left: `${BAY.x}%`, top: `${BAY.y}%`, width: `${BAY.w}%` }} aria-hidden>
            {picked && <DiscBody poster={picked.disc ?? picked.poster} title={picked.title} />}
          </span>
        </div>
        {/* its left end, which the camera sees from where it stands */}
        <span className="od-dvd__side" aria-hidden style={{
          left: `calc(${DVD.x - DVD.w / 2} * var(--u))`, top: `calc(${656 - FH} * var(--u))`,
          width: `calc(${BD} * var(--u))`, height: `calc(${FH} * var(--u))`,
          transform: `translateZ(calc(${DVD.z} * var(--u))) rotateY(-90deg)`,
        }} />
        {/* its front edge */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="od-dvd__face" src="/items/off-duty/dvd-face2.webp" alt="" draggable={false} style={{
          left: `calc(${DVD.x - DVD.w / 2} * var(--u))`, top: `calc(${656 - FH} * var(--u))`,
          width: `calc(${DVD.w} * var(--u))`, height: `calc(${FH} * var(--u))`,
          transform: `translateZ(calc(${DVD.z + BD} * var(--u)))`,
        }} />
      </div>
      {flight && createPortal(
        <div ref={flyer} className="od-fly" style={{ width: flight.from.width, height: flight.from.height }} aria-hidden>
          <DiscBody poster={flight.item.disc ?? flight.item.poster} title={flight.item.title} />
        </div>,
        document.body,
      )}
    </>
  );
}
