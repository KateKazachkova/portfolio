"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import EditionClock from "@/components/EditionClock";

const W = 360;
const H = 520;
const D = 140;

type Edition = {
  key: string;
  label: string;
  slogan: string | null;
  range: string;
  image: string | null;
  items: string[];
};

const EDITIONS: Record<string, Edition> = {
  morning: {
    key: "morning", label: "Morning Edition", slogan: "Loading… Please Wait", range: "07–09",
    image: "/dolls/morning.png",
    items: ["Mushroom mug", "Blue cardigan", "Stitch pyjamas", "“I need coffee”"],
  },
  office: {
    key: "office", label: "Day Edition", slogan: "The Investigator", range: "09–17",
    image: "/dolls/office.png",
    items: ["Polaroid camera", "Notebook", "VHS cassette", "Case folder"],
  },
  street: {
    key: "street", label: "Street Edition", slogan: "Urban Explorer", range: "17–19",
    image: "/dolls/street.png",
    items: ["Flashlight", "Old map", "Compass", "Vintage key"],
  },
  evening: {
    key: "evening", label: "Evening Edition", slogan: null, range: "19–23",
    image: "/dolls/evening.png",
    items: [],
  },
  night: {
    key: "night", label: "Deep Night Edition", slogan: "Archive Mode", range: "23–07",
    image: null,
    items: ["Fluffy blanket", "Harari books", "Film negatives"],
  },
};

function editionForHour(h: number): Edition {
  if (h >= 7 && h < 9) return EDITIONS.morning;
  if (h >= 9 && h < 17) return EDITIONS.office;
  if (h >= 17 && h < 19) return EDITIONS.street;
  if (h >= 19 && h < 23) return EDITIONS.evening;
  return EDITIONS.night; // 23–07
}

export default function Home() {
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const [rot, setRot] = useState({ x: -12, y: 22 });
  const [hour, setHour] = useState<number | null>(null);

  // Default to the visitor's local time (client only → no hydration mismatch)
  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const setNow = useCallback(() => setHour(new Date().getHours()), []);
  const edition = hour === null ? null : editionForHour(hour);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setRot((r) => ({
      x: Math.max(-60, Math.min(60, r.x - dy * 0.4)),
      y: r.y + dx * 0.5,
    }));
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const items = edition?.items ?? [];
  const leftItems = items.filter((_, i) => i % 2 === 0);
  const rightItems = items.filter((_, i) => i % 2 === 1);
  const mono = "var(--font-mono), ui-monospace, monospace";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 select-none py-16"
      style={{ background: "var(--bg)" }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        style={{ width: W, height: H, perspective: 1100, cursor: "grab" }}
        onMouseDown={onMouseDown}
      >
        <div style={{
          width: W, height: H,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        }}>

          {/* ── FRONT ── */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: W, height: H,
            transform: `translateZ(${D / 2}px)`,
            backfaceVisibility: "hidden",
            background: "var(--panel)",
            border: "3px solid var(--border)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              background: "#111",
              padding: "10px 16px",
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ color: "#f5e642", fontWeight: 900, fontSize: 28, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                  KATE
                </div>
                <div style={{ color: "#f5e642", fontWeight: 700, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 2 }}>
                  Collector Edition
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#f5e642", fontSize: 9, fontWeight: 900, letterSpacing: "0.1em" }}>№001</div>
                <div style={{ background: "#e8212e", color: "#fff", fontSize: 8, fontWeight: 900, padding: "2px 6px", marginTop: 3, textTransform: "uppercase", fontFamily: mono, letterSpacing: "0.05em" }}>
                  {edition ? edition.range : "· ·"}
                </div>
              </div>
            </div>

            {/* Inner box — doll + accessories */}
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "stretch",
              position: "relative",
              background: "var(--inner)",
              borderTop: "2px solid var(--border)",
            }}>
              {/* Left accessories */}
              {leftItems.length > 0 && (
                <div style={{ width: 74, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, gap: 10 }}>
                  {leftItems.map((it) => <Slot key={it} label={it} mono={mono} />)}
                </div>
              )}

              {/* Doll */}
              <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden" }}>
                {edition?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={edition.image} alt={edition.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "14% 12%" }} />
                ) : edition?.key === "night" ? (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#14161a", color: "#c9c2b4" }}>
                    <span style={{ fontSize: 30 }}>☾</span>
                    <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>Archive Mode</span>
                    <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.12em", color: "#6b645c" }}>image coming soon</span>
                  </div>
                ) : (
                  // pre-mount fallback
                  <video src="/doll.mp4" muted loop playsInline autoPlay
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                )}
                {/* Night theme darkening */}
                <div style={{ position: "absolute", inset: 0, background: "#0f0b08", opacity: "var(--night)", mixBlendMode: "multiply", pointerEvents: "none", transition: "opacity 0.3s ease" }} />
              </div>

              {/* Right accessories */}
              {rightItems.length > 0 && (
                <div style={{ width: 74, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 14, gap: 10 }}>
                  {rightItems.map((it) => <Slot key={it} label={it} mono={mono} />)}
                </div>
              )}
            </div>

            {/* Edition strip */}
            <div style={{ background: "#f5e642", borderTop: "2px solid #111", padding: "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {edition ? edition.label : "Collector Edition"}
              </span>
              {edition?.slogan && (
                <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>“{edition.slogan}”</span>
              )}
            </div>
            <div style={{ background: "#111", padding: "4px 16px" }}>
              <span style={{ color: "#f5f0e8", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>uxuikazachkova.xyz</span>
            </div>
          </div>

          {/* ── BACK ── */}
          <div style={{
            position: "absolute", top: 0, left: 0, width: W, height: H,
            transform: `rotateY(180deg) translateZ(${D / 2}px)`,
            backfaceVisibility: "hidden", background: "#f5e642", border: "3px solid #111",
            padding: 24, display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ fontWeight: 900, fontSize: 18, textTransform: "uppercase" }}>WHAT'S IN THE BOX</div>
            {["A designer who turns chaos into systems", "Speaks fluent Figma", "Ships on time", "Survives stakeholder reviews", "Batteries not included"].map(t => (
              <div key={t} style={{ fontSize: 12, fontWeight: 700 }}>✦ {t}</div>
            ))}
            <div style={{ marginTop: "auto", fontSize: 9, fontWeight: 700, color: "#666", lineHeight: 1.7 }}>
              WARNING: May cause sudden redesigns.<br />
              © 2026 Kate Kazachkova™ All rights reserved.
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{
            position: "absolute", top: 0, left: (W - D) / 2, width: D, height: H,
            transform: `rotateY(90deg) translateZ(${W / 2}px)`,
            backfaceVisibility: "hidden", background: "#111", border: "3px solid #111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#f5e642", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
              Kate Kazachkova · Collector Edition · 2026
            </span>
          </div>

          {/* ── LEFT ── */}
          <div style={{
            position: "absolute", top: 0, left: (W - D) / 2, width: D, height: H,
            transform: `rotateY(-90deg) translateZ(${W / 2}px)`,
            backfaceVisibility: "hidden", background: "#e8212e", border: "3px solid #111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl" }}>
              ✦ Morning · Day · Evening · Deep Night ✦
            </span>
          </div>

          {/* ── TOP ── */}
          <div style={{
            position: "absolute", top: (H - D) / 2, left: 0, width: W, height: D,
            transform: `rotateX(-90deg) translateZ(${H / 2}px)`,
            backfaceVisibility: "hidden", background: "#fdf6ee", border: "3px solid #111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontWeight: 900, fontSize: 22, textTransform: "uppercase", letterSpacing: "0.08em" }}>KATE™</span>
          </div>

          {/* ── BOTTOM ── */}
          <div style={{
            position: "absolute", top: (H - D) / 2, left: 0, width: W, height: D,
            transform: `rotateX(90deg) translateZ(${H / 2}px)`,
            backfaceVisibility: "hidden", background: "#111", border: "3px solid #111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#f5e642", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>uxuikazachkova.xyz</span>
          </div>

        </div>
      </div>

      {/* Caption */}
      <div className="text-center">
        {edition && (
          <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em" }} className="text-gray-400 uppercase mb-1">
            {edition.label}{edition.slogan ? ` · “${edition.slogan}”` : ""}
          </p>
        )}
        <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "var(--muted)" }}>
          drag box to rotate
        </p>
      </div>

      {/* Manual clock */}
      <div className="mt-4">
        <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em" }} className="text-gray-400 uppercase text-center mb-3">
          Set the time {hour !== null ? `· ${String(hour).padStart(2, "0")}:00` : ""}
        </p>
        <EditionClock hour={hour ?? 12} onChange={setHour} onNow={setNow} />
      </div>
    </main>
  );
}

function Slot({ label, mono }: { label: string; mono: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: 66 }}>
      <div style={{ width: 46, height: 46, border: "1.5px solid var(--border)", background: "var(--panel)", borderRadius: 3 }} />
      <span style={{ fontFamily: mono, fontSize: 7, letterSpacing: "0.04em", textTransform: "uppercase", textAlign: "center", color: "var(--muted)", lineHeight: 1.2 }}>
        {label}
      </span>
    </div>
  );
}
