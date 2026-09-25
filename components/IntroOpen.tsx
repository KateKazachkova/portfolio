"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The first visit opens the case: a clip of the closed trunk unlatching and
 * its doors swinging out onto the furnished interior, played once, in place.
 *
 * The clip was generated on chroma green (start frame: the closed trunk,
 * end frame: the page's own case, captured with everything in it) and keyed
 * to alpha, so it carries no background of its own and sits in whatever room
 * the edition lights. Both frames share open2's coordinates — the clip is
 * cropped to the case box, so it is laid over it at inset 0, no fitting.
 *
 * Only the doors are the clip's. Its body is only the model's guess at the
 * case (and its niche is empty — the doll changes with the edition), so the
 * keying makes the clip transparent wherever the body shows between the
 * doors, frame by frame, and over the whole body once they have cleared it
 * (2.45s). Under it the live case is shown cut to the body's rectangle
 * (`data-intro="body"`, globals.css): the body, the niche and whichever doll
 * is on are the page's own pixels from the first crack of light, so they
 * cannot change size or place. The keying also scales the clip by 1.031 —
 * the model drew the case 3% small — so its doors meet the live case.
 *
 * Each door is moved onto the page's own while it is still swinging, and once
 * both have stopped (END_AT) the clip fades off the whole live case, which
 * covers what still differs on the doors (the rail, the night dimming).
 * Once per visitor, skippable (click / any key), skipped for reduced motion.
 */

const KEY = "introOpenV1";
const FADE_MS = 300;
/** The doors have stopped (the keying has moved each onto the page's own by
 *  then), so the live case takes over here rather than at the clip's end. */
const END_AT = 3.8;
export default function IntroOpen() {
  const [on, setOn] = useState(false);
  const [fading, setFading] = useState(false);
  const [safari, setSafari] = useState(false);

  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    try { localStorage.setItem(KEY, "1"); } catch {}
    document.documentElement.removeAttribute("data-intro");
    setFading(true);
    setTimeout(() => setOn(false), FADE_MS);
  }, []);

  useEffect(() => {
    // the inline script below has already decided, before the first paint
    if (document.documentElement.getAttribute("data-intro") !== "body") return;
    const ua = navigator.userAgent;
    const id = requestAnimationFrame(() => {
      setSafari(/Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua));
      setOn(true);
    });
    return () => { cancelAnimationFrame(id); document.documentElement.removeAttribute("data-intro"); };
  }, []);

  useEffect(() => {
    if (!on || fading) return;
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    // a clip that cannot play must not leave the case hidden
    const guard = setTimeout(finish, 9000);
    return () => { window.removeEventListener("keydown", skip); clearTimeout(guard); };
  }, [on, fading, finish]);

  // Runs as the HTML is parsed, so the open case never shows for a frame
  // before the closed one covers it. ?intro replays, ?nointro skips.
  const gate = (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{var q=location.search;if((q.indexOf("intro")>-1&&q.indexOf("nointro")<0)||(!localStorage.getItem("${KEY}")&&q.indexOf("nointro")<0&&!matchMedia("(prefers-reduced-motion: reduce)").matches))document.documentElement.setAttribute("data-intro","body")}catch(e){}`,
      }}
    />
  );

  if (!on) return gate;
  return (
    <>
    {gate}
    <div
      className="intro-open"
      onClick={finish}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        cursor: "pointer",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/suitcase/intro/open_poster.webp"
        onTimeUpdate={(e) => { if (e.currentTarget.currentTime >= END_AT) finish(); }}
        onEnded={finish}
        onError={finish}
        style={{ width: "100%", height: "100%", objectFit: "fill", display: "block" }}
        // Safari keys alpha only from HEVC; Chrome can decode HEVC but drops
        // its alpha, so the pick is by engine, not by canPlayType.
        src={safari ? "/suitcase/intro/open.mov" : "/suitcase/intro/open.webm"}
      />
    </div>
    </>
  );
}
