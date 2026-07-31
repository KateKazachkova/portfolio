"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * First-visit opening sequence (once per visitor, localStorage-gated).
 * Closed suitcase fades in → a brass key slides into the lock → turns 90°
 * with a click + glint → warm bloom → the whole overlay fades out, revealing
 * the live open-suitcase hero underneath. Skippable (click / any key).
 */

type Phase = "enter" | "key" | "turn" | "open" | "done";

// Keyhole centre on /suitcase/close.png (template-measured).
const KEY_X = "52.5%";
const KEY_Y = "53.1%";

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
      setTimeout(() => setPhase("key"), 800),
      setTimeout(() => setPhase("turn"), 1650),
      setTimeout(() => setPhase("open"), 2550),
      setTimeout(() => setPhase("done"), 3150),
      setTimeout(finish, 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  const skip = useCallback(() => {
    setPhase("done");
    const t = setTimeout(finish, 500);
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

  // Key transform states (pivot is at the keyhole via transform-origin).
  const keyHidden = phase === "enter";
  const turned = phase === "turn" || opening;
  const keyTransform = keyHidden
    ? "translate(34px, -50%) rotate(-6deg) scale(0.94)"
    : turned
    ? "translate(0, -50%) rotate(88deg)"
    : "translate(0, -50%) rotate(0deg)";
  const keyOpacity = keyHidden ? 0 : opening ? 0 : 1;

  return (
    <div
      className="intro-overlay"
      onClick={skip}
      role="button"
      aria-label="Skip intro"
      tabIndex={0}
      style={{ opacity: fadingOut ? 0 : 1 }}
    >
      <div className="intro-spot" aria-hidden />

      <div className="intro-stage">
        <div className={`intro-shake${phase === "turn" ? " shaking" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/suitcase/close.png"
            alt="Kate's collector suitcase, closed"
            className="intro-case"
            draggable={false}
            style={{
              transform: opening ? "scale(1.06)" : "scale(1)",
              opacity: opening ? 0 : 1,
              filter: opening
                ? "brightness(1.25) drop-shadow(0 24px 40px rgba(0,0,0,0.32))"
                : "drop-shadow(0 24px 40px rgba(0,0,0,0.32))",
            }}
          />

          {/* Brass key — pivots around the keyhole */}
          <div
            className="intro-key"
            aria-hidden
            style={{ transform: keyTransform, opacity: keyOpacity }}
          >
            <svg viewBox="0 0 240 80" width="100%" height="100%">
              <defs>
                <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f4e2a6" />
                  <stop offset="0.35" stopColor="#d8b45e" />
                  <stop offset="0.5" stopColor="#c9a24a" />
                  <stop offset="0.75" stopColor="#9a7830" />
                  <stop offset="1" stopColor="#7a5d24" />
                </linearGradient>
              </defs>
              {/* shaft */}
              <rect x="26" y="34" width="150" height="12" rx="6" fill="url(#brass)" />
              {/* bit / blade teeth (left end goes into the lock) */}
              <rect x="26" y="46" width="10" height="18" rx="2" fill="url(#brass)" />
              <rect x="44" y="46" width="8" height="12" rx="2" fill="url(#brass)" />
              {/* collar */}
              <rect x="168" y="30" width="8" height="20" rx="3" fill="url(#brass)" />
              {/* bow (round handle) */}
              <circle cx="204" cy="40" r="30" fill="url(#brass)" />
              <circle cx="204" cy="40" r="13" fill="none" stroke="#6b501f" strokeWidth="5" />
              {/* highlight */}
              <rect x="30" y="35" width="140" height="3" rx="1.5" fill="#fff3cf" opacity="0.55" />
            </svg>
          </div>

          {/* Glint sweep across the lock during the turn */}
          <div className={`intro-glint${phase === "turn" || opening ? " on" : ""}`} aria-hidden />
        </div>

        {/* Warm bloom on open */}
        <div className={`intro-bloom${opening ? " on" : ""}`} aria-hidden />
      </div>

      <p className="intro-hint" aria-hidden>
        Click to skip
      </p>

      <style jsx>{`
        .intro-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          transition: opacity 0.6s ease;
          cursor: pointer;
          overflow: hidden;
        }
        .intro-spot {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            60% 55% at 50% 46%,
            rgba(216, 53, 42, 0.06),
            rgba(0, 0, 0, 0) 70%
          );
          pointer-events: none;
        }
        .intro-stage {
          position: relative;
          animation: caseIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .intro-shake {
          position: relative;
          display: block;
        }
        .intro-shake.shaking {
          animation: clickShake 0.34s ease-in-out;
        }
        .intro-case {
          display: block;
          height: min(74vh, 480px);
          width: auto;
          transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.55s ease, filter 0.55s ease;
          transform-origin: center 46%;
        }
        .intro-key {
          position: absolute;
          left: ${KEY_X};
          top: ${KEY_Y};
          width: min(20vh, 128px);
          height: auto;
          transform-origin: 0% 50%;
          transition: transform 0.55s cubic-bezier(0.5, 0, 0.2, 1),
            opacity 0.4s ease;
          filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.4));
          will-change: transform;
        }
        .intro-key svg {
          display: block;
        }
        .intro-glint {
          position: absolute;
          left: ${KEY_X};
          top: ${KEY_Y};
          width: 14%;
          height: 8%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 244, 214, 0.9),
            rgba(255, 244, 214, 0) 65%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .intro-glint.on {
          opacity: 1;
        }
        .intro-bloom {
          position: absolute;
          left: 50%;
          top: 46%;
          width: 130%;
          height: 130%;
          transform: translate(-50%, -50%) scale(0.6);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 249, 235, 0.95),
            rgba(255, 249, 235, 0) 60%
          );
          opacity: 0;
          transition: opacity 0.45s ease, transform 0.6s ease;
          pointer-events: none;
        }
        .intro-bloom.on {
          opacity: 0.85;
          transform: translate(-50%, -50%) scale(1);
        }
        .intro-hint {
          position: absolute;
          bottom: 5%;
          left: 0;
          right: 0;
          text-align: center;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--muted);
          opacity: 0.6;
          pointer-events: none;
        }
        @keyframes caseIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
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
          .intro-stage,
          .intro-shake.shaking,
          .intro-case,
          .intro-key {
            animation: none !important;
            transition: opacity 0.3s ease !important;
          }
        }
      `}</style>
    </div>
  );
}
