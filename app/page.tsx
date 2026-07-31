"use client";

import { useState, useEffect } from "react";
import EditionClock from "@/components/EditionClock";
import { useTime } from "@/components/TimeProvider";
import { EDITIONS, editionForHour } from "@/lib/time";

const mono = "var(--font-mono), ui-monospace, monospace";

// Intro clip (transparent WebM). Drop the file here; until it exists the
// <video> errors and hides gracefully, leaving the static suitcase.
const INTRO_SRC = "/suitcase/intro.webm";

// Animated (transparent WebM) doll per edition; falls back to the static cutout.
// office video disabled for now — it shows the old (pre-v2) doll; regenerate from the v2 cut later.
const EDITION_VIDEO: Record<string, string> = {};

export default function Home() {
  const { hour, setHour, setNow } = useTime();
  const edition = hour === null ? EDITIONS.office : editionForHour(hour);
  const [videoFailed, setVideoFailed] = useState(false);
  const dollVideo = EDITION_VIDEO[edition.key];

  // Play the opening clip once per visitor (localStorage-gated)
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem("introSeen")) setShowIntro(true); } catch {}
  }, []);
  const endIntro = () => {
    setShowIntro(false);
    try { localStorage.setItem("introSeen", "1"); } catch {}
  };

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
        <img src="/suitcase/open.png" alt="Kate's collector suitcase" className="absolute inset-0 w-full h-full object-contain" style={{ zIndex: 1 }} draggable={false} />

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

        {/* Left door — top shelf: TV box sets */}
        <div
          className="group"
          style={{ position: "absolute", left: "10.5%", top: "12.6%", width: "13%", zIndex: 2 }}
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
          style={{ position: "absolute", left: "8.7%", top: "21.5%", width: "16.5%", height: "auto", zIndex: 3 }}
          draggable={false}
        />

        {/* Left door — middle shelf: books */}
        <div
          className="group"
          style={{ position: "absolute", left: "11.3%", top: "34.5%", width: "11.4%", zIndex: 2 }}
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
          style={{ position: "absolute", left: "8.7%", top: "43.5%", width: "16.5%", height: "auto", zIndex: 3 }}
          draggable={false}
        />

        {/* Right door — bottom shelf: books */}
        <div
          className="group"
          style={{ position: "absolute", left: "75.5%", top: "67.5%", width: "11.4%", zIndex: 2 }}
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

        {/* Doll in the central niche */}
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

        {/* Intro clip – plays once, then reveals the static suitcase */}
        {showIntro && (
          <video
            src={INTRO_SRC}
            autoPlay
            muted
            playsInline
            onEnded={endIntro}
            onError={endIntro}
            className="absolute inset-0 w-full h-full object-contain z-20"
            style={{ pointerEvents: "none" }}
          />
        )}
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
