"use client";

import { useState, useCallback, useEffect } from "react";
import EditionClock from "@/components/EditionClock";

type Edition = {
  key: string;
  label: string;
  slogan: string | null;
  range: string;
  items: string[];
};

const EDITIONS: Record<string, Edition> = {
  morning: { key: "morning", label: "Morning Edition", slogan: "Loading… Please Wait", range: "07–09", items: ["Mushroom mug", "Blue cardigan", "Stitch pyjamas"] },
  office:  { key: "office",  label: "Day Edition",     slogan: "The Investigator",   range: "09–17", items: ["Polaroid", "Notebook", "VHS", "Case folder"] },
  street:  { key: "street",  label: "Street Edition",  slogan: "Urban Explorer",     range: "17–19", items: ["Flashlight", "Old map", "Compass", "Key"] },
  evening: { key: "evening", label: "Evening Edition", slogan: null,                 range: "19–23", items: [] },
  night:   { key: "night",   label: "Deep Night Edition", slogan: "Archive Mode",    range: "23–07", items: ["Blanket", "Harari books", "Film negatives"] },
};

function editionForHour(h: number): Edition {
  if (h >= 7 && h < 9) return EDITIONS.morning;
  if (h >= 9 && h < 17) return EDITIONS.office;
  if (h >= 17 && h < 19) return EDITIONS.street;
  if (h >= 19 && h < 23) return EDITIONS.evening;
  return EDITIONS.night;
}

const mono = "var(--font-mono), ui-monospace, monospace";

export default function Home() {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => { setHour(new Date().getHours()); }, []);
  const setNow = useCallback(() => setHour(new Date().getHours()), []);

  const edition = hour === null ? EDITIONS.office : editionForHour(hour);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-10 select-none px-6 py-14" style={{ background: "var(--bg)" }}>

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
        <p style={{ fontFamily: mono, fontSize: 12, letterSpacing: "0.15em" }} className="uppercase" >
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
