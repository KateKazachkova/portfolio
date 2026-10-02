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
 * page's case (scale 1.017 for this take) and moves each door onto the page's own
 * while it is still swinging; once both have stopped (END_AT) the clip fades
 * off the whole live case, which covers what still differs on the doors (the
 * rail, the night dimming).
 *
 * The shadow on the desk is worked out from each frame's own silhouette and
 * baked into the clip below the case; its last frame, kept as
 * rest_shadow.webp, is the case's shadow at rest, and comes in at END_AT.
 * The handle is the page's own throughout: it is the same closed and open.
 * The clip's wardrobe is empty (the model could not keep the clothes whole
 * through the swing); the page's hangers turn out to face the room one after
 * another once the doors have stopped ("clothes").
 *
 * On every visit for now (Kate, 25.09 — may go back to once per visitor).
 * A click or any key lands the whole scene at once (a click off the case
 * drops the clip at once: the camera may be leaving); ?nointro, an anchor
 * (/#recognition and the like: the camera is off to it at once, and would
 * leave the opening running behind it), reduced motion and a screen under
 * 1024px (the phone's layout has no desk scene to open into) skip it. A clip
 * that has not started 2.5s in is given up, so a slow line gets the scene
 * rather than a closed trunk.
 */

const FADE_MS = 300;
/** when the lamp clicks on, the column starts, the doors may start (ms) */
const LAMP_AT = 250;
const TEXT_AT = 300;
const OPEN_AT = 700;
/** the clip runs below the case box by its shadow: 146 of its 1226 rows */
const CLIP_H = `${(1226 / 1080) * 100}%`;
/** the doors are all but still: the files set off (clip seconds) */
const FILES_AT = 3.97;
/** The doors have stopped: the live case takes over (clip seconds; the take
 *  runs 4.42s). The shadow changes hands in the same frame: rest_shadow.webp
 *  (the page's copy of the clip's last frame) is on at once, and the clip is
 *  cut to its doors (doors_mask.webp, the last frame's case without its
 *  shadow) before it fades. Two half-faded copies of one shadow are lighter
 *  than either, which was the blink after the doors stopped. */
const END_AT = 4.38;
const DOORS_MASK_SRC = "/suitcase/intro/doors_mask.webp";
const DOORS_MASK = `url(${DOORS_MASK_SRC}) 0 0 / 100% 100% no-repeat`;
/** the files' own run: the last one's delay plus its slide, and a margin */
const FILES_MS = 600 + 800 + 150;
/** how long a step may wait for what it shows before it goes anyway */
const WAIT_MS = 1500;
/** a clip that has not started by then is given up, and the scene lands */
const GIVE_UP_MS = 2500;

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
  const [masked, setMasked] = useState(false);
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

  /** the clip is done: the live case takes over under a short fade. Only a
   *  clip that has run to its end is cut to its doors: on a skip they are
   *  still swinging, and the mask is the last frame's. */
  const endClip = useCallback((atRest = false) => {
    if (ended.current) return;
    ended.current = true;
    setMasked(atRest);
    html().removeAttribute("data-intro");
    add("shadow");
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
    // the doors' mask is needed in the frame the clip ends: fetched now, as
    // a mask that has not loaded hides the whole clip
    new Image().src = DOORS_MASK_SRC;
    later(() => add("lamp"), LAMP_AT);
    later(() => add("text"), TEXT_AT);
    // not started at all
    later(() => { if (!video.current || video.current.currentTime === 0) land(); }, GIVE_UP_MS);
    window.addEventListener("keydown", land);
    // a click anywhere else (the menu, the desk) sends the camera off: the
    // clip is laid over the page, not in the room, so it goes at once rather
    // than fade while the room flies out from under it
    const away = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.(".intro-open")) return;
      land();
      setOn(false);
    };
    window.addEventListener("pointerdown", away, true);
    const list = timers.current;
    return () => {
      cancelAnimationFrame(id);
      list.forEach(clearTimeout);
      window.removeEventListener("keydown", land);
      window.removeEventListener("pointerdown", away, true);
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
  // It also marks the desk ready before the first paint (useDeskCamera sets
  // it again once its listeners are on): the first paint is then the desk,
  // not the old studio sweep over it, and the wall paints without the JS.
  const gate = (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{document.documentElement.setAttribute("data-desk-ready","1");if(location.search.indexOf("nointro")<0&&!location.hash&&matchMedia("(min-width: 1024px)").matches&&!matchMedia("(prefers-reduced-motion: reduce)").matches){var h=document.documentElement;h.setAttribute("data-intro","body");h.setAttribute("data-load","on")}}catch(e){}`,
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
            if (t >= FILES_AT) pushFiles();
            if (t >= END_AT) endClip(true);
          }}
          onPlaying={() => setPlaying(true)}
          onEnded={() => { pushFiles(); endClip(true); }}
          onError={land}
          style={{
            position: "absolute", left: 0, top: 0, width: "100%", height: CLIP_H, objectFit: "fill", display: "block",
            ...(masked ? { mask: DOORS_MASK, WebkitMask: DOORS_MASK } : null),
          }}
        />
      )}
    </div>
    </>
  );
}
