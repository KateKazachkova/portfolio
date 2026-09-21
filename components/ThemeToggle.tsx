"use client";

import { useTime } from "@/components/TimeProvider";

/**
 * One control, three states: auto, light, dark.
 *
 * Auto is the default and the point of the thing — the page takes its colour
 * from the hour the case is showing, so morning and the working day are light
 * and the walk home, the evening and the small hours are dark. A click pins
 * light or dark for anyone who wants it held; a third click hands the page
 * back to the clock.
 *
 * The glyph says which state is on rather than which one is next: a half moon
 * for auto, because it is neither, and the sun or the moon once pinned.
 *
 * It renders "auto" on the server and on the first client render alike — the
 * stored preference only arrives an effect later — so hydration matches and a
 * pinned theme settles the glyph a frame after paint.
 */
const GLYPH = { auto: "◐", light: "☀", dark: "☾" } as const;
const LABEL = {
  auto: "Theme follows the time of day — click to keep it light",
  light: "Theme kept light — click to keep it dark",
  dark: "Theme kept dark — click to follow the time of day",
} as const;

export default function ThemeToggle() {
  const { themePref, cycleTheme } = useTime();

  return (
    <button
      onClick={cycleTheme}
      aria-label={LABEL[themePref]}
      title={LABEL[themePref]}
      className="flex items-center justify-center border-2 transition-colors"
      style={{
        width: 26,
        height: 26,
        borderColor: "var(--border)",
        color: "var(--fg)",
        fontSize: 12,
        lineHeight: 1,
        // Auto is the resting state, so it is the quietest of the three.
        opacity: themePref === "auto" ? 0.65 : 1,
      }}
    >
      {GLYPH[themePref]}
    </button>
  );
}
