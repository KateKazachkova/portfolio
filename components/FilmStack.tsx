"use client";

import { useState } from "react";
import type { WatchItem } from "@/lib/content";

const mono = "var(--font-mono), ui-monospace, monospace";
// Retro cassette side-codes, cycled per spine
const CODES = ["VHS", "T-120", "HG", "E-180", "HQ", "SP"];

export default function FilmStack({ films }: { films: WatchItem[] }) {
  const [selected, setSelected] = useState(0);
  if (films.length === 0) return null;
  const active = films[selected];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start">
      {/* ── Cassette stack ── */}
      <div className="flex flex-col gap-[6px]">
        {films.map((f, i) => {
          const isActive = i === selected;
          return (
            <button
              key={f.title}
              onClick={() => setSelected(i)}
              className="group relative flex items-stretch h-12 border-2 text-left transition-transform"
              style={{
                borderColor: "var(--border)",
                background: isActive ? "var(--accent)" : "var(--panel)",
                transform: isActive ? "translateX(10px)" : "translateX(0)",
              }}
            >
              {/* left reel cap / index */}
              <span
                className="flex items-center justify-center px-2 border-r-2 shrink-0"
                style={{ borderColor: "var(--border)", fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: "var(--fg)", minWidth: 40 }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* label */}
              <span className="flex-1 flex items-center gap-3 px-3 overflow-hidden">
                <span className="font-black uppercase truncate" style={{ color: "var(--fg)", fontSize: 14, letterSpacing: "-0.01em" }}>
                  {f.title}
                </span>
              </span>

              {/* colour stripe */}
              <span className="w-2 shrink-0" style={{ background: "var(--accent-red)" }} />

              {/* right code + year */}
              <span
                className="flex items-center gap-2 px-2 border-l-2 shrink-0"
                style={{ borderColor: "var(--border)", fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}
              >
                <span className="hidden sm:inline">{CODES[i % CODES.length]}</span>
                {f.year && <span style={{ color: "var(--fg)" }}>{f.year}</span>}
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
              <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em" }} className="text-gray-400 uppercase">On the shelf</p>
            )}
          </div>
        </div>
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em" }} className="text-gray-400 uppercase mt-3">
          Select a tape ← · {films.length} in collection
        </p>
      </div>
    </div>
  );
}
