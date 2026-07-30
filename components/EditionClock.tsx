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

  // 24h dial: 0h at top, clockwise. 15° per hour.
  const angle = (hour % 24) * 15;
  const rad = (angle - 90) * (Math.PI / 180);
  const R = 34;
  const hx = 50 + R * Math.cos(rad);
  const hy = 50 + R * Math.sin(rad);

  const setFromPointer = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    const h = Math.round((((deg % 360) + 360) % 360) / 15) % 24;
    onChange(h);
  }, [onChange]);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        width={140}
        height={140}
        style={{ cursor: "grab", touchAction: "none" }}
        onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); setFromPointer(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (dragging.current) setFromPointer(e.clientX, e.clientY); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerLeave={() => { dragging.current = false; }}
      >
        {/* face */}
        <circle cx="50" cy="50" r="46" fill="var(--panel)" stroke="var(--border)" strokeWidth="2" />
        {/* ticks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 15 - 90) * (Math.PI / 180);
          const major = i % 6 === 0;
          const r1 = major ? 38 : 41;
          const r2 = 45;
          return (
            <line key={i}
              x1={50 + r1 * Math.cos(a)} y1={50 + r1 * Math.sin(a)}
              x2={50 + r2 * Math.cos(a)} y2={50 + r2 * Math.sin(a)}
              stroke="var(--border)" strokeWidth={major ? 1.4 : 0.6} opacity={major ? 1 : 0.5} />
          );
        })}
        {/* labels 0/6/12/18 */}
        {[["0", 0], ["6", 6], ["12", 12], ["18", 18]].map(([lbl, h]) => {
          const a = ((h as number) * 15 - 90) * (Math.PI / 180);
          return (
            <text key={lbl as string} x={50 + 30 * Math.cos(a)} y={50 + 30 * Math.sin(a) + 2}
              textAnchor="middle" style={{ fontFamily: mono, fontSize: 6, fill: "var(--muted)" }}>{lbl as string}</text>
          );
        })}
        {/* hand */}
        <line x1="50" y1="50" x2={hx} y2={hy} stroke="var(--accent-red)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="50" r="3" fill="var(--accent-red)" />
        <circle cx={hx} cy={hy} r="2.5" fill="var(--accent-red)" />
      </svg>

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
