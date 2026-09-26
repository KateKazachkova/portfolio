"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/reducedMotion";

/**
 * The live site on Kate's blue tablet, before the case's text: the same
 * tablet and scroll-through recording the Ukrainska 15 folder once carried
 * on the desk. The screen sits 4.08% / 3.32% in and is 91.3 × 88.6% of the
 * cut-out. It plays muted on a loop, and holds its poster for anyone who
 * has asked for less motion. It lies at a 5° tilt and opens the live site;
 * the button for it is beside the case's title (CaseStudy).
 */
export default function CaseTablet({ video, poster, href }: {
  video: string; poster: string; href: string;
}) {
  const screen = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = screen.current;
    if (v && !prefersReducedMotion()) v.play().catch(() => {});
  }, []);

  return (
    <div className="case-tablet-wrap">
      {/* the tablet is a way in too, but not a second stop for the keyboard:
          the button beside the title is the one link */}
      <a className="case-tablet" href={href} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/artefacts/ukrainska-15/tablet/tablet.webp" alt="" width={2183} height={1565} />
        <video ref={screen} className="case-tablet__screen" src={video} poster={poster}
          muted loop playsInline preload="metadata" />
      </a>
    </div>
  );
}
