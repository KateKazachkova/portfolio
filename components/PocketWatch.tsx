"use client";

/**
 * The gold pocket watch that hangs in the case and tells — and sets — the
 * hour. The engraved case is a generated still
 * (/items/left-3-pocketwatch.webp); everything inside the bezel is SVG drawn
 * over it — the enamel, the roman chapter ring, the engraved circle-work and
 * the hands — so the dial can be anything and the hands can turn. Dragging the
 * hour hand round the face sets the scene's hour, the same whole-hour model the
 * old clock used: 12 at the top, 30° an hour, and passing twelve carries over
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
const HOUR_LEN = 104;
const MIN_LEN = 148;

const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

/** A point on the dial at `deg` clockwise from twelve, `r` from the centre. */
function at(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  // Rounded: Node and the browser print the last digit of a float differently,
  // and React calls that a hydration mismatch on every tick of the dial.
  const q = (n: number) => Math.round(n * 100) / 100;
  return { x: q(CX + r * Math.cos(rad)), y: q(CY + r * Math.sin(rad)) };
}

/** The circle-work under the hands: rings of small circles hung off larger
 *  ones, the way a language written in circles would look. Fixed numbers
 *  rather than random, so the dial is the same drawing on every render. */
const GLYPHS = [
  { deg: 318, r: 74, R: 34 },
  { deg: 214, r: 66, R: 27 },
  { deg: 96, r: 70, R: 30 },
] as const;

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

  const hand = (len: number, angleDeg: number) => at(angleDeg, len);
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
        alt="A gold pocket watch with a pale enamel dial engraved with circles"
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
          {/* Enamel: cold near the rim, warm where the light falls, like glazed
              metal rather than paper. */}
          <radialGradient id="pw-enamel" cx="42%" cy="34%" r="78%">
            <stop offset="0%" stopColor="#eaf1fb" />
            <stop offset="55%" stopColor="#d2dcee" />
            <stop offset="100%" stopColor="#b3c3dc" />
          </radialGradient>
          {/* The crystal over it: one sweep of light, top-left to centre. */}
          <linearGradient id="pw-crystal" x1="12%" y1="4%" x2="72%" y2="76%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
            <stop offset="46%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {/* The bezel's shadow falling onto the enamel. */}
          <radialGradient id="pw-vignette" cx="50%" cy="50%" r="50%">
            <stop offset="72%" stopColor="#2b2216" stopOpacity="0" />
            <stop offset="100%" stopColor="#2b2216" stopOpacity="0.34" />
          </radialGradient>
        </defs>

        {/* ── The dial ──
            Drawn over the still's plain white enamel, so the printed arabic
            numerals underneath are covered rather than competing. */}
        <g className="pocketwatch-dial">
          <circle cx={CX} cy={CY} r={R_DIAL} fill="url(#pw-enamel)" />

          {/* engraved circle-work, faint, under everything else */}
          <g stroke="#4c5d80" fill="none" opacity="0.62">
            <circle cx={CX} cy={CY} r={132} strokeWidth={1.1} />
            <circle cx={CX} cy={CY} r={112} strokeWidth={0.8} />
            <circle cx={CX} cy={CY} r={58} strokeWidth={0.8} />
            <circle cx={CX} cy={CY} r={40} strokeWidth={1.1} />
            {/* the thin spokes that tie the rings together */}
            {[24, 96, 168, 240, 312].map((d) => {
              const a = at(d, 40);
              const b = at(d, 132);
              return <line key={d} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={0.7} />;
            })}
            {/* small circles hung round the inner ring */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
              const p = at(d, 112);
              return <circle key={d} cx={p.x} cy={p.y} r={7} strokeWidth={0.8} />;
            })}
          </g>

          {/* the three saffron glyphs, the loudest thing on the dial */}
          {GLYPHS.map((g) => {
            const c = at(g.deg, g.r);
            return (
              <g key={g.deg}>
                <circle cx={c.x} cy={c.y} r={g.R} fill="#e0a021" stroke="#2a2118" strokeWidth={3} />
                <circle cx={c.x} cy={c.y} r={g.R * 0.58} fill="#e7eefa" stroke="#2a2118" strokeWidth={2.4} />
                <circle cx={c.x} cy={c.y} r={g.R * 0.26} fill="#e0a021" stroke="#2a2118" strokeWidth={1.8} />
                {/* one satellite, so no two read as the same word */}
                {(() => {
                  const s = at(g.deg + 120, g.r + g.R * 0.9);
                  return <circle cx={s.x} cy={s.y} r={g.R * 0.2} fill="#e0a021" stroke="#2a2118" strokeWidth={1.6} />;
                })()}
              </g>
            );
          })}

          {/* chapter ring: roman numerals upright, minutes ticked outside them */}
          <g fill="#171310">
            {ROMAN.map((n, i) => {
              const p = at(i * 30, 150);
              return (
                <text
                  key={n}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 30, fontWeight: 600 }}
                >
                  {n}
                </text>
              );
            })}
          </g>
          <g stroke="#171310">
            {Array.from({ length: 60 }, (_, i) => {
              const long = i % 5 === 0;
              const a = at(i * 6, long ? 168 : 173);
              const b = at(i * 6, 179);
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={long ? 2.6 : 1.1} opacity={long ? 0.9 : 0.55} />;
            })}
          </g>

          {/* glass over the drawing, then the bezel's shadow on the enamel */}
          <circle cx={CX} cy={CY} r={R_DIAL} fill="url(#pw-crystal)" />
          <circle cx={CX} cy={CY} r={R_DIAL} fill="url(#pw-vignette)" />
          <circle cx={CX} cy={CY} r={R_DIAL} fill="none" stroke="#2a2118" strokeWidth={2} opacity={0.4} />
        </g>

        {/* minute hand (thinner, longer), then hour hand (thicker, shorter) */}
        <line x1={CX} y1={CY} x2={mm.x} y2={mm.y} stroke="#1a1a1a" strokeWidth={9} strokeLinecap="round" />
        <line x1={CX} y1={CY} x2={hh.x} y2={hh.y} stroke="#111" strokeWidth={13} strokeLinecap="round" />
        {/* Second hand — thin red, a short counterweight tail, sweeping once a
            minute. SMIL keeps it turning with no JS or re-renders. */}
        <g>
          <line x1={CX} y1={CY + 34} x2={CX} y2={CY - 168} stroke="#b23a2e" strokeWidth={3} strokeLinecap="round" />
          <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="60s" repeatCount="indefinite" />
        </g>
        <circle cx={CX} cy={CY} r={12} fill="#caa04a" stroke="#7a5a1e" strokeWidth={3} />
      </svg>
    </div>
  );
}
