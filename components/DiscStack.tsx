"use client";

import { useState } from "react";
import type { WatchItem } from "@/lib/content";

const mono = "var(--font-mono), ui-monospace, monospace";

export default function DiscStack({ series }: { series: WatchItem[] }) {
  const [selected, setSelected] = useState(0);
  if (series.length === 0) return null;
  const active = series[selected];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start">
      {/* ── Disc rack ── */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {series.map((s, i) => {
          const isActive = i === selected;
          return (
            <button
              key={s.title}
              onClick={() => setSelected(i)}
              title={s.title}
              className="relative aspect-square rounded-full overflow-hidden border-2 transition-transform"
              style={{
                borderColor: isActive ? "var(--accent-red)" : "var(--border)",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                boxShadow: isActive ? "0 0 0 3px var(--accent)" : "none",
              }}
            >
              {/* printed disc art */}
              {s.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.poster} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-center px-1 font-black uppercase" style={{ background: "var(--inner)", color: "var(--fg)", fontSize: 8 }}>
                  {s.title}
                </span>
              )}
              {/* iridescent sheen */}
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "conic-gradient(from 0deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 25%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 75%, rgba(255,255,255,0.35))",
                  mixBlendMode: "overlay",
                  opacity: 0.6,
                }}
              />
              {/* centre hub + hole */}
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center"
                style={{ width: "34%", height: "34%", borderColor: "var(--border)", background: "var(--bg)" }}>
                <span className="rounded-full" style={{ width: "34%", height: "34%", background: "var(--inner)", border: "1px solid var(--border)" }} />
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Detail: cover + text ── */}
      <div className="md:sticky md:top-20">
        <div className="border-2" style={{ borderColor: "var(--border)" }}>
          <div className="aspect-[2/3] overflow-hidden flex items-center justify-center" style={{ background: "var(--inner)" }}>
            {active.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.poster} alt={active.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-center px-3 font-black uppercase" style={{ color: "var(--fg)", fontSize: 16 }}>{active.title}</span>
            )}
          </div>
          <div className="p-4 border-t-2" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <h3 className="font-black uppercase leading-tight" style={{ color: "var(--fg)", fontSize: 16 }}>{active.title}</h3>
              {active.year && <span style={{ fontFamily: mono, fontSize: 12 }} className="text-gray-400">{active.year}</span>}
            </div>
            {active.why ? (
              <p className="text-sm text-gray-500 italic leading-relaxed">{active.why}</p>
            ) : (
              <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }} className="text-gray-400 uppercase">In the collection</p>
            )}
          </div>
        </div>
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em" }} className="text-gray-400 uppercase mt-3">
          Select a disc · {series.length} in collection
        </p>
      </div>
    </div>
  );
}
