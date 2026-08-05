"use client";

import { useState, useEffect } from "react";
import EditionClock from "@/components/EditionClock";
import NicheDoll, { hasNicheClip } from "@/components/NicheDoll";
// import IntroOverlay from "@/components/IntroOverlay"; // opening hidden for now
import { useTime } from "@/components/TimeProvider";
import { EDITIONS, editionForHour, editionForDate } from "@/lib/time";

const mono = "var(--font-mono), ui-monospace, monospace";

// Animated (transparent WebM) doll per edition; falls back to the static cutout.
// office video disabled for now — it shows the old (pre-v2) doll; regenerate from the v2 cut later.
const EDITION_VIDEO: Record<string, string> = {};

export default function Home() {
  const { hour, auto, setHour, setNow } = useTime();
  // Manual mode override — buttons force a specific edition (incl. the
  // weekend ones, which otherwise only show on Saturday). Cleared by the
  // clock / presets / Now.
  const [forced, setForced] = useState<string | null>(null);
  const edition =
    forced ? EDITIONS[forced]
    : hour === null ? EDITIONS.office
    : auto ? editionForDate(new Date())
    : editionForHour(hour);

  const pickHour = (h: number) => { setForced(null); setHour(h); };
  const pickNow = () => { setForced(null); setNow(); };

  // Match the ambient mood while previewing a forced edition.
  useEffect(() => {
    if (!forced) return;
    const mood = (forced === "weekend_cleaning" || forced === "weekend_series") ? "day" : "morning";
    document.documentElement.setAttribute("data-daytime", mood);
  }, [forced]);
  const [videoFailed, setVideoFailed] = useState(false);
  const dollVideo = EDITION_VIDEO[edition.key];

  const clockPanel = (
    <div>
      <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase text-center mb-3">
        Set the time
      </p>
      <EditionClock hour={hour ?? 12} onChange={pickHour} onNow={pickNow} />

      {/* Weekend modes — preview her days off directly */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mr-1">
          Weekend
        </span>
        {[
          { label: "Brunch", key: "weekend_brunch" },
          { label: "Cleaning", key: "weekend_cleaning" },
          { label: "Series", key: "weekend_series" },
        ].map((m) => {
          const active = forced === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setForced(m.key)}
              className="uppercase font-bold border transition-colors"
              style={{
                fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", padding: "4px 9px",
                borderColor: "var(--border)",
                background: active ? "var(--border)" : "transparent",
                color: active ? "var(--bg)" : "var(--fg)",
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-10 select-none px-6 py-14" style={{ background: "transparent" }}>

      {/* Eyebrow */}
      <div className="text-center">
        <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.25em" }} className="text-gray-400 uppercase mb-2">
          KATE™ · Collector Edition
        </p>
        <p className="text-sm text-gray-500 max-w-md mx-auto italic">A designer who turns chaos into systems.</p>
      </div>

      {/* Suitcase + clock. The box stays centred; on wide screens the clock
          sits to its right (absolute, so the box itself never shifts). */}
      <div className="relative w-full flex justify-center">
      <div style={{ position: "relative", width: "min(88vw, 860px)", aspectRatio: "1536 / 1024" }}>
        {/* Contact shadow – sits right under the base */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            bottom: "11%",
            transform: "translateX(-50%)",
            width: "88%",
            height: "3.5%",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.40), rgba(0,0,0,0) 72%)",
            filter: "blur(5px)",
            zIndex: 0,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/suitcase/open2.png" alt="Kate's collector suitcase" className="absolute inset-0 w-full h-full object-contain" style={{ zIndex: 1 }} draggable={false} />

        {/* Trophy on the left shelf (top cubby above the drawers) */}
        <div
          className="group"
          style={{ position: "absolute", left: "28%", top: "13.6%", width: "10%", zIndex: 2 }}
          title="Award – In recognition of “Redesigning the Redesign”"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/trophy.png"
            alt="Award: Redesigning the Redesign"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.35))" }}
            draggable={false}
          />
        </div>

        {/* Figma sticker on the top drawer → Figma community profile */}
        <a
          href="https://www.figma.com/@uxui_kazachkova"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Figma — @uxui_kazachkova"
          title="Figma — @uxui_kazachkova"
          className="group"
          style={{ position: "absolute", left: "28.2%", top: "50.3%", width: "3.9%", height: "5.9%", zIndex: 4, borderRadius: 9 }}
        >
          <span
            aria-hidden
            className="block w-full h-full rounded-lg ring-0 transition duration-300 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-[#A259FF]/70 group-hover:shadow-[0_6px_16px_rgba(162,89,255,0.45)]"
          />
        </a>

        {/* Left door — top shelf: TV box sets */}
        <div
          className="group"
          style={{ position: "absolute", left: "10.5%", top: "13.0%", width: "13%", zIndex: 2 }}
          title="Box sets — Doctor Who · How I Met Your Mother"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/tv2.png"
            alt="Box sets: Doctor Who and How I Met Your Mother"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.35))" }}
            draggable={false}
          />
        </div>

        {/* Brass gallery rail across the top shelf — sits in front of the box sets */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/top boarder.png"
          alt=""
          aria-hidden
          style={{ position: "absolute", left: "11%", top: "24.5%", width: "12.4%", height: "auto", zIndex: 3 }}
          draggable={false}
        />

        {/* Left door — middle shelf: books */}
        <div
          className="group"
          style={{ position: "absolute", left: "14.9%", top: "29.8%", width: "9.4%", zIndex: 2 }}
          title="The 10th Kingdom · Are You Afraid of the Dark?"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/tv show.png"
            alt="Books: The 10th Kingdom and Are You Afraid of the Dark?"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.35))" }}
            draggable={false}
          />
        </div>

        {/* Brass gallery rail across the middle shelf — sits in front of the cassettes */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/items/top boarder.png"
          alt=""
          aria-hidden
          style={{ position: "absolute", left: "11%", top: "46.5%", width: "12.4%", height: "auto", zIndex: 3 }}
          draggable={false}
        />

        {/* Right door — bottom shelf: books */}
        <div
          className="group"
          style={{ position: "absolute", left: "75.5%", top: "69%", width: "11.4%", zIndex: 2 }}
          title="Animal Farm · The Little Prince"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/items/books_.png"
            alt="Books: Animal Farm and The Little Prince"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.35))" }}
            draggable={false}
          />
        </div>

        {/* Right-centre rail: the bicycle — needs a transparent cutout at
            /items/bike_hang.png (position already dialled in). Enable when ready.
        <div
          className="group"
          style={{ position: "absolute", left: "57%", top: "16.5%", width: "12.5%", zIndex: 2 }}
          title="Field kit — the bicycle"
        >
          <img
            src="/items/bike_hang.png"
            alt="A bicycle hung on the rail"
            className="w-full h-auto transition-transform duration-300 group-hover:-translate-y-1"
            style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.4))" }}
            draggable={false}
          />
        </div>
        */}

        {/* Central niche — editions with a generated clip play their video
            sequence (opaque, dropped onto the niche 1:1); others show the cutout. */}
        {hasNicheClip(edition.key) ? (
          <NicheDoll edition={edition.key} />
        ) : (
          <div
            className="group"
            style={{ position: "absolute", left: "49.4%", bottom: "20%", height: "58%", transform: "translateX(-50%)", zIndex: 2 }}
          >
            {dollVideo && !videoFailed ? (
              <video
                key={dollVideo}
                src={dollVideo}
                autoPlay muted loop playsInline
                onError={() => setVideoFailed(true)}
                poster={`/dolls/cut/${edition.key}.png`}
                className="h-full w-auto transition-transform duration-500 group-hover:-translate-y-2"
                style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/dolls/cut/${edition.key}.png`}
                alt={edition.label}
                className="h-full w-auto transition-transform duration-500 group-hover:-translate-y-2"
                style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}
                draggable={false}
              />
            )}
          </div>
        )}

        {/* First-visit opening sequence — opens the case in place, doors
            swing apart to reveal the doll in the niche underneath.
            HIDDEN for now per Kate — re-enable when the concept is reworked. */}
        {/* <IntroOverlay /> */}
      </div>

        {/* Clock to the right of the box (wide screens only) */}
        <div
          className="hidden xl:block"
          style={{ position: "absolute", top: "50%", left: "calc(50% + min(44vw, 430px) + 28px)", transform: "translateY(-50%)" }}
        >
          {clockPanel}
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

      {/* Clock below the box on smaller screens */}
      <div className="xl:hidden">
        {clockPanel}
      </div>
    </main>
  );
}
