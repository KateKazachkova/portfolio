"use client";

import { useLamp } from "@/lib/lamp";

/**
 * The desk lamp: a red mushroom lamp standing on the desk behind the flip
 * clock, between it and the case — the same red lacquer and cream as the
 * clock, generated from it. It is the light switch: a click turns it on or
 * off (lib/lamp.ts), and in the dark that decides how the room is lit
 * (components/NightRoom.tsx).
 *
 * Two stills from one generation, pixel-aligned (public/items/lamp-off.webp,
 * lamp-on.webp), cross-faded. Standing on the desk plane like the clock: in
 * the room's own px (1075 per metre), its foot on the desk line at 656.
 */

// 22 cm tall, its stem 12 cm in front of the wall (z -269), its stem's
// centre just left of the case's left door. The stem sits 36% across the
// picture: the cord trails off to the right.
export const LAMP = { x: -20, h: 236, z: -150, stem: 0.36 };
const LAMP_W = Math.round(LAMP.h * 475 / 640);

/** Where the lit shade lands in the stage's own px at rest, for NightRoom's
 *  pool: the camera's perspective (2150) about its principal point
 *  (560, 226) at the lamp's depth. The shade's middle is 23% down the
 *  picture, the rim that throws the light 45%. */
const K = 2150 / (2150 - LAMP.z);
const at = (x: number, y: number) => ({ x: 560 + (x - 560) * K, y: 226 + (y - 226) * K });
export const LAMP_SHADE = at(LAMP.x, 656 - LAMP.h + 0.23 * LAMP.h);
export const LAMP_RIM = at(LAMP.x, 656 - LAMP.h + 0.45 * LAMP.h);
export const LAMP_SCALE = K;

/** The lamp as it stands in the room: a picture, lit or not. */
export default function DeskLamp() {
  const { on } = useLamp();

  return (
    <div
      aria-hidden
      className="desk-lamp"
      data-on={on || undefined}
      style={{
        left: `calc(${LAMP.x - LAMP.stem * LAMP_W} * var(--u))`,
        top: `calc(${656 - LAMP.h} * var(--u))`,
        width: `calc(${LAMP_W} * var(--u))`,
        height: `calc(${LAMP.h} * var(--u))`,
        transform: `translateZ(calc(${LAMP.z} * var(--u)))`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/items/lamp-off.webp" alt="" draggable={false} className="desk-lamp__img" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/items/lamp-on.webp" alt="" draggable={false} className="desk-lamp__img desk-lamp__img--on" />
    </div>
  );
}

/** Its switch. The lamp stands in the desk, and the case's plane — the
 *  suitcase picture across the whole stage — lies over it and takes every
 *  click, so the control is a bare button laid over the lamp from above, at
 *  where the camera puts it at rest (the same projection as the pool). Only
 *  at rest: once the camera travels it would no longer be over the lamp. */
const TOP = at(LAMP.x - LAMP.stem * LAMP_W, 656 - LAMP.h);
export function DeskLampSwitch() {
  const { on, toggle } = useLamp();

  return (
    <button
      type="button"
      className="desk-lamp-switch"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Desk lamp: on — switch it off" : "Desk lamp: off — switch it on"}
      title={on ? "Switch the lamp off" : "Switch the lamp on"}
      // in the stage's own percentages: --u only lives inside the camera
      style={{
        left: `${(TOP.x / 1118 * 100).toFixed(2)}%`,
        top: `${(TOP.y / 745 * 100).toFixed(2)}%`,
        // the lamp itself, not the cord trailing off to its right
        width: `${(LAMP_W * 0.72 * K / 1118 * 100).toFixed(2)}%`,
        height: `${(LAMP.h * K / 745 * 100).toFixed(2)}%`,
      }}
    />
  );
}
