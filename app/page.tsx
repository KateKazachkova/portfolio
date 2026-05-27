"use client";

import { useRef, useState, useCallback } from "react";

const W = 360;
const H = 520;
const D = 140;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const [rot, setRot] = useState({ x: -12, y: 22 });

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

  return (
    <main
      className="min-h-screen bg-[#f0ebe0] flex flex-col items-center justify-center gap-6 select-none"
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
            background: "#fdf6ee",
            border: "3px solid #111",
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
                  Product Designer
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#f5e642", fontSize: 9, fontWeight: 900, letterSpacing: "0.1em" }}>№001</div>
                <div style={{ background: "#e8212e", color: "#fff", fontSize: 9, fontWeight: 900, padding: "2px 6px", marginTop: 3, textTransform: "uppercase" }}>NEW!</div>
              </div>
            </div>

            {/* Inner box — doll + space for items */}
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
              position: "relative",
              background: "#f0e8d8",
              borderTop: "2px solid #111",
            }}>
              {/* Left space — future items */}
              <div style={{
                width: 80, height: "100%", flexShrink: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-start",
                paddingTop: 16, gap: 12,
              }}>
                {/* Placeholder spots */}
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 52, height: 52,
                    border: "1.5px dashed #bbb",
                    borderRadius: 4,
                  }} />
                ))}
              </div>

              {/* Doll — center, full height */}
              <div style={{ flex: 1, height: "100%", position: "relative", overflow: "hidden" }}>
                <video
                  ref={videoRef}
                  src="/doll.mp4"
                  muted loop playsInline autoPlay
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                  }}
                />
              </div>

              {/* Right space — future items */}
              <div style={{
                width: 80, height: "100%", flexShrink: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-start",
                paddingTop: 16, gap: 12,
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 52, height: 52,
                    border: "1.5px dashed #bbb",
                    borderRadius: 4,
                  }} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              background: "#f5e642",
              borderTop: "2px solid #111",
              padding: "5px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", gap: 10 }}>
                {["UX", "UI", "Figma", "Research"].map(s => (
                  <span key={s} style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>✦ {s}</span>
                ))}
              </div>
              <span style={{ fontSize: 10, fontWeight: 900 }}>★★★★★</span>
            </div>
            <div style={{ background: "#111", padding: "4px 16px" }}>
              <span style={{ color: "#f5f0e8", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                uxuikazachkova.xyz
              </span>
            </div>
          </div>

          {/* ── BACK ── */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: W, height: H,
            transform: `rotateY(180deg) translateZ(${D / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#f5e642", border: "3px solid #111",
            padding: 24, display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ fontWeight: 900, fontSize: 18, textTransform: "uppercase" }}>WHAT'S IN THE BOX</div>
            {["5+ years of product design", "Speaks fluent Figma", "Ships on time", "Survives stakeholder reviews", "Batteries not included"].map(t => (
              <div key={t} style={{ fontSize: 12, fontWeight: 700 }}>✦ {t}</div>
            ))}
            <div style={{ marginTop: "auto", fontSize: 9, fontWeight: 700, color: "#666", lineHeight: 1.7 }}>
              WARNING: May cause sudden redesigns.<br />
              © 2025 Kate Kazachkova™ All rights reserved.
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{
            position: "absolute", top: 0, left: (W - D) / 2,
            width: D, height: H,
            transform: `rotateY(90deg) translateZ(${W / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#111", border: "3px solid #111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#f5e642", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
              Kate Kazachkova · Product Designer · 2025
            </span>
          </div>

          {/* ── LEFT ── */}
          <div style={{
            position: "absolute", top: 0, left: (W - D) / 2,
            width: D, height: H,
            transform: `rotateY(-90deg) translateZ(${W / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#e8212e", border: "3px solid #111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl" }}>
              ✦ Open to hire · Kyiv · Canada ✦
            </span>
          </div>

          {/* ── TOP ── */}
          <div style={{
            position: "absolute", top: (H - D) / 2, left: 0,
            width: W, height: D,
            transform: `rotateX(-90deg) translateZ(${H / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#fdf6ee", border: "3px solid #111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontWeight: 900, fontSize: 22, textTransform: "uppercase", letterSpacing: "0.08em" }}>KATE™</span>
          </div>

          {/* ── BOTTOM ── */}
          <div style={{
            position: "absolute", top: (H - D) / 2, left: 0,
            width: W, height: D,
            transform: `rotateX(90deg) translateZ(${H / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#111", border: "3px solid #111",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#f5e642", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>uxuikazachkova.xyz</span>
          </div>

        </div>
      </div>

      <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#bbb" }}>
        drag to rotate
      </p>
    </main>
  );
}
