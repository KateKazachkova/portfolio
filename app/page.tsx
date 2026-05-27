"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const W = 280;
const H = 400;
const D = 160;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const [rot, setRot] = useState({ x: -15, y: 25 });
  const [isHoveringFront, setIsHoveringFront] = useState(false);

  // Auto-rotate when idle
  const autoRotate = useRef(true);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let angle = 25;
    const animate = () => {
      if (autoRotate.current && !isDragging.current) {
        angle += 0.15;
        setRot((r) => ({ ...r, y: angle }));
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current!);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    autoRotate.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setRot((r) => ({ x: r.x - dy * 0.5, y: r.y + dx * 0.5 }));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    autoRotate.current = false;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - lastMouse.current.x;
    const dy = e.touches[0].clientY - lastMouse.current.y;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setRot((r) => ({ x: r.x - dy * 0.5, y: r.y + dx * 0.5 }));
  }, []);

  return (
    <main
      className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center gap-8 select-none overflow-hidden"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Scene */}
      <div
        style={{ width: W, height: H, perspective: 900, cursor: isDragging.current ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { isDragging.current = false; }}
      >
        {/* Box */}
        <div
          ref={containerRef}
          style={{
            width: W,
            height: H,
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
            transition: isDragging.current ? "none" : "transform 0.05s linear",
          }}
        >
          {/* FRONT */}
          <Face
            style={{
              width: W,
              height: H,
              transform: `translateZ(${D / 2}px)`,
              background: "#f5f0e8",
              border: "3px solid #000",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Top bar */}
            <div style={{ background: "#000", color: "#f5e642", padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 900, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>✦ Limited Edition ✦</span>
              <span style={{ fontWeight: 900, fontSize: 10, color: "#f5e642" }}>№001</span>
            </div>
            {/* Title */}
            <div style={{ padding: "8px 12px 4px" }}>
              <div style={{ fontWeight: 900, fontSize: 26, lineHeight: 1, textTransform: "uppercase", letterSpacing: "-0.02em" }}>KATE</div>
              <div style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>UX / UI Designer Doll™</div>
            </div>
            {/* Video window */}
            <div
              style={{ margin: "0 12px", flex: 1, border: "2px solid #000", overflow: "hidden", background: "#d9d4c8", position: "relative" }}
              onMouseEnter={() => { setIsHoveringFront(true); videoRef.current?.play(); }}
              onMouseLeave={() => { setIsHoveringFront(false); if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
            >
              <video
                ref={videoRef}
                src="/doll.mp4"
                muted loop playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", transform: isHoveringFront ? "scale(1.04)" : "scale(1)" }}
              />
              <div style={{ position: "absolute", top: 6, right: 6, background: "#e8212e", color: "#fff", fontWeight: 900, fontSize: 9, padding: "3px 7px", border: "2px solid #000", textTransform: "uppercase" }}>NEW!</div>
            </div>
            {/* Skills bar */}
            <div style={{ background: "#f5e642", borderTop: "2px solid #000", padding: "6px 12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {["UX Research", "UI Design", "Figma"].map(s => (
                <span key={s} style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>✦ {s}</span>
              ))}
            </div>
            {/* Bottom bar */}
            <div style={{ background: "#000", padding: "5px 12px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#f5f0e8", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>uxuikazachkova.xyz</span>
              <span style={{ color: "#f5e642", fontSize: 10, fontWeight: 900 }}>★★★★★</span>
            </div>
          </Face>

          {/* BACK */}
          <Face style={{ width: W, height: H, transform: `rotateY(180deg) translateZ(${D / 2}px)`, background: "#f5e642", border: "3px solid #000", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 18, textTransform: "uppercase", letterSpacing: "-0.01em" }}>WHAT'S IN THE BOX</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["✦", "5+ years of product design"],
                ["✦", "Speaks fluent Figma"],
                ["✦", "Ships on time"],
                ["✦", "Survives stakeholder reviews"],
                ["✦", "Batteries not included"],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", gap: 8, fontSize: 11, fontWeight: 700 }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "#555", lineHeight: 1.6 }}>
              WARNING: May cause sudden redesigns.<br />
              Not suitable for low-fidelity thinkers.<br />
              © 2025 Kate Kazachkova™ All rights reserved.
            </div>
          </Face>

          {/* RIGHT */}
          <Face style={{ width: D, height: H, transform: `rotateY(90deg) translateZ(${W / 2}px)`, background: "#000", border: "3px solid #000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ color: "#f5e642", fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.2em", writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}>
              Kate Kazachkova · Product Designer · 2025
            </div>
          </Face>

          {/* LEFT */}
          <Face style={{ width: D, height: H, transform: `rotateY(-90deg) translateZ(${W / 2}px)`, background: "#e8212e", border: "3px solid #000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.15em", writingMode: "vertical-rl", textOrientation: "mixed" }}>
              ✦ Open to hire ✦ Kyiv · Canada ✦
            </div>
          </Face>

          {/* TOP */}
          <Face style={{ width: W, height: D, transform: `rotateX(90deg) translateZ(${H / 2}px)`, background: "#f5f0e8", border: "3px solid #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 18, textTransform: "uppercase", letterSpacing: "0.1em" }}>KATE™</div>
          </Face>

          {/* BOTTOM */}
          <Face style={{ width: W, height: D, transform: `rotateX(-90deg) translateZ(${H / 2}px)`, background: "#000", border: "3px solid #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "#f5e642", fontWeight: 700, fontSize: 9, letterSpacing: "0.1em", textAlign: "center", textTransform: "uppercase" }}>
              uxuikazachkova.xyz
            </div>
          </Face>
        </div>
      </div>

      {/* Hint */}
      <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#999" }}>
        drag to rotate
      </p>
    </main>
  );
}

function Face({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, backfaceVisibility: "hidden", ...style }}>
      {children}
    </div>
  );
}
