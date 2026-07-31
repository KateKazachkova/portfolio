"use client";

import { useState } from "react";

/**
 * Evening edition — the doll sits in the niche and reads.
 *
 * The clip is generated straight into a crop of the real suitcase niche
 * (openpart.png), so it is OPAQUE and drops onto the niche region 1:1 — no
 * masking, no clip-path, no per-pixel fitting. The overlay rect below is the
 * exact position of that niche crop inside the suitcase image, found by
 * template-matching (corr 0.997), so it lines up on both open.png and open2.png.
 *
 * A poster (the video's own first frame) sits behind and shows during the load
 * gap and as the fallback where the browser can't autoplay the video.
 *
 * A tea-sip accent will be layered on once its clip is regenerated.
 */
const READ = "/dolls/video/evening_read.mp4";
const POSTER = "/dolls/video/niche_poster.jpg";

// Exact niche rect inside the suitcase container (matches openpart.png).
const NICHE = {
  position: "absolute",
  left: "40.62%",
  top: "11.43%",
  width: "18.16%",
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
          src={READ}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setFailed(true)}
          style={{ ...NICHE, zIndex: 3 }}
        />
      )}
    </>
  );
}
