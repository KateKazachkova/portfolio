"use client";

import { useRef, useState } from "react";
import { U15_SONG as SONG, U15_SONG_HINT } from "@/lib/u15Song";

/**
 * The flash player from the Ukrainska 15 folder on the desk (DeskPlayer in
 * components/desk/U15File), laid in the case's margin: the same song, the
 * same LCD (the title only: at 9px there is no room for the clock). Click
 * plays, click again pauses; while it plays the backlight is on and the
 * title scrolls. Over it, while it is quiet, a label says what it
 * plays.
 */

export default function CasePlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };
  return (
    <button
      type="button"
      className="case-player"
      data-playing={playing || undefined}
      aria-label={`${playing ? "Pause" : "Play"} “${SONG.title}”, the song I wrote for the house`}
      aria-pressed={playing}
      onClick={toggle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/artefacts/ukrainska-15/player/player.webp" alt="" draggable={false} loading="lazy" />
      <span className="case-player__lcd" aria-hidden>
        <span className="case-player__title"><span>{SONG.title}</span></span>
      </span>
      <span className="case-player__hint" aria-hidden>{U15_SONG_HINT}</span>
      <audio
        ref={audio} src={SONG.src} preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      />
    </button>
  );
}
