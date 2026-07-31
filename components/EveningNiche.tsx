"use client";

import { useState } from "react";

/**
 * Evening edition — the doll sits in the niche and reads.
 * The clip is pre-cropped to the niche and carries its own feathered alpha
 * (exported from the .mov), so it drops straight onto the suitcase niche with
 * no CSS masking. It plays the sit-down-and-read transition once and then
 * holds on its last frame (the settled reading pose).
 *
 * loop + tea accent will be added once those clips are exported with the
 * identical crop.
 *
 * Safari can't play VP9-alpha video, so a matching poster (the settled reading
 * frame, with alpha) sits behind and shows there and during the load gap.
 */
const SIT = "/dolls/video/evening_sit2.webm";
const POSTER = "/dolls/video/evening_niche_poster.png";

// Placement of the niche crop inside the suitcase container (aspect 410/800).
const NICHE = {
  position: "absolute",
  left: "40.05%",
  top: "23.99%",
  width: "19.05%",
  height: "auto",
  maxWidth: "none",
  display: "block",
} as const;

export default function EveningNiche() {
  const [failed, setFailed] = useState(false);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER}
        alt="Evening edition — reading in the niche"
        style={{ ...NICHE, zIndex: 2 }}
        draggable={false}
      />
      {!failed && (
        <video
          src={SIT}
          autoPlay
          muted
          playsInline
          onError={() => setFailed(true)}
          style={{ ...NICHE, zIndex: 3 }}
        />
      )}
    </>
  );
}
