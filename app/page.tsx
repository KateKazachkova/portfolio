"use client";

import { useRef, useState } from "react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
    videoRef.current?.play();
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-8">
      <div className="flex flex-col items-center gap-12">

        {/* Box */}
        <div
          className="relative cursor-pointer select-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ width: 340, fontFamily: "sans-serif" }}
        >
          {/* Outer box frame */}
          <div
            className="relative border-4 border-black bg-[#f5f0e8]"
            style={{
              boxShadow: "6px 6px 0px #000",
            }}
          >
            {/* Top label */}
            <div className="bg-black text-[#f5e642] px-4 py-2 flex items-center justify-between">
              <span style={{
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}>
                ✦ Limited Edition ✦
              </span>
              <span style={{
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "#f5e642",
              }}>
                №001
              </span>
            </div>

            {/* Title */}
            <div className="px-4 pt-3 pb-1">
              <div style={{
                fontWeight: 900,
                fontSize: 28,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: "#000",
              }}>
                KATE
              </div>
              <div style={{
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#000",
                marginTop: 2,
              }}>
                UX / UI Designer Doll™
              </div>
            </div>

            {/* Video window */}
            <div className="mx-4 mb-0 border-2 border-black overflow-hidden bg-[#d9d4c8]"
              style={{ height: 380, position: "relative" }}
            >
              <video
                ref={videoRef}
                src="/doll.mp4"
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                style={{
                  transition: "transform 0.4s ease",
                  transform: hovered ? "scale(1.04)" : "scale(1)",
                }}
              />
              {/* Star stickers */}
              <div style={{
                position: "absolute", top: 8, right: 8,
                background: "#e8212e", color: "#fff",
                fontWeight: 900, fontSize: 10,
                letterSpacing: "0.05em",
                padding: "4px 8px",
                border: "2px solid #000",
                textTransform: "uppercase",
              }}>
                NEW!
              </div>
              <div style={{
                position: "absolute", bottom: 8, left: 8,
                background: "#f5e642", color: "#000",
                fontWeight: 900, fontSize: 9,
                letterSpacing: "0.05em",
                padding: "3px 7px",
                border: "2px solid #000",
                textTransform: "uppercase",
              }}>
                {hovered ? "▶ Playing" : "Hover to play"}
              </div>
            </div>

            {/* Specs */}
            <div className="px-4 py-3 border-t-2 border-black bg-[#f5e642]">
              <div className="flex gap-4 flex-wrap">
                {["UX Research", "UI Design", "Figma", "Prototyping"].map((skill) => (
                  <span key={skill} style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#000",
                  }}>
                    ✦ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="bg-black px-4 py-2 flex items-center justify-between">
              <span style={{
                color: "#f5f0e8",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                uxuikazachkova.xyz
              </span>
              <span style={{ color: "#f5e642", fontWeight: 900, fontSize: 10 }}>
                ★★★★★
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p style={{
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#000",
            fontWeight: 700,
          }}>
            Available for hire · Open to relocation
          </p>
        </div>

      </div>
    </main>
  );
}
