"use client";

import { useState } from "react";
import type { WatchItem } from "@/lib/content";

const mono = "var(--font-mono), ui-monospace, monospace";
// Cloth-cover ink colours, cycled per spine
const SPINES = ["var(--accent-red)", "var(--accent-blue)", "var(--accent-green)", "var(--fg)"];
// Slight height variation for a real shelf
const HEIGHTS = [200, 184, 210, 192, 176, 204, 188];

export default function BookShelf({ books }: { books: WatchItem[] }) {
  const [selected, setSelected] = useState(0);
  if (books.length === 0) return null;
  const active = books[selected];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start">
      {/* ── Shelf ── */}
      <div>
        <div className="flex items-end gap-[3px] overflow-x-auto pb-0">
          {books.map((b, i) => {
            const isActive = i === selected;
            const bg = SPINES[i % SPINES.length];
            const light = bg === "var(--fg)" || bg === "var(--accent-blue)" || bg === "var(--accent-green)" || bg === "var(--accent-red)";
            return (
              <button
                key={b.title}
                onClick={() => setSelected(i)}
                title={b.title}
                className="relative shrink-0 flex items-center justify-center border-2 transition-transform"
                style={{
                  width: 38,
                  height: HEIGHTS[i % HEIGHTS.length],
                  background: bg,
                  borderColor: "var(--border)",
                  transform: isActive ? "translateY(-10px)" : "translateY(0)",
                }}
              >
                <span
                  className="font-bold uppercase whitespace-nowrap overflow-hidden"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                    fontSize: 11,
                    letterSpacing: "0.05em",
                    color: light ? "#f4ecdb" : "var(--bg)",
                    maxHeight: "80%",
                  }}
                >
                  {b.title}
                </span>
              </button>
            );
          })}
        </div>
        {/* shelf plank */}
        <div className="h-2 border-2 border-t-0" style={{ borderColor: "var(--border)", background: "var(--inner)" }} />
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
          Pull a book · {books.length} on the shelf
        </p>
      </div>
    </div>
  );
}
