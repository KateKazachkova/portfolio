"use client";

import { useEffect, useRef, useState } from "react";
import { U15File, U15_CLOSE, U15_CLOSED, U15_OPEN, U15_RESET } from "./desk/U15File";
import AwardRail from "@/components/AwardRail";
import { StackDressing } from "@/components/desk/CaseStack";
import { ELSEWHERE } from "@/components/desk/stacks";
import { useWarm } from "@/components/desk/useWarm";
import DeskBinder, { PROFILE_EVENT } from "@/components/profile/DeskBinder";
import BikeComputer, { OFFDUTY_EVENT } from "@/components/desk/BikeComputer";
import BookShelf from "@/components/desk/BookShelf";
import TapeStacks from "@/components/desk/TapeStacks";
import Helmet from "@/components/desk/Helmet";
import DeskComic from "@/components/desk/DeskComic";
import OffDutyShelf, { WALLET, WALLET_L, WALLET_R, WALLET_SPINE, WALLET_REACH, DVD, DVD_DEPTH } from "@/components/desk/OffDutyShelf";
// the desk in the wallet's V: its feet from the spine, the spine's place across
const V = { ...WALLET_REACH, d: Math.max(WALLET_REACH.dl, WALLET_REACH.dr), sx: (WALLET_REACH.l / (WALLET_REACH.l + WALLET_REACH.r)) * 100 };
import { prefersReducedMotion } from "@/lib/reducedMotion";
import { glOn, onGl } from "@/lib/room/flag";
import { EASE, FILES_SPD, isPano, PANO, PANO_TRIM_L, PANO_WIDE, panoOf, pfZoom, rowX, SINGLE_Q } from "@/lib/room/pose";

/**
 * The desk the case stands on at night, as a room the camera can move in.
 *
 * At rest this is the same picture the flat plate used to be: the planes are
 * laid out in render_desk.py's camera (f 2150 px/m, eye 0.40 m above the desk,
 * the case's base 2 m away, the desk's vanishing point on the case's centre
 * line at (560, 226) of the 1118 × 745 box), and their textures are that
 * plate projected back onto them (delete/render_desk3d.py). Everything is in
 * the box's own px, scaled to its real width through --u (see .scene-cam).
 *
 * Case Files moves the camera instead of the page: it rises to 0.8 m over the
 * row of case files and looks straight down (90°), then pans along it, the case leaves
 * past the top of the frame, and the case files — lying on the desk all
 * along, slivers in front of the case — fill the view. The URL
 * becomes /#case-files, so Back, Escape or Case Files again bring it home.
 * The desk is home's scene in every theme. The prototype this came from is
 * public/proto/desk.html.
 *
 * Recognition is the same camera's second stop: it stays at the case's eye
 * height, dollies in and to the right and tips down 12°, so the frame is the
 * wall behind the case with a strip of desk under it, the Davey trophy
 * standing there on the left (the case's edge just in shot beside it) and the
 * wall to its right for the rest of the recognition. The URL becomes
 * /#recognition, and it closes the same ways.
 *
 * Profile is the third: the camera comes down over the yellow binder lying
 * in front of the certificate and looks straight down on it, as it does on
 * the case files. /#profile.
 *
 * Off Duty is the fourth, Recognition the other way: the camera stays at
 * the case's eye height, slides left past the clock to the room's far left
 * end and tips down 8°, onto the wall there with a strip of desk: the CD
 * wallet standing open against it, the cream PD-001 to its right, the bike
 * computer lying on the desk in front. A click on the unit brings the
 * camera down over it, straight down and low, so its screen (live from
 * Strava) reads; Escape goes back up. /#off-duty.
 */

// The case files. Ukrainska 15 is its folder; the rest, until each becomes
// its own kind of object, lie as their library cards of awards
// (components/desk/AwardStack), and Atumatu, with no awards and its case on
// Behance, as a print on a swatch of fabric. Sizes are desk px (1075 per
// metre), roughly the real objects.
// x, y are the centre on the desk plane from its left/back corner.
//
// They lie in one row along the desk, laid down by hand rather than on a
// grid, starting just right of the nav column. From the camera's end height
// they are ~2.5 screen px per desk px — more than fits across the window,
// which is why the camera pans along the row (see the pan in useDeskCamera).
const CASES = [
  { slug: "ukrainska-15", title: "Ukrainska 15", img: "envelope", w: 172.5, h: 239, x: 1370, y: 682.5, r: -3 },
  { slug: "bulksource", title: "BulkSource", img: "stack", w: 180, h: 120, x: 1609, y: 675, r: 3 },
  { slug: "onsisoft", title: "OnsiSoft", img: "stack", w: 180, h: 120, x: 1879, y: 680, r: -2 },
  { slug: "waypro", title: "WayPro", img: "stack", w: 180, h: 120, x: 2149, y: 672, r: 2 },
  // no awards, its case on Behance: a print on a swatch (CaseStack)
  { slug: "atumatu", title: "Atumatu", img: "stack", w: 180, h: 120, x: 2440, y: 678, r: -2 },
] as const;

// The first click brings the camera to a card; then its rows open the
// winner pages.
function CaseCard({ c }: { c: Exclude<(typeof CASES)[number], { img: "envelope" }> }) {
  // the objects' pictures wait for the room's own first paint (useWarm)
  const warm = useWarm();
  const pic = (src: string) => (warm ? src : undefined);
  return (
    <div
      className="desk-card desk-card--stack"
      data-slug={c.slug}
      data-x={c.x}
      aria-label={`${c.title} – ${ELSEWHERE[c.slug] ? `on ${ELSEWHERE[c.slug].where}` : "awards"}`}
      style={{
        left: `calc(${c.x} * var(--u))`, top: `calc(${c.y} * var(--u))`,
        "--w": c.w, "--h": c.h, "--r": `${c.r}deg`,
      } as React.CSSProperties}
    >
      {/* no "Read the case" yet: each note says the case study is in progress */}
      <StackDressing slug={c.slug} title={c.title} pic={pic} />
    </div>
  );
}

const VIEW_X = 1412.5;             // desk x under the camera's axis at pan 0 (the -200 in globals.css)
// (a file laid out at x lies on the desk at rowX(x): .desk-cases is scaled,
// and the camera's pan to it goes there)
// The row's last: the way to every case file (/work, Case Studies). A plain
// card for now, its own folder later (Kate, 01.10). Clear of Atumatu's
// print when that stack is laid out.
// (Case Studies, the card at the row's end, is not on the live site yet)
const LAST = CASES[CASES.length - 1];
const ROW_END = rowX(LAST.x + LAST.w / 2 + 70); // right edge of the row's last, plus a margin

export const DESK_EVENT = "kate:case-files";
/** The desk hint's "Put the file away": the case in focus goes back. */
const PUT_AWAY = "kate:desk-put-away";
export const AWARD_EVENT = "kate:recognition";
export { PROFILE_EVENT, OFFDUTY_EVENT };
type View = "files" | "award" | "profile" | "offduty";
const HASH: Record<View, string> = { files: "#case-files", award: "#recognition", profile: "#profile", offduty: "#off-duty" };
// html[data-desk] for each view; "open" is the desk's, from before it had a second
const STATE: Record<View, string> = { files: "open", award: "award", profile: "profile", offduty: "offduty" };
const viewOf = (hash: string) =>
  (Object.keys(HASH) as View[]).find((v) => HASH[v] === hash) ?? null;

// The Davey trophy, standing on the desk against the wall right of the case:
// 56 cm tall (600 box px), its front 7 cm off the wall (z -190), and far
// enough right that from the case's camera the window's edge cuts it about
// in half at 1512px (x is its centre).
const AWARD = { x: 1240, h: 600, z: -190 };
const AWARD_W = Math.round(AWARD.h * 1033 / 3590);   // the still's own aspect
// The latest certificate (Indigo, Women in Design 2026), framed and
// standing on the desk against the wall at the right end of the awards:
// 43 × 32 cm, leaning back 4° with its top just short of the wall: the foot
// stands h·sin(lean) + 3 px out from it (the wall is at z -269), so the top
// edge never passes behind the wall and gets cut off.
// x: just clear of Agora's ribbons low on the lattice (AwardRail's SPOT).
const CERT = { x: 2325, w: 460, h: 339, lean: 4 };
const CERT_Z = Math.round(-269 + CERT.h * Math.sin(CERT.lean * Math.PI / 180) + 3);
// how far its shadow falls on the wall, 8 cm behind it (box px)
const CAST = { x: 34, y: 20 };

/** The stops home cannot see — Profile's binder, Off Duty's corner, the
 *  awards on the wall — are not built with the page. Home loads first; then,
 *  each time the browser is idle, the next one joins the room, in the
 *  index's order. The camera setting off for one builds it at once, so a
 *  visitor quick off the mark (or arriving at /#off-duty) never waits for
 *  the queue: its things load during the camera's move. */
type Stop = "profile" | "offduty" | "award";
const STOP_ORDER: Stop[] = ["profile", "offduty", "award"];
const STOP_OF: Record<string, Stop> = { profile: "profile", offduty: "offduty", award: "award" };
function useStops() {
  const [ready, setReady] = useState<ReadonlySet<Stop>>(() => new Set());
  useEffect(() => {
    const add = (s: Stop) => setReady((r) => (r.has(s) ? r : new Set(r).add(s)));
    const root = document.documentElement;
    const now = () => { const s = STOP_OF[root.dataset.desk ?? ""]; if (s) add(s); };
    now();
    const mo = new MutationObserver(now);
    mo.observe(root, { attributes: true, attributeFilter: ["data-desk"] });
    const idle = (cb: () => void) => typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(cb, { timeout: 4000 })
      : setTimeout(cb, 400);
    let i = 0;
    let alive = true;
    const next = () => { if (!alive || i >= STOP_ORDER.length) return; add(STOP_ORDER[i++]); idle(next); };
    const start = () => idle(next);
    if (document.readyState === "complete") start(); else window.addEventListener("load", start, { once: true });
    return () => { alive = false; mo.disconnect(); window.removeEventListener("load", start); };
  }, []);
  // Built while the camera is already at the wall, the ribbons missed the
  // tab stops the camera hands out on arrival.
  useEffect(() => {
    if (document.documentElement.dataset.desk === "award")
      document.querySelectorAll<HTMLElement>(".award-ribbon, .desk-cert").forEach((a) => (a.tabIndex = 0));
  }, [ready]);
  return ready;
}

// the room's extensions past the plate: right of it where Recognition looks,
// left where Off Duty does, twice each way for wide windows (globals.css)
const EXTS = ["desk-ext desk-side-r", "desk-extl desk-side-l", "desk-ext2 desk-side-r", "desk-extl2 desk-side-l"];

export function DeskPlanes({ children }: { children?: React.ReactNode }) {
  const ready = useStops();
  return (
    <div className="desk-world">
      <div className="desk-plane desk-wall" aria-hidden>
        {/* the trophy's shadow thrown back onto the wall behind it: the key
            is above, in front and to the left, so it lands down and to the
            right of the trophy, as the case's own does (render_desk.py).
            Wall px are box x + 1052.5 across, box y + 144 down; the desk
            line at the wall's foot cuts it off. */}
        <div className="desk-award-cast" style={{
          left: `calc(${AWARD.x - AWARD_W / 2 + CAST.x + 1052.5} * var(--u))`,
          top: `calc(${656 - AWARD.h + CAST.y + 144} * var(--u))`,
          width: `calc(${AWARD_W} * var(--u))`, height: `calc(${AWARD.h} * var(--u))`,
        }} />
      </div>
      {/* the room past the plate's edges, twice each way (globals.css .desk-side-r / -l) */}
      {EXTS.map((e) => <div key={e} className={`desk-plane desk-wall ${e}`} aria-hidden />)}
      {/* the wall once more, bare, over both halves of it: what hangs there
          runs across the seam and must not be covered by the extension */}
      <div className="desk-plane desk-wall desk-wall--hung">
        {ready.has("award") && <AwardRail />}
      </div>
      {ready.has("award") && (
      <a
        className="desk-cert" href="https://www.indigoaward.com/women-in-design/winners/AB9HJF" target="_blank" rel="noopener noreferrer"
        tabIndex={-1} aria-label="Indigo Design Award – Women in Design, shortlisted 2026 (its page on Indigo)"
        style={{
          left: `calc(${CERT.x - CERT.w / 2} * var(--u))`, top: `calc(${656 - CERT.h} * var(--u))`,
          width: `calc(${CERT.w} * var(--u))`, height: `calc(${CERT.h} * var(--u))`,
          transform: `translateZ(calc(${CERT_Z} * var(--u))) rotateX(${CERT.lean}deg)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/artefacts/cert-indigo-women-in-design-2026.webp" alt="" draggable={false} />
      </a>
      )}
      {EXTS.flatMap((e) => ["desk-top", "desk-ply"].map((p) => <div key={p + e} className={`desk-plane ${p} ${e}`} aria-hidden />))}
      <div className="desk-plane desk-top">
        <div className="desk-shadow" aria-hidden />
        {/* the trophy's contact shadow, on the desk under its base (desk-top
            px are box x + 1052.5 across, z + 269 out from the wall) */}
        <div className="desk-award-shadow" aria-hidden style={{
          left: `calc(${AWARD.x + 1052.5} * var(--u))`, top: `calc(${AWARD.z + 269} * var(--u))`,
          "--w": AWARD_W,
        } as React.CSSProperties} />
        <nav className="desk-cases" aria-label="Case files">
          {CASES.map((c) => c.img === "envelope" ? (
            <U15File key={c.slug} x={c.x} y={c.y} r={c.r} />
          ) : (
            <CaseCard key={c.slug} c={c} />
          ))}
        </nav>
        {/* the Profile, filed, in front of the certificate */}
        {ready.has("profile") && <DeskBinder />}
        {/* Off Duty: the contact shadows of the wallet and the player standing
            on the desk (desk-top px: box x + 1052.5, z + 269), and the bike
            computer lying in front of them */}
        {ready.has("offduty") && (<>
        {/* the desk inside the wallet's V, in the halves' shade: darkest at
            the spine, gone by the open end (its sides run under the feet) */}
        <div aria-hidden style={{
          position: "absolute", pointerEvents: "none",
          left: `calc(${WALLET.x + 1052.5 - V.l} * var(--u))`, top: `calc(${WALLET.z + 269} * var(--u))`,
          width: `calc(${V.l + V.r} * var(--u))`, height: `calc(${V.d} * var(--u))`,
          clipPath: `polygon(${V.sx}% 0, 0 ${(V.dl / V.d) * 100}%, 100% ${(V.dr / V.d) * 100}%)`,
          background: `radial-gradient(ellipse 70% 120% at ${V.sx}% 0, rgba(10,8,6,.55), rgba(10,8,6,.25) 45%, rgba(10,8,6,0) 85%)`,
        }} />
        {/* where each half's zip meets the desk: a dark line from the spine
            out along its foot, swung as far as the half is */}
        {([["l", -1], ["r", 1]] as const).map(([k, side]) => (
          <div key={k} className="od-foot" aria-hidden style={{
            left: `calc(${WALLET.x + 1052.5} * var(--u))`, top: `calc(${WALLET.z + 269} * var(--u))`,
            width: `calc(${(k === "l" ? WALLET_L : WALLET_R) + WALLET_SPINE / 2} * var(--u))`,
            transform: `rotate(${side === 1 ? WALLET.open : 180 - WALLET.open}deg)`,
          }} />
        ))}
        <div className="od-shadow" aria-hidden style={{
          left: `calc(${DVD.x + 1052.5 + 12} * var(--u))`, top: `calc(${DVD.z + DVD_DEPTH / 2 + 10 + 269} * var(--u))`, "--w": DVD.w * 1.15, "--h": DVD_DEPTH * 1.2,
        } as React.CSSProperties} />
        <BikeComputer />
        </>)}
      </div>
      {/* The trophy is a way in too: from home (where it peeks past the case)
          or the desk, a click takes the camera over to it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="desk-award" src="/items/davey-trophy-v2.webp" alt="" aria-hidden draggable={false}
        onClick={() => {
          if (document.documentElement.dataset.desk !== "award") window.dispatchEvent(new Event(AWARD_EVENT));
        }}
        style={{
          left: `calc(${AWARD.x - AWARD_W / 2} * var(--u))`, top: `calc(${656 - AWARD.h} * var(--u))`,
          width: `calc(${AWARD_W} * var(--u))`, height: `calc(${AWARD.h} * var(--u))`,
          transform: `translateZ(calc(${AWARD.z} * var(--u)))`,
        }}
      />
      <div className="desk-plane desk-ply" aria-hidden />
      <div className="desk-plane desk-under" aria-hidden />
      {/* Off Duty's corner, left of everything */}
      {ready.has("offduty") && <><OffDutyShelf /><BookShelf /><TapeStacks /><Helmet /><DeskComic /></>}
      {/* what home stands in the room itself: the flip clock */}
      {children}
    </div>
  );
}

/** The flat caption over the desk while it is in view: how to move along
 *  it, and which of the files is in front of you. Outside the 3D world
 *  (and outside .scene-cam, whose transform would capture position: fixed). */
export function DeskHint() {
  return (
    <div className="desk-hint">
      <span className="desk-hint__scroll" aria-hidden>← scroll →</span>
      <span className="desk-hint__swipe" aria-hidden>← swipe →</span>
      <span className="desk-counter" aria-hidden>1 / {CASES.length}</span>
      {/* With a file spread over the desk, the pill is a way back out of it */}
      <button type="button" className="desk-hint__close" onClick={() => dispatchEvent(new Event(PUT_AWAY))}>↓ Put the file away</button>
    </div>
  );
}

/** Drives the camera: toggles html[data-desk], keeps the lens shift that puts
 *  the camera's axis in the middle of the window, and owns the URL. */
export function useDeskCamera(cam: React.RefObject<HTMLDivElement | null>) {
  const open = useRef<View | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const el = cam.current;
    if (!el) return;
    // (a phone's panorama takes a finger anywhere over the page's room, not
    // only on the camera's box: under the WebGL room that is the stage alone)
    const surface = el.closest("main") ?? el;
    root.dataset.deskReady = "1";

    // The lens shift: how far the scene must slide for the camera's principal
    // point (560, 226 of the box) to land in the middle of the window.
    // Measured on the stage, not on .scene-cam: the camera's own shift is a
    // transform on .scene-cam, so its rect would include the shift it sets.
    const measure = () => {
      const r = (el.parentElement ?? el).getBoundingClientRect();
      const u = r.width / 1118;
      el.style.setProperty("--dx", `${innerWidth / 2 - (r.left + 560 * u)}px`);
      el.style.setProperty("--dy", `${innerHeight / 2 - (r.top + 226 * u)}px`);
      // under 1024 Profile looks at one page of the binder, as large as the
      // window takes it (globals.css, the WebGL room's pose)
      if (matchMedia(SINGLE_Q).matches) el.style.setProperty("--pfz", pfZoom(innerWidth, innerHeight, u).toFixed(4));
      else el.style.removeProperty("--pfz");
    };

    const cards = () => el.querySelectorAll<HTMLElement>(".desk-card:not(.desk-card--env), .u15-hit, .desk-player");

    // ── The pan: the camera slides along the desk (desk px, 0 … max) ──
    // Wheel (either axis), a drag of the desk, arrow keys, and focus all
    // move a target; a spring eases the camera onto it. Live only once the
    // camera has arrived — until then the move's own transition is running.
    let pan = 0, target = 0, raf = 0, arrived = false;
    // (off the stage, not the camera: a pinch scales the camera's box)
    const u = () => (el.parentElement ?? el).getBoundingClientRect().width / 1118;
    const maxPan = () => Math.max(0, ROW_END - (VIEW_X + (innerWidth / 2) / (spd() * u())));
    // On phones and tablets the wall's stops pan too, either side of where
    // they stand: as far as a 1440px window sees past theirs (Kate, 27.09).
    // Screen px per desk px there: ~1. (Profile does not: a swipe turns its page.)
    const single = matchMedia(SINGLE_Q);
    const narrow = () => single.matches;
    // the window's panorama: where its stops stand and its lens's zoom (1.35
    // on a phone, 1 on a tablet)
    const at = () => panoOf(innerWidth) ?? PANO_WIDE;
    // screen px per desk px over the desk (× --u)
    const spd = () => FILES_SPD;
    const spdNow = () => (open.current === "files" ? spd() : at().z);
    // (the wall's px per desk px is its zoom: reach is in desk px, as seen;
    // past the wall's stops as wide a window stands them, PANO, so a tablet's
    // stops further out do not slide it past the room's ends)
    const reach = () => Math.max(0, 720 - innerWidth / 2 / u() / spdNow());
    // ── The panorama under 1024 px (Kate, 01.10): home and the wall's two stops are
    // one strip of room, Off Duty on the left, Recognition on the right (PANO
    // and panoOf in lib/room/pose.ts). The camera is at x = at()[stop] + pan along it,
    // from Off Duty's reach to Recognition's; a finger slides it the whole
    // way, and the stop it is at follows x (zoneOf), changed on the way
    // without a move of its own (slideTo). The index's links slide it to
    // their stop (glideTo). Case Files and Profile stay moves of their own. ──
    // (null: home)
    const isPanoView = (v: View | null) => isPano(v ?? "home");
    const pano = () => narrow() && isPanoView(open.current);
    const baseOf = (v: View | null) => { const s = v ?? "home"; return isPano(s) ? at()[s] : 0; };
    const clamp = (v: number) => open.current === "files"
      ? Math.min(maxPan(), Math.max(0, v))
      : pano() ? Math.min(PANO.award + reach(), Math.max(PANO.offduty - Math.max(0, reach() - PANO_TRIM_L), baseOf(open.current) + v)) - baseOf(open.current)
      : Math.min(reach(), Math.max(-reach(), v));
    // the stop at x: past the halfway line to the next by 24 desk px before
    // it changes, so a finger resting on the line does not flick it to and fro
    const zoneOf = (x: number): View | null => {
      const cur = open.current, h = 24;
      const { offduty, home, award } = at();
      const l = (offduty + home) / 2 + (cur === "offduty" ? h : -h);
      const r = (home + award) / 2 + (cur === "award" ? -h : h);
      return x < l ? "offduty" : x > r ? "award" : null;
    };
    const counter = document.querySelector<HTMLElement>(".desk-counter");
    const paint = () => {
      // along the panorama, into another stop's half: the pan carried over
      // to that stop's own, so the camera stays where it is
      if (pano() && arrived) {
        const z = zoneOf(baseOf(open.current) + pan);
        if (z !== open.current) {
          const d = baseOf(open.current) - baseOf(z);
          pan += d; target += d; dragFrom += d;
          slideTo(z);
        }
      }
      // (the stage's size read before anything is written: no layout forced)
      const q = pano() ? u() : 0;
      el.style.setProperty("--pan", pan.toFixed(2));
      // (the world's x along it, for the stops' CSS and the page's case,
      // clock and lamp over the WebGL room, and how far that moves the case
      // on screen, for its caption under it: globals.css, room.css)
      if (q) {
        const px = -(baseOf(open.current) + pan);
        surface.style.setProperty("--pano-x", px.toFixed(2));
        surface.style.setProperty("--pano-shift", `${(px * q * at().z).toFixed(1)}px`);
      }
      if (counter && open.current === "files") {
        const centre = VIEW_X + pan + 120 / spd();
        let best = 0;
        CASES.forEach((c, i) => { if (Math.abs(rowX(c.x) - centre) < Math.abs(rowX(CASES[best].x) - centre)) best = i; });
        const text = `${best + 1} / ${CASES.length}`;
        if (counter.textContent !== text) counter.textContent = text;
      }
    };
    // with reduced motion the camera is simply where it is sent
    const still = prefersReducedMotion();
    // (under a finger or the mouse the desk stays with it: the spring only
    // brings it in after a flick, a wheel, a key or a click; a glide along
    // the panorama runs its own curve, in x)
    let glide: { from: number; to: number; t0: number; dur: number } | null = null;
    const tick = (now: number) => {
      if (glide) {
        const k = glide.dur > 0 ? Math.min(1, Math.max(0, (now - glide.t0) / glide.dur)) : 1;
        pan = target = glide.from + (glide.to - glide.from) * EASE.cam(k) - baseOf(open.current);
        if (k >= 1) glide = null;
      } else {
        pan = still || dragX !== null ? target : pan + (target - pan) * 0.16;
        if (Math.abs(target - pan) < 0.2) pan = target;
      }
      paint();
      raf = glide || pan !== target ? requestAnimationFrame(tick) : 0;
    };
    // The index's link to a stop along the panorama: the camera slides to
    // where that stop stands (its pan 0: the case with the doll in the
    // middle, the helmet half past the left edge, the trophy cut by it as
    // a wide window shows them), passing what lies between
    const glideTo = (v: View | null) => {
      resetZoom();
      const from = baseOf(open.current) + pan, to = baseOf(v);
      if (Math.abs(to - from) < 0.5) { glide = null; go(to - baseOf(open.current)); return; }
      glide = { from, to, t0: performance.now(), dur: still ? 0 : Math.min(1800, 700 + Math.abs(to - from) * 0.45) };
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const go = (v: number) => { target = clamp(v); if (!raf) raf = requestAnimationFrame(tick); };

    // ── Focus: one case laid out, the camera on it, the others moved aside
    // to either side (html[data-desk-focus], each card's data-side) ──
    const U15 = "ukrainska-15";
    let focus: string | null = null;
    const setFocus = (slug: string | null) => {
      if (focus === U15 && slug !== U15) dispatchEvent(new Event(U15_CLOSE));
      focus = slug;
      const all = el.querySelectorAll<HTMLElement>(".desk-card[data-slug]");
      const fx = Number([...all].find((c) => c.dataset.slug === slug)?.dataset.x);
      all.forEach((c) => {
        if (!slug) delete c.dataset.side;
        else c.dataset.side = c.dataset.slug === slug ? "here" : Number(c.dataset.x) < fx ? "left" : "right";
      });
      if (slug) root.dataset.deskFocus = slug; else delete root.dataset.deskFocus;
    };

    // the desk pans; on wider screens the wall is one still frame
    const panning = () => arrived && (open.current === "files" || pano());
    const onWheel = (e: WheelEvent) => {
      if (!panning()) return;
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (focus && focus !== U15) setFocus(null);
      go(target + d / (spd() * u()));
    };
    // A drag with the mouse, or a swipe with a finger (the desk takes touch
    // for itself while it pans: touch-action in globals.css). A swipe let go
    // of while still moving carries on, as a flick along the desk would.
    let dragX: number | null = null, dragFrom = 0, dragged = false;
    let lastX = 0, lastT = 0, vel = 0; // px per ms, screen x
    const onDown = (e: PointerEvent) => {
      // (a new press is a new click: what a drag left over is spent, unless
      // this is a pinch's second finger)
      if (touches.size <= 1) dragged = false;
      if (!panning() || e.button !== 0 || zoomed() || touches.size > 1) return;
      if (!narrow() && !el.contains(e.target as Node)) return;
      // (a finger on the panorama stops the index's glide where it is, and
      // the URL, the glide's stop until now, is the stop it stopped at)
      if (glide) { glide = null; target = pan; urlFor(viewOf(location.hash), open.current); }
      // a print being carried, or a page being turned, is not a pan
      if (document.documentElement.dataset.u15 && (e.target as HTMLElement).closest?.(".u15-item, .u15-print")) return;
      dragX = lastX = e.clientX; lastT = e.timeStamp; vel = 0;
      dragFrom = target;
    };
    const onMove = (e: PointerEvent) => {
      if (dragX === null) return;
      const dx = e.clientX - dragX;
      const dt = e.timeStamp - lastT;
      if (dt > 0) { vel = vel * 0.6 + ((e.clientX - lastX) / dt) * 0.4; lastX = e.clientX; lastT = e.timeStamp; }
      if (Math.abs(dx) > 5) dragged = true;
      if (dragged) { if (focus && focus !== U15) setFocus(null); go(dragFrom - dx / (spdNow() * u())); }
    };
    const onUp = (e: PointerEvent) => {
      if (dragX === null) return;
      dragX = null;
      // a finger that stopped before it lifted throws nothing
      if (dragged && e.pointerType !== "mouse" && e.timeStamp - lastT < 80 && Math.abs(vel) > 0.3)
        go(target - (vel * 260) / (spdNow() * u()));
    };
    // ── A phone's pinch (Kate, 30.09): two fingers zoom the camera's lens in
    // (1 to 3×) about where they are and move the picture; zoomed in, one
    // finger moves it too, and does not pan. The
    // page's layers take it as translate and scale on the camera, the WebGL
    // room as --pz, --pox, --poy (components/room/engine.ts); a new stop
    // starts at 1× again. ──
    const zoom = { s: 1, ox: 0, oy: 0 };
    const touches = new Map<number, { x: number; y: number }>();
    let pinch: { d: number; s: number; mx: number; my: number; ox: number; oy: number } | null = null;
    let slide: { x: number; y: number; ox: number; oy: number } | null = null;
    const zoomable = () => arrived && narrow() && !!open.current;
    const zoomed = () => zoom.s > 1.001 || !!pinch;
    // the lens axis on screen, relative to the camera's box: where the stop's
    // own transform puts (560, 226)
    const axis = () => {
      const r = (el.parentElement ?? el).getBoundingClientRect(), q = u();
      const dx = parseFloat(el.style.getPropertyValue("--dx")) || 0, dy = parseFloat(el.style.getPropertyValue("--dy")) || 0;
      // (the wall's stops keep home's picture, as one panorama with it: no lens shift)
      const wall = open.current === "award" || open.current === "offduty";
      return { x: 560 * q + (wall ? 0 : dx), y: 226 * q + (wall ? 0 : dy), left: r.left, top: r.top };
    };
    const applyZoom = () => {
      const a = axis();
      if (zoom.s <= 1.001) { zoom.s = 1; zoom.ox = zoom.oy = 0; }
      const lim = (zoom.s - 1) * Math.max(innerWidth, innerHeight) * 0.6;
      zoom.ox = Math.max(-lim, Math.min(lim, zoom.ox)); zoom.oy = Math.max(-lim, Math.min(lim, zoom.oy));
      el.style.translate = zoom.s === 1 ? "" : `${a.x * (1 - zoom.s) + zoom.ox}px ${a.y * (1 - zoom.s) + zoom.oy}px`;
      el.style.scale = zoom.s === 1 ? "" : String(zoom.s);
      el.style.setProperty("--pz", String(zoom.s));
      el.style.setProperty("--pox", String(zoom.ox));
      el.style.setProperty("--poy", String(zoom.oy));
    };
    const resetZoom = () => { zoom.s = 1; zoom.ox = zoom.oy = 0; pinch = slide = null; touches.clear(); applyZoom(); };
    const onTouchDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !zoomable()) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) {
        const [p1, p2] = [...touches.values()];
        pinch = { d: Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1, s: zoom.s, mx: (p1.x + p2.x) / 2, my: (p1.y + p2.y) / 2, ox: zoom.ox, oy: zoom.oy };
        slide = null; dragX = null; dragged = true;
      } else if (touches.size === 1 && zoomed()) {
        slide = { x: e.clientX, y: e.clientY, ox: zoom.ox, oy: zoom.oy };
      }
    };
    const onTouchMove = (e: PointerEvent) => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && touches.size >= 2) {
        const [p1, p2] = [...touches.values()];
        const s1 = Math.max(1, Math.min(3, pinch.s * Math.hypot(p2.x - p1.x, p2.y - p1.y) / pinch.d));
        const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2, a = axis();
        // the point under the fingers stays under them as they spread
        const qx = pinch.mx - a.left, qy = pinch.my - a.top;
        zoom.ox = qx - a.x - (s1 / pinch.s) * (qx - a.x - pinch.ox) + (mx - pinch.mx);
        zoom.oy = qy - a.y - (s1 / pinch.s) * (qy - a.y - pinch.oy) + (my - pinch.my);
        zoom.s = s1; applyZoom();
      } else if (slide) {
        zoom.ox = slide.ox + e.clientX - slide.x; zoom.oy = slide.oy + e.clientY - slide.y; applyZoom();
      }
    };
    const onTouchUp = (e: PointerEvent) => {
      if (!touches.delete(e.pointerId)) return;
      if (touches.size < 2) pinch = null;
      if (touches.size === 0) slide = null;
    };
    // a drag that ends on a card is not a click on it (nor, along a phone's
    // panorama, on anything over the room: the case's own, the index's)
    const onDragClick = (e: MouseEvent) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } };
    // A tag that is a way out itself (a Behance-only case's "On Behance")
    // goes there straight away: a click on it doesn't bring the camera, nor
    // does the press that focuses it pan (which would slide the file out
    // from under the pointer, and the click would land on the file).
    const isOut = (e: Event) => !!(e.target as HTMLElement).closest?.("a.stack-soon");
    const onClick = (e: MouseEvent) => {
      // from home, any of the files is a way in to Case Files, as the award
      // in the case is to Recognition
      if (!open.current && (e.target as HTMLElement).closest?.(".desk-cases > *")) {
        e.preventDefault(); e.stopPropagation();
        dispatchEvent(new Event(DESK_EVENT));
        return;
      }
      // the first click on a case brings the camera to it and lays it out;
      // a click on the case in focus goes on to its page
      if (isOut(e)) return;
      const a = (e.target as HTMLElement).closest?.<HTMLElement>(".desk-card[data-slug]:not(.desk-card--env)");
      if (!a || !panning() || focus === a.dataset.slug) return;
      e.preventDefault(); e.stopPropagation();
      setFocus(a.dataset.slug!);
      go(rowX(Number(a.dataset.x)) - VIEW_X);
    };
    const onFocus = (e: FocusEvent) => {
      if (isOut(e)) return;
      const a = (e.target as HTMLElement).closest?.<HTMLElement>(".desk-card[data-x]");
      if (!a || !panning()) return;
      go(rowX(Number(a.dataset.x)) - VIEW_X - 120 / spd());
    };
    // The WebGL room (?gl=1) does not render the cards: its controls stand
    // for them and say which case was clicked, or took focus.
    const xOf = (e: Event) => CASES.find((c) => c.slug === (e as CustomEvent<string>).detail);
    const onGlCase = (e: Event) => {
      const c = xOf(e);
      if (!c || !panning() || focus === c.slug) return;
      setFocus(c.slug);
      go(rowX(c.x) - VIEW_X);
    };
    const onGlCaseFocus = (e: Event) => { const c = xOf(e); if (c && panning()) go(rowX(c.x) - VIEW_X - 120 / spd()); };
    window.addEventListener("room:case", onGlCase);
    window.addEventListener("room:case-focus", onGlCaseFocus);
    // on the camera, not the world: under ?gl=1 the world is only built if
    // the WebGL room fails to start (RoomGL), after this has run
    // (home too: on a phone the panorama slides once the camera is back)
    const atRest = () => { arrived = true; if (open.current || narrow()) root.dataset.deskArrived = "1"; };
    const onArrive = (e: TransitionEvent) => {
      if (!(e.target as Element).classList?.contains("desk-world") || e.propertyName !== "transform") return;
      atRest();
    };
    el.addEventListener("transitionend", onArrive);
    // the WebGL room (?gl=1) has no CSS move to end: it says when it is there
    const onGlArrive = () => atRest();
    window.addEventListener("room:arrive", onGlArrive);
    // the WebGL room gave up (no WebGL, or its context lost for good) with the
    // camera at a stop: the CSS world is built there, already where it is
    // sent, so no move ends — once it stands still, it has arrived
    const offGl = onGl(() => {
      if (glOn() || arrived) return;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const w = el.querySelector(".desk-world");
        const moving = !!w?.getAnimations().some((a) => (a as CSSTransition).transitionProperty === "transform");
        if (!arrived && !moving) atRest();
      }));
    });
    // what the page is at a stop, however the camera came: its state, the
    // page held still, the ribbons in the tab order at Recognition
    const showStop = (v: View | null) => {
      root.dataset.desk = v ? STATE[v] : "closed";
      document.body.style.overflow = v ? "hidden" : "";
      el.querySelectorAll<HTMLElement>(".award-ribbon, .desk-cert").forEach((a) => (a.tabIndex = v === "award" ? 0 : -1));
    };
    const set = (v: View | null) => {
      // along a phone's panorama, at rest: a slide there, not a move
      if (arrived && pano() && isPanoView(v)) { glideTo(v); return; }
      if (v === open.current) return;
      if (v && !open.current) window.scrollTo({ top: 0 });
      if (v) measure();
      open.current = v;
      // leaving the desk (home, or on to the wall): the pan unwinds with the
      // rest of the move
      arrived = false; delete root.dataset.deskArrived; delete root.dataset.deskSlid;
      if (v !== "files") { dispatchEvent(new Event(U15_RESET)); setFocus(null); }
      cancelAnimationFrame(raf); raf = 0; glide = null; pan = target = 0; paint(); resetZoom();
      showStop(v);
      // A wheel listener that can cancel the scroll holds every scroll of the
      // page until it has run, so it is there only while the desk pans.
      if (v === "files") window.addEventListener("wheel", onWheel, { passive: false });
      else window.removeEventListener("wheel", onWheel);
      cards().forEach((a) => (a.tabIndex = v === "files" ? 0 : -1));
      // with reduced motion there is no move, so no transitionend: the camera
      // is where it was sent at once
      if (still) atRest();
    };
    // The camera slid into another stop's half of the panorama (paint): the
    // page is that stop's from here — its controls, its night, its URL — the
    // camera already where it is, html[data-desk-arrived] kept (so neither
    // the CSS room nor the WebGL one moves: engine.ts, the slide).
    const slideTo = (v: View | null) => {
      const was = open.current;
      open.current = v;
      root.dataset.deskSlid = "1";
      showStop(v);
      // (the index's glide has put its stop in the URL already)
      if (!glide) urlFor(was, v);
    };
    // The URL of the stop the finger has slid to (from was): the stop's own
    // entry, as the index would make it from the case; back at the case,
    // that entry goes again (onPop), or the URL is home's
    const urlFor = (was: View | null, v: View | null) => {
      if (!v) { if (pushed) { pushed = false; popping = true; history.back(); } else if (location.hash) history.replaceState(null, "", "/"); }
      else if (!was && !location.hash) { history.pushState({ desk: 1 }, "", `/${HASH[v]}`); pushed = true; }
      else if (location.hash !== HASH[v]) history.replaceState({ desk: 1 }, "", `/${HASH[v]}`);
    };

    // Opened by us, it has a history entry of its own and closing is Back.
    // Arrived at /#case-files directly, there is nothing behind it on this
    // site, so closing rewrites the URL instead of leaving.
    let pushed = false, popping = false;
    const close = () => {
      if (pushed) { pushed = false; history.back(); }
      else { history.replaceState(null, "", "/"); set(null); }
    };
    // Its own link again closes a view; the other one's moves straight across,
    // in the same history entry.
    const toggle = (v: View) => {
      // (along a phone's panorama the stop's link again slides back to it)
      if (open.current === v && !(arrived && pano())) close();
      else if (open.current) { history.replaceState({ desk: 1 }, "", `/${HASH[v]}`); set(v); }
      else { history.pushState({ desk: 1 }, "", `/${HASH[v]}`); pushed = true; set(v); }
    };
    const onFiles = () => toggle("files");
    const onAward = () => toggle("award");
    const onProfile = () => toggle("profile");
    const onOffDuty = () => toggle("offduty");
    const onPop = () => {
      // (the entry a slide back to the case let go: if the finger has slid
      // out again meanwhile, the stop it is at has one again)
      if (popping) {
        popping = false;
        if (open.current && pano()) { history.pushState({ desk: 1 }, "", `/${HASH[open.current]}`); pushed = true; }
        return;
      }
      pushed = false; set(viewOf(location.hash));
    };
    // A link to home (the KATE™ wordmark) from the desk or the wall: Next
    // changes the URL with pushState, which fires no popstate, so the camera
    // would stay where it is. Take the click and bring it back to the case.
    const onHomeLink = (e: MouseEvent) => {
      // (on a phone's panorama home slid aside is still away from the case)
      const away = !!open.current || (arrived && pano() && Math.abs(pan) > 0.5);
      if (!away || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname !== "/" || u.hash) return;
      e.preventDefault(); e.stopPropagation();
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!open.current) return;
      if (e.key === "Escape") {
        if (focus === U15) dispatchEvent(new Event(U15_CLOSE));
        else if (focus) setFocus(null);
        else close();
      }
      else if (panning() && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        go(target + (e.key === "ArrowRight" ? 1 : -1) * 220);
      }
    };
    const onResize = () => { if (open.current) measure(); if (open.current || pano()) go(target); };

    // opening Ukrainska 15's folder lays it out for the camera where pan 0
    // was before the row was scaled: the same place on the folder
    const onU15 = () => { if (panning()) { setFocus(U15); go(rowX(VIEW_X) - VIEW_X); } };
    const onU15Closed = () => { if (focus === U15) setFocus(null); };
    const onPutAway = () => { if (focus === U15) dispatchEvent(new Event(U15_CLOSE)); else if (focus) setFocus(null); };
    window.addEventListener(PUT_AWAY, onPutAway);
    window.addEventListener(U15_OPEN, onU15);
    window.addEventListener(U15_CLOSED, onU15Closed);
    window.addEventListener(DESK_EVENT, onFiles);
    window.addEventListener(AWARD_EVENT, onAward);
    window.addEventListener(PROFILE_EVENT, onProfile);
    window.addEventListener(OFFDUTY_EVENT, onOffDuty);
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onHomeLink, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    surface.addEventListener("pointerdown", onTouchDown);
    window.addEventListener("pointermove", onTouchMove);
    window.addEventListener("pointerup", onTouchUp);
    window.addEventListener("pointercancel", onTouchUp);
    surface.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    surface.addEventListener("click", onDragClick, true);
    el.addEventListener("click", onClick, true);
    el.addEventListener("focusin", onFocus);
    set(viewOf(location.hash));
    // (at the case from the start: at rest there, and on a phone free to slide)
    if (!open.current) atRest();

    return () => {
      window.removeEventListener(U15_OPEN, onU15);
      window.removeEventListener(U15_CLOSED, onU15Closed);
      window.removeEventListener(PUT_AWAY, onPutAway);
    window.removeEventListener(DESK_EVENT, onFiles);
      window.removeEventListener(AWARD_EVENT, onAward);
      window.removeEventListener(PROFILE_EVENT, onProfile);
      window.removeEventListener(OFFDUTY_EVENT, onOffDuty);
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onHomeLink, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      surface.removeEventListener("pointerdown", onTouchDown);
      window.removeEventListener("pointermove", onTouchMove);
      window.removeEventListener("pointerup", onTouchUp);
      window.removeEventListener("pointercancel", onTouchUp);
      surface.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      surface.removeEventListener("click", onDragClick, true);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("focusin", onFocus);
      el.removeEventListener("transitionend", onArrive);
      window.removeEventListener("room:arrive", onGlArrive);
      offGl();
      window.removeEventListener("room:case", onGlCase);
      window.removeEventListener("room:case-focus", onGlCaseFocus);
      cancelAnimationFrame(raf);
      delete root.dataset.deskArrived;
      delete root.dataset.deskSlid;
      delete root.dataset.deskReady;
      delete root.dataset.desk;
      // and forget the view with it, or a remount (React's dev double run,
      // or home again on the way in from another page) finds it "already
      // open" and never puts html[data-desk] back
      open.current = null;
      document.body.style.overflow = "";
    };
  }, [cam]);
}

/** Whether a click on Case Files should move the camera instead of leaving:
 *  on home, with a plain left click. */
/** A link to one of the camera's stops (/#case-files …): on home it moves the
 *  camera instead of navigating, which a hash on the same page would not do;
 *  from anywhere else it is an ordinary link home, and the hash opens the stop
 *  there. Returns whether it took the click. */
const STOP_EVENTS: Record<string, string> = {
  "/#case-files": DESK_EVENT, "/#profile": PROFILE_EVENT, "/#recognition": AWARD_EVENT, "/#off-duty": OFFDUTY_EVENT,
};
export function openStop(e: React.MouseEvent, href: string) {
  const ev = STOP_EVENTS[href];
  if (!ev || location.pathname !== "/" || !shouldOpenDesk(e)) return false;
  e.preventDefault();
  window.dispatchEvent(new Event(ev));
  return true;
}

export function shouldOpenDesk(e: React.MouseEvent) {
  const root = document.documentElement;
  return (
    root.dataset.deskReady === "1" &&
    e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
  );
}

