"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The curtain across the niche, drawn while one doll is swapped for another.
 *
 * The editions used to cut: click a different hour and the old clip vanished
 * mid-frame while the new one was still fetching its first byte. A theatre
 * closes first. The curtain runs in, holds shut long enough for the swap to
 * happen behind it, and parts again — so what the page shows is a curtain call
 * rather than a jump cut.
 *
 * It is FILM, not CSS. The first version slid two SVG panels of cloth across
 * the niche and undulated their leading edges; it moved, but two rectangles
 * travelling in a straight line is what it still looked like, because a curtain
 * is mostly what the cloth does *between* the two ends of that journey — the
 * hem lagging, the folds compressing, the whole panel rebounding when it lands.
 * So the panels were shot instead: generated against a flat green, keyed to
 * alpha with ffmpeg (colorkey + despill) and shipped as VP9-alpha WebM, which
 * is why the doll still shows through the moment they part.
 *
 * Pinned to the same rect as the doll and the lamp (NicheDoll's NICHE,
 * NicheLight's RECT): the niche's own box inside the suitcase photograph, with
 * the clip's aspect giving it its height. That keeps it on the niche 1:1 at any
 * viewport size, exactly as the doll's clips are.
 *
 * Red because the case is already lined in it — the seat of the niche and the
 * left compartment are the same velvet, and the cloth was generated from a
 * photograph of that lining — so the curtain reads as part of the object rather
 * than as an overlay dropped on top of it.
 */

const RECT = { left: "40.62%", top: "11.43%", width: "18.16%" } as const;
const CLIP_ASPECT = "648 / 1664";

/** The three beats, in ms. Exported because page.tsx runs the swap against
 *  them: the doll changes on CLOSE, and the curtain parts a HOLD later.
 *  CLOSE and OPEN are the clips' own lengths — 30 frames at 30fps, the run
 *  from wide open to fully shut — so the page's timing and the cloth's cannot
 *  drift apart. The first cut of these clips stopped at frame 74 of the take,
 *  where the panels had not met yet; it now runs to 88, which is where the
 *  niche is actually covered. */
export const CURTAIN_CLOSE_MS = 1000;
export const CURTAIN_HOLD_MS = 350;
export const CURTAIN_OPEN_MS = 1000;

const CLOSE = "/curtain/curtain_close.webm";
const OPEN = "/curtain/curtain_open.webm";

export default function NicheCurtain({ closed }: { closed: boolean }) {
  /** Both clips are their own element rather than one element with its `src`
   *  swapped. Assigning `src` resets the media and the play() that followed it
   *  was being aborted by the load every time, so the curtain sat on frame one
   *  and never ran. Two elements also mean the cloth is already decoded when
   *  the beat arrives, which is what the close needs: it has no time to buffer.
   */
  const closeFilm = useRef<HTMLVideoElement>(null);
  const openFilm = useRef<HTMLVideoElement>(null);
  /** Nothing has been played yet, so there is no last frame to hold — and an
   *  unplayed <video> paints its FIRST frame, which for the opening clip is a
   *  shut curtain. Until the first close, then, both elements stay invisible;
   *  this is state rather than a ref precisely because the render has to know.
   */
  const [armed, setArmed] = useState(false);
  /** The same fact as `armed`, kept where the effect can read it without
   *  taking it as a dependency — otherwise arming would re-run the effect and
   *  restart the close a frame after it began. */
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current && !closed) return;
    hasRun.current = true;
    // Every close arms it, not just the first: the parting disarms it again,
    // so a curtain that was only ever armed once would be invisible from the
    // second beat onwards.
    if (closed) setArmed(true);

    const play = closed ? closeFilm.current : openFilm.current;
    const stop = closed ? openFilm.current : closeFilm.current;
    if (!play) return;

    stop?.pause();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No theatre: sit on the end of whichever clip was asked for, which is a
      // closed curtain or an empty niche.
      const park = () => { play.currentTime = play.duration || 0; };
      if (play.readyState >= 1) park();
      else play.addEventListener("loadedmetadata", park, { once: true });
      return;
    }
    // Rewind AFTER the play has been granted, not before: seeking a media
    // element that is still settling cancels the play() that follows it, which
    // is what left the curtain sitting on its first frame.
    void play
      .play()
      .then(() => {
        play.currentTime = 0;
      })
      // A change of direction mid-run aborts this play(); that rejection is the
      // normal way out, not an error.
      .catch(() => {});

    // Once the parting has had its time, take the film off screen entirely.
    // Holding the open clip's last frame is only safe while it really is the
    // last frame: a tab that was hidden, or a decoder that never got going,
    // leaves the element sitting on frame one, which is a SHUT curtain across
    // the niche. So the resting state is "no film at all" rather than "the
    // film, parked" — `ended` handles the normal case and the timer covers the
    // playback that never happened.
    if (closed) return;
    const clear = () => setArmed(false);
    play.addEventListener("ended", clear, { once: true });
    const failsafe = window.setTimeout(clear, CURTAIN_OPEN_MS + 250);
    return () => {
      play.removeEventListener("ended", clear);
      window.clearTimeout(failsafe);
    };
  }, [closed]);

  const film = (kind: "close" | "open"): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "fill",
    display: "block",
    // Only the clip that is running — or the one holding its last frame — is on
    // screen. No fade: the two share the same frame at the hand-over, so a
    // crossfade would only show them both at half strength.
    opacity: armed && (kind === "close") === closed ? 1 : 0,
  });

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        ...RECT,
        aspectRatio: CLIP_ASPECT,
        // Over the clip and the chalk on the back wall, under the lamp — the
        // light in the arch falls on the curtain too.
        zIndex: 5,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* The last frame stays on screen: at the end of the close that is the
          shut curtain the hold needs, and at the end of the open it is a fully
          transparent frame, so the niche is simply clear again. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={closeFilm} src={CLOSE} muted playsInline preload="auto" style={film("close")} />
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={openFilm} src={OPEN} muted playsInline preload="auto" style={film("open")} />
    </div>
  );
}
