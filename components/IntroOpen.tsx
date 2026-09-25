"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Home loads as a scene. The desk is there first — the clock, the trophy, the
 * closed trunk; the lamp clicks on; the column comes in line by line; the
 * trunk unlatches and its doors swing out; and as they settle the case files
 * are pushed onto the desk one after another. Each step waits for what it
 * shows, so the heavier layers load while the earlier ones play. The steps
 * are tokens on <html data-load> and the looks are in globals.css ("Loading
 * as a scene").
 *
 * The opening is a clip generated on chroma green (start frame: the closed
 * trunk, end frame: the page's own case) and keyed to alpha, so it carries no
 * background of its own and sits in whatever room the edition lights. It is
 * cropped to the case box and laid over it at inset 0.
 *
 * Only the doors are the clip's. Its body is only the model's guess at the
 * case (and its niche is empty — the doll changes with the edition), so the
 * model was given the body as flat magenta, so the keying makes the clip
 * transparent wherever it shows between the doors, frame by frame, and over
 * the whole body once they have cleared it (2.7s). Under it the live case is shown cut to the body's rectangle
 * (`data-intro="body"`, globals.css): the body, the niche and whichever doll
 * is on are the page's own pixels from the first crack of light, so they
 * cannot change size or place. The keying also registers the clip onto the
 * page's case (scale 1.026 for this take) and moves each door onto the page's own
 * while it is still swinging; once both have stopped (END_AT) the clip fades
 * off the whole live case, which covers what still differs on the doors (the
 * rail, the night dimming).
 *
 * The shadow on the desk is worked out from each frame's own silhouette, by
 * the recipe that made the desk's desk-shadow.png, and baked into the clip
 * below the case; the desk's own (and the case's floor shadows) wait hidden
 * and take over at SHADOW_AT, when the doors are all but where it has them.
 * The handle is the page's own throughout: it is the same closed and open.
 * The clip's wardrobe is empty (the model could not keep the clothes whole
 * through the swing); the page's hangers turn out to face the room one after
 * another once the doors have stopped ("clothes").
 *
 * On every visit for now (Kate, 25.09 — may go back to once per visitor).
 * A click or any key lands the whole scene at once; ?nointro, an anchor
 * (/#recognition and the like: the camera is off to it at once, and would
 * leave the opening running behind it) and reduced motion skip it.
 */

const FADE_MS = 300;
/** when the lamp clicks on, the column starts, the doors may start (ms) */
const LAMP_AT = 250;
const TEXT_AT = 300;
const OPEN_AT = 700;
/** the clip's own shadow hands over to the desk's (clip seconds; the keying
 *  fades it out over the same 0.3s) */
const SHADOW_AT = 3.1;
/** the clip runs below the case box by its shadow: 146 of its 1226 rows */
const CLIP_H = `${(1226 / 1080) * 100}%`;
/** the doors are all but still: the files set off (clip seconds) */
const FILES_AT = 3.4;
/** the doors have stopped: the live case takes over (clip seconds) */
const END_AT = 3.8;
/** the files' own run: the last one's delay plus its slide, and a margin */
const FILES_MS = 600 + 800 + 150;
/** how long a step may wait for what it shows before it goes anyway */
const WAIT_MS = 1500;
/** a clip that has not started by then is given up, and the scene lands */
const GIVE_UP_MS = 4000;

const html = () => document.documentElement;
/** the rail's last hanger done turning (ms after "clothes") */
const CLOTHES_MS = 6 * 110 + 550 + 150;
const add = (token: string) => {
  const now = html().getAttribute("data-load");
  if (now !== null && !now.split(" ").includes(token)) html().setAttribute("data-load", `${now} ${token}`);
};
const ready = (imgs: HTMLImageElement[]) =>
  Promise.race([
    Promise.allSettled(imgs.map((i) => i.decode())),
    new Promise((r) => setTimeout(r, WAIT_MS)),
  ]);

export default function IntroOpen() {
  // true for the server render too: the closed trunk is in the HTML, so it is
  // there from the first paint (globals.css hides it when the gate is off)
  const [on, setOn] = useState(true);
  const [fading, setFading] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  // the poster stands in for the clip until it runs, then must go: the clip
  // is transparent between the doors, and the closed trunk would show there
  const [playing, setPlaying] = useState(false);
  // TESTING (Kate, 25.09): Space pauses the opening, ← → step a frame while
  // paused, and the clip's time shows in the corner — to find what breaks.
  // Take out, with the keydown branch below, once the opening is settled.
  const [paused, setPaused] = useState<number | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const ended = useRef(false);
  const filed = useRef(false);
  const timers = useRef<number[]>([]);
  const lastStep = useRef(0);
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); }, []);

  /** data-load goes once the last of the steps still running is done */
  const doneIn = useCallback((ms: number) => {
    const at = performance.now() + ms;
    if (at <= lastStep.current) return;
    lastStep.current = at;
    later(() => { if (performance.now() >= lastStep.current - 20) html().removeAttribute("data-load"); }, ms);
  }, [later]);

  /** the clip is done: the live case takes over under a short fade */
  const endClip = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    html().removeAttribute("data-intro");
    add("clothes");
    doneIn(CLOTHES_MS);
    setFading(true);
    window.setTimeout(() => setOn(false), FADE_MS);
  }, [doneIn]);

  /** everything at once: the end, or a skip */
  const land = useCallback(() => {
    timers.current.forEach(clearTimeout);
    html().removeAttribute("data-load");
    endClip();
  }, [endClip]);

  const pushFiles = useCallback(() => {
    if (filed.current) return;
    filed.current = true;
    const imgs = [...document.querySelectorAll<HTMLImageElement>(".desk-cases img")];
    ready(imgs).then(() => {
      add("files");
      doneIn(FILES_MS);
    });
  }, [doneIn]);

  useEffect(() => {
    // the inline script below has already decided, before the first paint
    if (html().getAttribute("data-intro") !== "body") {
      const id = requestAnimationFrame(() => setOn(false));
      return () => cancelAnimationFrame(id);
    }
    const ua = navigator.userAgent;
    // Safari keys alpha only from HEVC; Chrome can decode HEVC but drops its
    // alpha, so the pick is by engine, not by canPlayType.
    const safari = /Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua);
    const id = requestAnimationFrame(() => setSrc(safari ? "/suitcase/intro/open.mov" : "/suitcase/intro/open.webm"));
    later(() => add("lamp"), LAMP_AT);
    later(() => add("text"), TEXT_AT);
    // not started at all (a pause for testing has currentTime > 0)
    later(() => { if (!video.current || video.current.currentTime === 0) land(); }, GIVE_UP_MS);
    const skip = (e: KeyboardEvent) => {
      const v = video.current;
      if (v && (e.code === "Space" || e.code === "ArrowLeft" || e.code === "ArrowRight")) {
        e.preventDefault();
        if (e.code === "Space") {
          if (v.paused && v.currentTime > 0) { v.play(); setPaused(null); }
          else { v.pause(); setPaused(v.currentTime); }
        } else if (v.paused) {
          v.currentTime = Math.max(0, v.currentTime + (e.code === "ArrowRight" ? 1 : -1) / 24);
          setPaused(v.currentTime);
        }
        return;
      }
      land();
    };
    window.addEventListener("keydown", skip);
    const list = timers.current;
    return () => {
      cancelAnimationFrame(id);
      list.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      html().removeAttribute("data-intro");
      html().removeAttribute("data-load");
    };
  }, [land, later]);

  // the doors open once the lamp is on and the clip can play through
  useEffect(() => {
    const v = video.current;
    if (!v || !src) return;
    const t0 = performance.now();
    const go = () => {
      const wait = Math.max(0, OPEN_AT - (performance.now() - t0));
      window.setTimeout(() => { v.play().catch(land); }, wait);
    };
    if (v.readyState >= 4) go();
    else v.addEventListener("canplaythrough", go, { once: true });
    return () => v.removeEventListener("canplaythrough", go);
  }, [src, land]);

  // Runs as the HTML is parsed, so nothing shows for a frame before its turn.
  const gate = (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{if(location.search.indexOf("nointro")<0&&!location.hash&&!matchMedia("(prefers-reduced-motion: reduce)").matches){var h=document.documentElement;h.setAttribute("data-intro","body");h.setAttribute("data-load","on")}}catch(e){}`,
      }}
    />
  );

  if (!on) return gate;
  return (
    <>
    {gate}
    <div
      className="intro-open"
      onClick={land}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        cursor: "pointer",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/suitcase/intro/open_poster.webp"
        alt=""
        fetchPriority="high"
        draggable={false}
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: CLIP_H, objectFit: "fill", visibility: playing ? "hidden" : "visible" }}
      />
      {src && (
        <video
          ref={video}
          muted
          playsInline
          preload="auto"
          src={src}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            if (t >= SHADOW_AT) add("shadow");
            if (t >= FILES_AT) pushFiles();
            if (t >= END_AT) endClip();
          }}
          onPlaying={() => setPlaying(true)}
          onSeeked={(e) => setPaused(e.currentTarget.paused ? e.currentTarget.currentTime : null)}
          onEnded={() => { add("shadow"); pushFiles(); endClip(); }}
          onError={land}
          style={{ position: "absolute", left: 0, top: 0, width: "100%", height: CLIP_H, objectFit: "fill", display: "block" }}
        />
      )}
      {paused !== null && (
        <span style={{ position: "absolute", right: 8, top: 8, font: "12px ui-monospace, monospace", color: "#fff", background: "rgba(0,0,0,.6)", padding: "2px 6px", borderRadius: 3, pointerEvents: "none" }}>
          ❚❚ {paused.toFixed(2)}s · frame {Math.round(paused * 24)} · space / ← →
        </span>
      )}
    </div>
    </>
  );
}
