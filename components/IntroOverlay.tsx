"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * First-visit opening sequence (once per visitor, localStorage-gated).
 *
 * Renders INSIDE the hero suitcase container (absolute, inset 0), so the case
 * opens exactly where it lives on the page. A warm-paper fill hides the live
 * open suitcase; the closed case (close.png, split down its centre seam into
 * two leather doors) fades in; a brass key slides into the lock and turns 90°
 * with a click + glint; then the two doors swing open in 3D, the fill fades,
 * and the live open suitcase + doll in the niche are revealed underneath.
 * Skippable (click / any key), reduced-motion aware.
 */

type Phase = "enter" | "key" | "turn" | "open" | "done";

// Keyhole centre on close.png sits on the seam (measured x≈52.5%, y≈53.1%).
// The case is centred in the container, so the seam is at 50% horizontally.
const KEY_Y = "53%";

export default function IntroOverlay() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("enter");

  const finish = useCallback(() => {
    try {
      localStorage.setItem("introSeenV2", "1");
    } catch {}
    setActive(false);
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem("introSeenV2");
    } catch {}
    if (seen) return;

    setActive(true);

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const t = setTimeout(finish, 450);
      return () => clearTimeout(t);
    }

    const timers = [
      setTimeout(() => setPhase("key"), 750),
      setTimeout(() => setPhase("turn"), 1600),
      setTimeout(() => setPhase("open"), 2400),
      setTimeout(() => setPhase("done"), 3250),
      setTimeout(finish, 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  const skip = useCallback(() => {
    setPhase("done");
    const t = setTimeout(finish, 550);
    return () => clearTimeout(t);
  }, [finish]);

  useEffect(() => {
    if (!active) return;
    const onKey = () => skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, skip]);

  if (!active) return null;

  const fadingOut = phase === "done";
  const opening = phase === "open" || phase === "done";

  // Key transform (pivot at the keyhole on the seam via transform-origin).
  const keyHidden = phase === "enter";
  const turned = phase === "turn" || opening;
  const keyTransform = keyHidden
    ? "translate(34px, -50%) rotate(-6deg) scale(0.94)"
    : turned
    ? "translate(0, -50%) rotate(88deg)"
    : "translate(0, -50%) rotate(0deg)";
  const keyOpacity = keyHidden ? 0 : opening ? 0 : 1;

  // Doors swing open around their outer edges once we hit "open".
  const leftDoorTf = opening
    ? "perspective(1600px) rotateY(-118deg)"
    : "perspective(1600px) rotateY(0deg)";
  const rightDoorTf = opening
    ? "perspective(1600px) rotateY(118deg)"
    : "perspective(1600px) rotateY(0deg)";

  return (
    <div
      className="intro-inplace"
      onClick={skip}
      role="button"
      aria-label="Skip intro"
      tabIndex={0}
      style={{ opacity: fadingOut ? 0 : 1 }}
    >
      {/* Warm-paper fill hides the live open case until the doors part */}
      <div
        className="intro-fill"
        aria-hidden
        style={{ opacity: opening ? 0 : 1 }}
      />

      {/* The closed case = two leather doors that swing open */}
      <div className={`intro-doors${phase === "turn" ? " shaking" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/suitcase/door_left.png"
          alt="Kate's collector suitcase, closed"
          className="intro-door intro-door-left"
          draggable={false}
          style={{ transform: leftDoorTf, opacity: fadingOut ? 0 : 1 }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/suitcase/door_right.png"
          alt=""
          aria-hidden
          className="intro-door intro-door-right"
          draggable={false}
          style={{ transform: rightDoorTf, opacity: fadingOut ? 0 : 1 }}
        />

        {/* Brass key — pivots around the keyhole on the seam */}
        <div
          className="intro-key"
          aria-hidden
          style={{ transform: keyTransform, opacity: keyOpacity }}
        >
          <svg viewBox="0 0 240 80" width="100%" height="100%">
            <defs>
              <linearGradient id="introBrass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f4e2a6" />
                <stop offset="0.35" stopColor="#d8b45e" />
                <stop offset="0.5" stopColor="#c9a24a" />
                <stop offset="0.75" stopColor="#9a7830" />
                <stop offset="1" stopColor="#7a5d24" />
              </linearGradient>
            </defs>
            <rect x="26" y="34" width="150" height="12" rx="6" fill="url(#introBrass)" />
            <rect x="26" y="46" width="10" height="18" rx="2" fill="url(#introBrass)" />
            <rect x="44" y="46" width="8" height="12" rx="2" fill="url(#introBrass)" />
            <rect x="168" y="30" width="8" height="20" rx="3" fill="url(#introBrass)" />
            <circle cx="204" cy="40" r="30" fill="url(#introBrass)" />
            <circle cx="204" cy="40" r="13" fill="none" stroke="#6b501f" strokeWidth="5" />
            <rect x="30" y="35" width="140" height="3" rx="1.5" fill="#fff3cf" opacity="0.55" />
          </svg>
        </div>

        {/* Glint on the lock during the turn */}
        <div className={`intro-glint${phase === "turn" || opening ? " on" : ""}`} aria-hidden />
      </div>

      <style jsx>{`
        .intro-inplace {
          position: absolute;
          inset: 0;
          z-index: 20;
          transition: opacity 0.6s ease;
          cursor: pointer;
        }
        .intro-fill {
          position: absolute;
          inset: -6% -4%;
          background: var(--bg);
          transition: opacity 0.6s ease 0.15s;
        }
        .intro-doors {
          position: absolute;
          inset: 0;
          animation: caseIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-style: preserve-3d;
        }
        .intro-doors.shaking {
          animation: caseIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both,
            clickShake 0.34s ease-in-out;
        }
        .intro-door {
          position: absolute;
          top: 4%;
          height: 92%;
          width: auto;
          filter: drop-shadow(0 20px 34px rgba(0, 0, 0, 0.32));
          backface-visibility: hidden;
          transition: transform 0.85s cubic-bezier(0.5, 0, 0.2, 1),
            opacity 0.5s ease;
          will-change: transform;
        }
        .intro-door-left {
          right: 50%;
          transform-origin: left center;
        }
        .intro-door-right {
          left: 50%;
          transform-origin: right center;
        }
        .intro-key {
          position: absolute;
          left: 50%;
          top: ${KEY_Y};
          width: 15%;
          height: auto;
          transform-origin: 0% 50%;
          transition: transform 0.55s cubic-bezier(0.5, 0, 0.2, 1),
            opacity 0.4s ease;
          filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.45));
          z-index: 5;
          will-change: transform;
        }
        .intro-key svg {
          display: block;
        }
        .intro-glint {
          position: absolute;
          left: 50%;
          top: ${KEY_Y};
          width: 9%;
          height: 6%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 244, 214, 0.9),
            rgba(255, 244, 214, 0) 65%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 4;
        }
        .intro-glint.on {
          opacity: 1;
        }
        @keyframes caseIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes clickShake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-3px);
          }
          45% {
            transform: translateX(3px);
          }
          70% {
            transform: translateX(-2px);
          }
          88% {
            transform: translateX(1px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .intro-doors,
          .intro-door,
          .intro-key,
          .intro-fill {
            animation: none !important;
            transition: opacity 0.3s ease !important;
          }
        }
      `}</style>
    </div>
  );
}
