"use client";

import { useLamp } from "@/lib/lamp";

/**
 * The desk lamp: a red architect's lamp standing on the desk behind the
 * case's right door, its arm rising in the gap between the case and the
 * Davey trophy and its head reaching back over the lid, pointed down at the
 * desk — the same red lacquer, cream enamel and brass as the flip clock,
 * generated from it. It is the light switch: a click turns it on or off
 * (lib/lamp.ts), and in the dark that decides how the room is lit
 * (components/NightRoom.tsx).
 *
 * Two stills from one generation, pixel-aligned (public/items/lamp-off.webp,
 * lamp-on.webp; mirrored from the render so it reaches left), cross-faded.
 * Standing on the desk plane like the clock: in the room's own px (1075 per
 * metre), its foot on the desk line at 656.
 */

// 86 cm to the top of its head, against the wall (z -269, 6 cm off it) so
// the trophy stands in front of its base. x is the base's centre, far enough
// right that the arm clears the case's right door; tall enough that the head
// clears the lid.
export const LAMP = { x: 1070, h: 920, z: -200 };
const LAMP_W = Math.round(LAMP.h * 655 / 900);

// Measured off the still's alpha, as fractions of it: the base's centre, the
// head, the middle of its mouth, and the upright arm.
const BASE = 0.77;
const HEAD = { l: 0.01, r: 0.47, b: 0.32 };
const MOUTH = { x: 0.2, y: 0.27 };
const ARM = { l: 0.76, r: 0.9, t: 0.32, b: 0.92 };

/** Where things land in the stage's own px at rest: the camera's perspective
 *  (2150) about its principal point (560, 226) at the lamp's depth. */
const K = 2150 / (2150 - LAMP.z);
const LEFT = LAMP.x - BASE * LAMP_W;
const TOP = 656 - LAMP.h;
const at = (fx: number, fy: number) => ({
  x: 560 + (LEFT + fx * LAMP_W - 560) * K,
  y: 226 + (TOP + fy * LAMP.h - 226) * K,
});
export const LAMP_MOUTH = at(MOUTH.x, MOUTH.y);
/** the head's size on screen, for the glow over it */
export const LAMP_HEAD = { w: (HEAD.r - HEAD.l) * LAMP_W * K, h: HEAD.b * LAMP.h * K };
// the case's lid and its right door's outer edge, in the stage's px: the
// lamp shows over the one and past the other, and is behind the case between
export const LID = 58;
export const DOOR_R = 1027;

/** The lamp as it stands in the room: a picture, lit or not. */
export default function DeskLamp() {
  const { on } = useLamp();

  return (
    <div
      aria-hidden
      className="desk-lamp"
      data-on={on || undefined}
      style={{
        left: `calc(${LEFT} * var(--u))`,
        top: `calc(${TOP} * var(--u))`,
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
 *  click, so the control is bare buttons laid over it from above, at where
 *  the camera puts it at rest: the head over the lid and the arm past the
 *  right door. Only at rest: once the camera travels they would no longer be
 *  over the lamp. */
const HEAD_TL = at(HEAD.l, 0);
const HEAD_BR = at(HEAD.r, HEAD.b);
const ARM_TL = at(ARM.l, ARM.t);
const ARM_BR = at(ARM.r, ARM.b);
const pct = (x: number, y: number, w: number, h: number) => ({
  left: `${(x / 1118 * 100).toFixed(2)}%`, top: `${(y / 745 * 100).toFixed(2)}%`,
  width: `${(w / 1118 * 100).toFixed(2)}%`, height: `${(h / 745 * 100).toFixed(2)}%`,
});
export function DeskLampSwitch() {
  const { on, toggle } = useLamp();
  const label = on ? "Desk lamp: on — switch it off" : "Desk lamp: off — switch it on";
  const title = on ? "Switch the lamp off" : "Switch the lamp on";
  const armL = Math.max(DOOR_R, ARM_TL.x);

  // in the stage's own percentages: --u only lives inside the camera
  return (
    <>
      <button
        type="button" className="desk-lamp-switch" onClick={toggle}
        aria-pressed={on} aria-label={label} title={title}
        style={pct(HEAD_TL.x, HEAD_TL.y, HEAD_BR.x - HEAD_TL.x, Math.min(LID, HEAD_BR.y) - HEAD_TL.y)}
      />
      {ARM_BR.x > armL && (
        <button
          type="button" className="desk-lamp-switch" onClick={toggle}
          aria-hidden tabIndex={-1} title={title}
          style={pct(armL, ARM_TL.y, ARM_BR.x - armL, ARM_BR.y - ARM_TL.y)}
        />
      )}
    </>
  );
}
