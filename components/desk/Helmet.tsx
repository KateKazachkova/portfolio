"use client";

import { come } from "./offduty";

// Off Duty's foreground, under the index: a matte white road helmet on the
// desk, no straps (Higgsfield gpt_image_2_5 0cfa43c8, an edit of f10a5026;
// background cut d2ed4117, its own shadow on the grey kept as the
// picture's lower edge), a still standing square to the camera's line,
// leaning back with it so the shadow meets the desk nearest you. Box px,
// as OffDutyShelf; the shell is 90% of the picture across (1000 × 749).
export const HELMET = { x: -1200, z: 450, w: 358, tilt: 24 };
const H = Math.round(HELMET.w * 749 / 1000);

export default function Helmet() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="od-helmet" src="/items/off-duty/helmet-v2.webp" alt="" aria-hidden draggable={false} onClick={come}
      style={{
        left: `calc(${HELMET.x - HELMET.w / 2} * var(--u))`, top: `calc(${656 - H} * var(--u))`,
        width: `calc(${HELMET.w} * var(--u))`, height: `calc(${H} * var(--u))`,
        transform: `translateZ(calc(${HELMET.z} * var(--u))) rotateX(${HELMET.tilt}deg)`,
      }} />
  );
}
