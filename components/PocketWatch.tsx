"use client";

/**
 * The gold pocket watch that hangs in the case and tells — and sets — the
 * hour. The engraved case and empty enamel dial are a generated still
 * (/items/left-3-pocketwatch.webp); the hands are SVG drawn over the dial, so they
 * turn. Dragging the hour hand round the face sets the scene's hour, the same
 * whole-hour model the old clock used: 12 at the top, 30° an hour, and passing
 * twelve carries over between AM and PM.
 */

import { useRef, useCallback } from "react";

// The dial's centre and radius inside the 528×897 still, in its own pixels.
const VB_W = 528;
const VB_H = 897;
const CX = 264;
const CY = 620;
const HOUR_LEN = 112;
const MIN_LEN = 156;

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

  const hand = (len: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: CX + len * Math.cos(rad), y: CY + len * Math.sin(rad) };
  };
  const hh = hand(HOUR_LEN, (hour % 12) * 30);
  const mm = hand(MIN_LEN, 0); // whole-hour model: minute rests at twelve

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
        alt="A gold pocket watch"
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
        {/* minute hand (thinner, longer), then hour hand (thicker, shorter) */}
        <line x1={CX} y1={CY} x2={mm.x} y2={mm.y} stroke="#1a1a1a" strokeWidth={9} strokeLinecap="round" />
        <line x1={CX} y1={CY} x2={hh.x} y2={hh.y} stroke="#111" strokeWidth={13} strokeLinecap="round" />
        {/* Second hand — thin red, a short counterweight tail, sweeping once a
            minute. SMIL keeps it turning with no JS or re-renders. */}
        <g>
          <line x1={CX} y1={CY + 34} x2={CX} y2={CY - 176} stroke="#b23a2e" strokeWidth={3} strokeLinecap="round" />
          <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="60s" repeatCount="indefinite" />
        </g>
        <circle cx={CX} cy={CY} r={12} fill="#caa04a" stroke="#7a5a1e" strokeWidth={3} />
      </svg>
    </div>
  );
}
