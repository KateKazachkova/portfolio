"use client";

/**
 * The gold pocket watch that hangs in the case and tells — and sets — the
 * hour. The engraved case is a generated still
 * (/items/left-3-pocketwatch.webp); its plain white enamel is covered by a
 * second still — the astronomical dial in /items/pocketwatch-dial.webp, cut to
 * a circle — and the hands are two more stills, pinned by their pivots and
 * turned about the dial's centre. Dragging the hour
 * hand round the face sets the scene's hour, the same whole-hour model the old
 * clock used: 12 at the top, 30° an hour, and passing twelve carries over
 * between AM and PM.
 */

import { useRef, useCallback } from "react";

// The dial's centre and radius inside the 528×897 still, in its own pixels —
// measured off the enamel in the file, not guessed.
const VB_W = 528;
const VB_H = 897;
const CX = 263;
const CY = 630;
const R_DIAL = 186;
const HOUR_LEN = 100;
const MIN_LEN = 142;

/** A hand still, in its own pixels: the whole image, the pivot inside it (the
 *  centre of the disc at its foot) and the distance from that pivot to the
 *  tip. The SVG scales each one so that distance becomes HOUR_LEN / MIN_LEN,
 *  then puts the pivot on the dial's centre and turns it from there. Every
 *  number is rounded, because Node and the browser print a float's last digit
 *  differently and React calls that a hydration mismatch. */
const HANDS = {
  hour: { src: "/items/hand-hour.webp", w: 140, h: 626, px: 69.5, py: 552.5, len: 485.5 },
  minute: { src: "/items/hand-minute.webp", w: 140, h: 900, px: 69, py: 818, len: 803 },
} as const;

function Hand({ hand, len, deg }: { hand: typeof HANDS[keyof typeof HANDS]; len: number; deg: number }) {
  const s = Math.round((len / hand.len) * 10000) / 10000;
  const w = Math.round(hand.w * s * 100) / 100;
  const h = Math.round(hand.h * s * 100) / 100;
  const x = Math.round((CX - hand.px * s) * 100) / 100;
  const y = Math.round((CY - hand.py * s) * 100) / 100;
  return (
    <image
      href={hand.src}
      x={x}
      y={y}
      width={w}
      height={h}
      transform={`rotate(${deg} ${CX} ${CY})`}
      // Only a shadow: these hands are pale enough to read on the blue by
      // themselves, and it is what lifts them off the tracery.
      style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.55)) drop-shadow(0 3px 3px rgba(0,0,0,0.45))" }}
    />
  );
}

export default function PocketWatch({
  hour,
  onChange,
}: {
  hour: number;
  onChange: (h: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const hourRef = useRef(hour);
  hourRef.current = hour;

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      // The dial centre is at CX/CY within the viewBox, not the element centre.
      const cx = r.left + (CX / VB_W) * r.width;
      const cy = r.top + (CY / VB_H) * r.height;
      const deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
      const targetH12 = Math.round((((deg % 360) + 360) % 360) / 30) % 12;
      const cur = hourRef.current;
      let delta = targetH12 - (cur % 12);
      if (delta > 6) delta -= 12;
      if (delta < -6) delta += 12;
      const next = (cur + delta + 24) % 24;
      hourRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  return (
    // Tilted 12° away from the viewer, so the watch sits back in the case
    // instead of facing the screen flat. The hands ride the same transform.
    <div
      style={{
        position: "relative",
        width: "100%",
        transform: "perspective(900px) rotateX(12deg)",
        transformOrigin: "center top",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/items/left-3-pocketwatch.webp"
        alt="A gold pocket watch with an astronomical dial"
        className="pocketwatch-img"
        style={{ display: "block", width: "100%", height: "auto" }}
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => dragging.current && setFromPointer(e.clientX, e.clientY)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <defs>
          {/* The crystal over the dial: one sweep of light, top-left to centre. */}
          <linearGradient id="pw-crystal" x1="12%" y1="4%" x2="72%" y2="76%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="46%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {/* The bezel's shadow falling onto the dial. */}
          <radialGradient id="pw-vignette" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#1a130a" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a130a" stopOpacity="0.42" />
          </radialGradient>
        </defs>

        {/* ── The dial ──
            Laid over the still's plain white enamel, so the printed arabic
            numerals underneath are covered rather than competing. */}
        <g className="pocketwatch-dial">
          <image
            href="/items/pocketwatch-dial.webp"
            x={CX - R_DIAL}
            y={CY - R_DIAL}
            width={R_DIAL * 2}
            height={R_DIAL * 2}
            preserveAspectRatio="xMidYMid slice"
          />
          <circle cx={CX} cy={CY} r={R_DIAL} fill="url(#pw-crystal)" />
          <circle cx={CX} cy={CY} r={R_DIAL} fill="url(#pw-vignette)" />
        </g>

        {/* The hands: the minute one resting at twelve, the hour one carrying
            the scene's hour, both turned about the dial's centre. */}
        <Hand hand={HANDS.minute} len={MIN_LEN} deg={0} />
        <Hand hand={HANDS.hour} len={HOUR_LEN} deg={(hour % 12) * 30} />

        {/* Second hand — thin red, a short counterweight tail, sweeping once a
            minute. SMIL keeps it turning with no JS or re-renders. */}
        <g>
          <line x1={CX} y1={CY + 34} x2={CX} y2={CY - 160} stroke="#b23a2e" strokeWidth={3} strokeLinecap="round" />
          <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="60s" repeatCount="indefinite" />
        </g>
      </svg>
    </div>
  );
}
