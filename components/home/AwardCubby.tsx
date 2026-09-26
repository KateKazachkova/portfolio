"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/reducedMotion";
import Link from "next/link";
import InkTip from "@/components/InkTip";
import { shouldOpenDesk, AWARD_EVENT } from "@/components/DeskScene";

/** The award's cubby, in the suitcase box's own percentages. The clip was cut
 *  from exactly this rectangle, so it goes back at exactly these numbers. */
const AWARD_CUBBY = { l: 27.214, t: 11.182, w: 11.686, h: 26.318 };

/** A strip of the case's own pixels, re-drawn on top of the clip.
 *
 *  A generated clip can never register with the case to the pixel — the model
 *  redraws the woodwork it was given, and a frame or two of drift shows up
 *  exactly where the clip's edge meets the real case. Rather than chase that,
 *  these strips lay the case back over its own borders: the background is
 *  the case's picture (--case-plate, the very file the page shows) scaled to the whole suitcase box and offset so each strip shows the
 *  very pixels it covers, which is why it cannot disagree with what is beneath
 *  it. `l/t/w/h` are the strip's rectangle in the SUITCASE BOX's percentages;
 *  the element is positioned inside the cubby, hence the conversion.
 *
 *  The background-position maths: with the image scaled to the whole box, the
 *  percentage CSS wants is l / (100 - w), because a percentage position aligns
 *  that point of the image with the same point of the element. */
function CaseInlay({ l, t, w, h }: { l: number; t: number; w: number; h: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: `${((l - AWARD_CUBBY.l) / AWARD_CUBBY.w) * 100}%`,
        top: `${((t - AWARD_CUBBY.t) / AWARD_CUBBY.h) * 100}%`,
        width: `${(w / AWARD_CUBBY.w) * 100}%`,
        height: `${(h / AWARD_CUBBY.h) * 100}%`,
        backgroundImage: "var(--case-plate)",
        backgroundSize: `${10000 / w}% ${10000 / h}%`,
        backgroundPosition: `${(l / (100 - w)) * 100}% ${(t / (100 - h)) * 100}%`,
        pointerEvents: "none",
      }}
    />
  );
}

/** The award, in the top-left cubby — and the way in to Recognition.
 *
 *  She takes her turn when you point at her. The clip was generated straight
 *  into this cubby from the very frame the page already shows, so it is
 *  opaque and drops onto the case 1:1 — no alpha, no mask — and its first
 *  frame IS the still, which is what makes the swap invisible. The still goes
 *  transparent underneath rather than staying behind the clip: hovering lifts
 *  the InkTip wrapper to z60 to float its label, which would otherwise put the
 *  motionless statue back on top of the video. */
export default function AwardCubby() {
  const [awake, setAwake] = useState(false);
  // Whether the clip is actually painting yet. The file is not preloaded — it
  // costs a third of a megabyte and most visitors never point at the shelf — so
  // on the first hover there is a moment with no frame to show. The still stays
  // up until `playing` fires, otherwise the cubby would flash empty.
  const [rolling, setRolling] = useState(false);
  const clip = useRef<HTMLVideoElement>(null);
  const hover = (on: boolean) => { setAwake(on); if (!on) setRolling(false); };
  useEffect(() => {
    const v = clip.current;
    if (!v) return;
    if (awake && !prefersReducedMotion()) {
      v.currentTime = 0;
      // A hover that ends before the file is ready aborts this play(), which
      // rejects; that is the normal way out, not an error worth reporting.
      void v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [awake]);
  const live = awake && rolling;

  // The hoverable box is the CUBBY, not the statue's own outline: it is the
  // cubby the clip replaces, so one box carries the label, the motion and the
  // link, and there is nothing to keep in sync. Its numbers are the crop the
  // clip was cut from, 27.214% to 38.900% across and 11.182% to 37.500% down
  // of the case box, which is why the video lands back on its own woodwork
  // exactly.
  return (
    <InkTip
      label="The Award"
      meta="“Redesigning the Redesign”"
      place="bottom"
      style={{
        position: "absolute",
        left: `${AWARD_CUBBY.l}%`,
        top: `${AWARD_CUBBY.t}%`,
        width: `${AWARD_CUBBY.w}%`,
        height: `${AWARD_CUBBY.h}%`,
        zIndex: 2,
      }}
      onHoverChange={hover}
    >
      <Link
        href="/#recognition"
        aria-label="Recognition – the award for Redesigning the Redesign"
        className="block absolute inset-0"
        // like Recognition in the index: over to the wall, not a page
        onClick={(e) => {
          if (!shouldOpenDesk(e)) return;
          e.preventDefault();
          window.dispatchEvent(new Event(AWARD_EVENT));
        }}
      >
        {/* Shot to match the case, and seated on the shelf rather than
            floating in front of it.

            The camera: the cubby's floor sits at 35.6% of the case box,
            well above the plate's horizon, so we look UP at anything
            standing on it — which is why the case shows the undersides of
            its shelves. The first trophy was photographed from above (the
            top of its plinth was an open ellipse) and read as pasted on. It
            was re-shot from below: the base mouldings curve upward, the
            plinth's top face is hidden, the plaque tips slightly back. A
            CSS rotateX was tried first and rejected — a 2D warp only
            foreshortens the image, it cannot open those ellipses, so it
            read as the figure shrinking rather than the plinth turning.

            The occlusion: shooting from below leaves the underside of the
            base showing as a downward bulge, and an object standing on a
            shelf can never show that — the shelf's front lip cuts across
            it. So the PNG is cropped near the base's widest row, 1354px
            down to 1286 — a touch past the bottom ring's side tangents — so
            what is left ends in a straight line, and that line is the lip.

            The placement is given inside the cubby box rather than the case
            box: 14.86% across and 22.00% down of it, 72.74% of its width.
            That puts the base at 35.18% of the case box, just above the
            shelf's front lip, so the bottom ring reads as tucked behind the
            wood rather than resting on top of it.

            The light: ambient light cannot reach into a recess, hence the
            brightness and saturation taken off and the warm cast, matching
            the dark wood it stands in. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/mid-top-trophy.sm.webp"
          alt=""
          style={{
            position: "absolute",
            left: "14.96%",
            top: "22.00%",
            width: "72.74%",
            height: "auto",
            filter:
              "brightness(0.84) saturate(0.90) sepia(0.08) drop-shadow(0 2px 3px rgba(0,0,0,0.55)) drop-shadow(0 7px 10px rgba(0,0,0,0.32))",
            opacity: live ? 0 : 1,
            transition: "opacity 120ms linear",
          }}
          draggable={false}
        />

        {/* Her clip fills the box it was cut from, so every edge of the
            woodwork lands on itself. `fill`, not `cover` — the element
            already carries the crop's aspect, and a cover crop would shave
            a little off and break the alignment it is here to keep. It
            never takes the pointer: the link around it is the target, and
            the clip must not shadow its own hover. */}
        {/* The filename carries a version: the first clip was shot before
            the statue was raised, so a browser holding it in cache would
            keep playing a take that sits three pixels low. */}
        <video
          ref={clip}
          src="/items/mid-top-trophy-turn.mp4"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          onPlaying={() => setRolling(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            opacity: live ? 1 : 0,
            transition: "opacity 120ms linear",
            pointerEvents: "none",
          }}
        />

        {/* The clip's own borders, covered by the case itself: the top of
            the cubby, both side walls and the shelf lip. Each strip sits
            clear of the statue — the still ends at 35.19% and the lip strip
            starts at 35.5% — so they only ever hide woodwork. */}
        <CaseInlay l={27.214} t={11.182} w={11.686} h={1.2} />
        <CaseInlay l={27.214} t={35.5} w={11.686} h={2.0} />
        <CaseInlay l={27.214} t={11.182} w={1.0} h={26.318} />
        <CaseInlay l={37.9} t={11.182} w={1.0} h={26.318} />
      </Link>
    </InkTip>
  );
}
