"use client";

import EditionClock from "@/components/EditionClock";
import { useTime } from "@/components/TimeProvider";
import { EDITIONS, editionForHour } from "@/lib/time";

const mono = "var(--font-mono), ui-monospace, monospace";

export default function Home() {
  const { hour, setHour, setNow } = useTime();
  const edition = hour === null ? EDITIONS.office : editionForHour(hour);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-10 select-none px-6 py-14" style={{ background: "transparent" }}>

      {/* Eyebrow */}
      <div className="text-center">
        <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.25em" }} className="text-gray-400 uppercase mb-2">
          KATE™ · Collector Edition
        </p>
        <p className="text-sm text-gray-500 max-w-md mx-auto italic">A designer who turns chaos into systems.</p>
      </div>

      {/* Suitcase */}
      <div style={{ position: "relative", width: "min(88vw, 860px)", aspectRatio: "1536 / 1024" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/suitcase/open.png" alt="Kate's collector suitcase" className="absolute inset-0 w-full h-full object-contain" draggable={false} />

        {/* Doll in the central niche */}
        <div
          className="group"
          style={{ position: "absolute", left: "49%", bottom: "18%", height: "60%", transform: "translateX(-50%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/dolls/cut/${edition.key}.png`}
            alt={edition.label}
            className="h-full w-auto transition-transform duration-500 group-hover:-translate-y-2"
            style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}
            draggable={false}
          />
        </div>
      </div>

      {/* Caption */}
      <div className="text-center -mt-2">
        <p style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.15em" }} className="uppercase">
          {edition.label}{edition.slogan ? ` · “${edition.slogan}”` : ""}
        </p>
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em" }} className="text-gray-400 uppercase mt-1">
          {hour !== null ? `${((hour % 12) || 12)}:00 ${hour >= 12 ? "PM" : "AM"} · your local time` : ""}
        </p>
      </div>

      {/* Clock */}
      <div>
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase text-center mb-3">
          Set the time
        </p>
        <EditionClock hour={hour ?? 12} onChange={setHour} onNow={setNow} />
      </div>
    </main>
  );
}
