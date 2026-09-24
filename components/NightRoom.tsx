"use client";

/**
 * The room at night, while she sleeps.
 *
 * NicheLight turns the case down, but the studio round it stayed at noon: a
 * white tiled desk and a lit wall around a sleeping doll. This puts the whole
 * room out. One multiply layer over the stage, in the box's own px (1118 ×
 * 745), carried far past its edges so the desk and wall beyond the plate go
 * down with it. Two things are left lit:
 *
 *  - moonlight through a window out of frame, high on the left: four panes
 *    and their cross laid across the desk in front of the case and up the
 *    wall behind the clock, cold and soft-edged;
 *  - a small warm lamp low in front of the case, whose pool keeps the case
 *    itself readable while the desk falls away from it.
 *
 * Multiply, like NicheLight, so the tiles and the mahogany go deeper rather
 * than grey; the lit shapes are simply lighter colours in the same layer.
 * Only at rest: once the camera travels (html[data-desk]) the pool no longer
 * sits where the case is, so the layer fades out (globals.css).
 */

const ON: Record<string, true> = { night: true };

export default function NightRoom({ edition }: { edition: string }) {
  const on = !!ON[edition];

  return (
    <svg
      aria-hidden
      className="night-room"
      data-on={on || undefined}
      viewBox="0 0 1118 745"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="nr-pool" cx="553" cy="470" r="600" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(553 470) scale(1 0.62) translate(-553 -470)">
          <stop offset="0" stopColor="rgb(236,206,168)" />
          <stop offset="0.32" stopColor="rgb(200,166,132)" />
          <stop offset="0.7" stopColor="rgb(120,100,96)" stopOpacity="0.5" />
          <stop offset="1" stopColor="rgb(80,74,90)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nr-moon-floor" x1="-120" y1="600" x2="420" y2="820" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgb(196,212,240)" />
          <stop offset="1" stopColor="rgb(140,158,196)" />
        </linearGradient>
        <linearGradient id="nr-moon-wall" x1="-260" y1="60" x2="80" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgb(170,188,226)" />
          <stop offset="1" stopColor="rgb(120,136,176)" />
        </linearGradient>
        <filter id="nr-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* the room, out */}
      <rect x="-3000" y="-2000" width="7118" height="6000" fill="rgb(58,62,86)" />

      {/* the lamp's pool */}
      <rect x="-3000" y="-2000" width="7118" height="6000" fill="url(#nr-pool)" />

      {/* the window on the wall: four panes and their cross, skewed up and
          to the right, over the wall left of the case and its left door */}
      <g filter="url(#nr-soft)" fill="url(#nr-moon-wall)" opacity="0.8">
        <path d="M-70 40 L20 22 L20 150 L-70 172 Z" />
        <path d="M32 20 L122 2 L122 126 L32 148 Z" />
        <path d="M-70 186 L20 164 L20 290 L-70 316 Z" />
        <path d="M32 162 L122 140 L122 264 L32 288 Z" />
      </g>

      {/* and across the desk in front of the case, stretched long */}
      <g filter="url(#nr-soft)" fill="url(#nr-moon-floor)" opacity="0.9">
        <path d="M-150 640 L40 612 L150 690 L-60 726 Z" />
        <path d="M58 609 L240 582 L360 654 L168 687 Z" />
        <path d="M-40 742 L170 704 L300 800 L70 846 Z" />
        <path d="M188 700 L380 666 L520 758 L318 796 Z" />
      </g>
    </svg>
  );
}
