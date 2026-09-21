"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { daytimeForHour, daytimeForDate, themeForDaytime, type Daytime } from "@/lib/time";

/** What the visitor asked of the theme. `auto` is not a third colour — it is
 *  the absence of a choice, and lets the page keep following the scene. */
export type ThemePref = "auto" | "light" | "dark";

type TimeCtx = {
  hour: number | null;
  // auto = following the real local clock (weekend editions apply). Becomes
  // false once the visitor drags the clock, true again on "Now".
  auto: boolean;
  setHour: (h: number) => void;
  setNow: () => void;
  // Repaint the site-wide ambient from the clock. Handed out so a page that
  // overrides it for a preview can give it back — see app/page.tsx.
  applyAmbient: () => void;
  // Paint a mood the clock does not know about — the home page previewing a
  // forced edition. Goes through here rather than straight to the <html>
  // element so the theme follows the same mood the scene does.
  previewMood: (mood: Daytime) => void;
  themePref: ThemePref;
  // auto → light → dark → auto. One control, three states: see ThemeToggle.
  cycleTheme: () => void;
};

const Ctx = createContext<TimeCtx>({
  hour: null,
  auto: true,
  setHour: () => {},
  setNow: () => {},
  applyAmbient: () => {},
  previewMood: () => {},
  themePref: "auto",
  cycleTheme: () => {},
});

export function useTime() {
  return useContext(Ctx);
}

const NEXT: Record<ThemePref, ThemePref> = { auto: "light", light: "dark", dark: "auto" };

export default function TimeProvider({ children }: { children: React.ReactNode }) {
  const [hour, setHourState] = useState<number | null>(null);
  const [auto, setAuto] = useState(true);
  // Starts at "auto" on both sides of hydration; the stored preference is read
  // in an effect, after the boot script in app/layout.tsx has already painted
  // the first frame, so nothing flashes and nothing mismatches.
  const [themePref, setThemePref] = useState<ThemePref>("auto");

  // The mood currently on screen, whether it came from the clock or from a
  // forced edition. The theme follows this, so it has to outlive the render
  // that set it: a preference change must be able to re-derive the colour
  // without knowing which of the two put the mood there.
  const mood = useRef<Daytime>("day");
  // The preference, readable without re-creating the painters. If `paint`
  // depended on the state, every change of preference would rebuild
  // `applyAmbient`, refire its effect and repaint the mood from the clock —
  // which would silently drop the edition the home page is previewing.
  const pref = useRef<ThemePref>("auto");

  useEffect(() => { setHourState(new Date().getHours()); }, []);

  /** `data-theme` — the page's own light or dark. In auto it follows the mood
   *  on screen; pinned, it stands where the visitor put it. */
  const applyTheme = useCallback(() => {
    document.documentElement.setAttribute(
      "data-theme",
      pref.current === "auto" ? themeForDaytime(mood.current) : pref.current,
    );
  }, []);

  /** `data-daytime` — the scene's wash — and the theme that follows it. The
   *  one place either attribute is written. */
  const paint = useCallback((next: Daytime) => {
    mood.current = next;
    document.documentElement.setAttribute("data-daytime", next);
    applyTheme();
  }, [applyTheme]);

  // The stored preference, read after the first paint: the boot script in
  // app/layout.tsx has already put a colour on the page, so this only has to
  // agree with it, not beat it there.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("theme"); } catch { /* private mode */ }
    // "light"/"dark" are what the old two-state toggle wrote. They were a
    // deliberate choice then and stay one now.
    if (saved !== "light" && saved !== "dark" && saved !== "auto") return;
    pref.current = saved;
    setThemePref(saved);
    applyTheme();
  }, [applyTheme]);

  // Drive the site-wide ambient. In auto mode use the full local date so the
  // weekend moods apply; once the clock is dragged, go by the chosen hour.
  //
  // A function rather than only an effect body: the effect fires on a change
  // of hour or auto, and the home page needs to re-run exactly this when it
  // drops a forced edition — at which point neither of those has changed.
  const applyAmbient = useCallback(() => {
    if (hour === null) return;
    paint(auto ? daytimeForDate(new Date()) : daytimeForHour(hour));
  }, [hour, auto, paint]);

  useEffect(() => { applyAmbient(); }, [applyAmbient]);

  const previewMood = useCallback((next: Daytime) => paint(next), [paint]);

  const setHour = useCallback((h: number) => { setAuto(false); setHourState(h); }, []);
  const setNow = useCallback(() => { setAuto(true); setHourState(new Date().getHours()); }, []);

  const cycleTheme = useCallback(() => {
    const next = NEXT[pref.current];
    pref.current = next;
    try { localStorage.setItem("theme", next); } catch { /* private mode */ }
    // Only the colour changes: the mood on screen stays as it is, so pinning
    // a theme while previewing an edition does not throw the preview away.
    applyTheme();
    setThemePref(next);
  }, [applyTheme]);

  return (
    <Ctx.Provider value={{ hour, auto, setHour, setNow, applyAmbient, previewMood, themePref, cycleTheme }}>
      {children}
    </Ctx.Provider>
  );
}
