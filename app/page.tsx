"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const W = 280; // width
const H = 400; // height
const D = 160; // depth

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const autoAngle = useRef(25);

  const [rot, setRot] = useState({ x: -15, y: 25 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const animate = () => {
      if (!isDragging.current) {
        autoAngle.current += 0.12;
        setRot((r) => ({ ...r, y: autoAngle.current }));
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    autoAngle.current += dx * 0.5;
    setRot((r) => ({ x: Math.max(-60, Math.min(60, r.x - dy * 0.5)), y: r.y + dx * 0.5 }));
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  return (
    <main
      className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center gap-6 select-none"
      style={{ cursor: isDragging.current ? "grabbing" : "default" }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Viewport */}
      <div
        style={{ width: W, height: H, perspective: 1000, cursor: "grab" }}
        onMouseDown={onMouseDown}
      >
        {/* Box container */}
        <div style={{
          width: W, height: H,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        }}>

          {/* FRONT — W × H, translateZ(+D/2) */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: W, height: H,
            transform: `translateZ(${D / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#f5f0e8",
            border: "3px solid #000",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{ background: "#000", color: "#f5e642", padding: "5px 12px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 900, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" }}>✦ Limited Edition ✦</span>
              <span style={{ fontWeight: 900, fontSize: 9 }}>№001</span>
            </div>
            <div style={{ padding: "8px 12px 4px" }}>
              <div style={{ fontWeight: 900, fontSize: 24, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.02em" }}>KATE</div>
              <div style={{ fontWeight: 800, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>UX / UI Designer Doll™</div>
            </div>
            <div
              style={{ margin: "0 12px", flex: 1, border: "2px solid #000", overflow: "hidden", background: "#d9d4c8", position: "relative" }}
              onMouseEnter={() => { setHovering(true); videoRef.current?.play(); }}
              onMouseLeave={() => { setHovering(false); if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
            >
              <video ref={videoRef} src="/doll.mp4" muted loop playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", transform: hovering ? "scale(1.05)" : "scale(1)" }}
              />
              <div style={{ position: "absolute", top: 6, right: 6, background: "#e8212e", color: "#fff", fontWeight: 900, fontSize: 9, padding: "3px 7px", border: "2px solid #000", textTransform: "uppercase" }}>NEW!</div>
            </div>
            <div style={{ background: "#f5e642", borderTop: "2px solid #000", padding: "5px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["UX Research", "UI Design", "Figma"].map(s => (
                <span key={s} style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>✦ {s}</span>
              ))}
            </div>
            <div style={{ background: "#000", padding: "5px 12px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#f5f0e8", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>uxuikazachkova.xyz</span>
              <span style={{ color: "#f5e642", fontSize: 10 }}>★★★★★</span>
            </div>
          </div>

          {/* BACK — rotateY(180deg) translateZ(+D/2) */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: W, height: H,
            transform: `rotateY(180deg) translateZ(${D / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#f5e642", border: "3px solid #000",
            padding: 20, display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ fontWeight: 900, fontSize: 16, textTransform: "uppercase", letterSpacing: "-0.01em" }}>WHAT'S IN THE BOX</div>
            {[
              "5+ years of product design",
              "Speaks fluent Figma",
              "Ships on time",
              "Survives stakeholder reviews",
              "Batteries not included",
            ].map(t => (
              <div key={t} style={{ fontSize: 11, fontWeight: 700 }}>✦ {t}</div>
            ))}
            <div style={{ marginTop: "auto", fontSize: 9, fontWeight: 700, color: "#555", lineHeight: 1.6 }}>
              WARNING: May cause sudden redesigns.<br />
              © 2025 Kate Kazachkova™
            </div>
          </div>

          {/* RIGHT — rotateY(90deg) translateZ(W/2), size D × H, offset left: (W−D)/2 */}
          <div style={{
            position: "absolute", top: 0, left: (W - D) / 2,
            width: D, height: H,
            transform: `rotateY(90deg) translateZ(${W / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#000", border: "3px solid #000",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#f5e642", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
              Kate Kazachkova · Product Designer · 2025
            </span>
          </div>

          {/* LEFT — rotateY(-90deg) translateZ(W/2), offset left: (W−D)/2 */}
          <div style={{
            position: "absolute", top: 0, left: (W - D) / 2,
            width: D, height: H,
            transform: `rotateY(-90deg) translateZ(${W / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#e8212e", border: "3px solid #000",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl" }}>
              ✦ Open to hire ✦ Kyiv · Canada ✦
            </span>
          </div>

          {/* TOP — rotateX(-90deg) translateZ(H/2), size W × D, offset top: (H−D)/2 */}
          <div style={{
            position: "absolute", top: (H - D) / 2, left: 0,
            width: W, height: D,
            transform: `rotateX(-90deg) translateZ(${H / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#f5f0e8", border: "3px solid #000",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontWeight: 900, fontSize: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>KATE™</span>
          </div>

          {/* BOTTOM — rotateX(90deg) translateZ(H/2), offset top: (H−D)/2 */}
          <div style={{
            position: "absolute", top: (H - D) / 2, left: 0,
            width: W, height: D,
            transform: `rotateX(90deg) translateZ(${H / 2}px)`,
            backfaceVisibility: "hidden",
            background: "#000", border: "3px solid #000",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#f5e642", fontWeight: 700, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>uxuikazachkova.xyz</span>
          </div>

        </div>
      </div>

      <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#aaa" }}>
        drag to rotate
      </p>
    </main>
  );
}
