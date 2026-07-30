"use client";

import { useRef, useCallback } from "react";

const mono = "var(--font-mono), ui-monospace, monospace";

const PRESETS: { label: string; hour: number }[] = [
  { label: "Morning", hour: 8 },
  { label: "Day", hour: 13 },
  { label: "Street", hour: 18 },
  { label: "Evening", hour: 21 },
  { label: "Night", hour: 2 },
];

export default function EditionClock({
  hour,
  onChange,
  onNow,
}: {
  hour: number;
  onChange: (h: number) => void;
  onNow: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const isPM = hour >= 12;
  // 12h face: 12 at top, 30° per hour.
  const hour12 = hour % 12;
  const angle = hour12 * 30;
  const rad = (angle - 90) * (Math.PI / 180);
  const R = 32;
  const hx = 50 + R * Math.cos(rad);
  const hy = 50 + R * Math.sin(rad);

  const setFromPointer = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    const h12 = Math.round((((deg % 360) + 360) % 360) / 30) % 12; // 0..11
    const next = isPM ? h12 + 12 : h12; // keep current AM/PM half
    onChange(next % 24);
  }, [onChange, isPM]);

  const toggleMeridiem = () => onChange(isPM ? hour - 12 : hour + 12);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          width={150}
          height={150}
          style={{ cursor: "grab", touchAction: "none" }}
          onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); setFromPointer(e.clientX, e.clientY); }}
          onPointerMove={(e) => { if (dragging.current) setFromPointer(e.clientX, e.clientY); }}
          onPointerUp={() => { dragging.current = false; }}
          onPointerLeave={() => { dragging.current = false; }}
        >
          {/* face */}
          <circle cx="50" cy="50" r="46" fill="var(--panel)" stroke="var(--border)" strokeWidth="2" />
          {/* minute ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 - 90) * (Math.PI / 180);
            return (
              <line key={i}
                x1={50 + 40 * Math.cos(a)} y1={50 + 40 * Math.sin(a)}
                x2={50 + 45 * Math.cos(a)} y2={50 + 45 * Math.sin(a)}
                stroke="var(--border)" strokeWidth={1.2} />
            );
          })}
          {/* numerals 12/3/6/9 */}
          {[["12", 0], ["3", 3], ["6", 6], ["9", 9]].map(([lbl, h]) => {
            const a = ((h as number) * 30 - 90) * (Math.PI / 180);
            return (
              <text key={lbl as string} x={50 + 33 * Math.cos(a)} y={50 + 33 * Math.sin(a) + 3}
                textAnchor="middle" style={{ fontFamily: mono, fontSize: 8, fontWeight: 700, fill: "var(--fg)" }}>{lbl as string}</text>
            );
          })}
          {/* hand */}
          <line x1="50" y1="50" x2={hx} y2={hy} stroke="var(--accent-red)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="50" r="3.5" fill="var(--accent-red)" />
        </svg>
        {/* AM/PM toggle */}
        <button
          onClick={toggleMeridiem}
          className="absolute left-1/2 -translate-x-1/2 uppercase font-bold border"
          style={{ bottom: 26, fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", padding: "2px 8px", borderColor: "var(--border)", background: "var(--bg)", color: "var(--fg)" }}
        >
          {isPM ? "PM" : "AM"}
        </button>
      </div>

      {/* presets */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xs">
        {PRESETS.map((p) => {
          const active = hour === p.hour;
          return (
            <button
              key={p.label}
              onClick={() => onChange(p.hour)}
              className="uppercase font-bold border transition-colors"
              style={{
                fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", padding: "4px 9px",
                borderColor: "var(--border)",
                background: active ? "var(--border)" : "transparent",
                color: active ? "var(--bg)" : "var(--fg)",
              }}
            >
              {p.label}
            </button>
          );
        })}
        <button
          onClick={onNow}
          className="uppercase font-bold border transition-colors hover:opacity-70"
          style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", padding: "4px 9px", borderColor: "var(--accent-red)", color: "var(--accent-red)" }}
        >
          Now
        </button>
      </div>
    </div>
  );
}
