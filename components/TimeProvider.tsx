"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { daytimeForHour, daytimeForDate } from "@/lib/time";

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
};

const Ctx = createContext<TimeCtx>({ hour: null, auto: true, setHour: () => {}, setNow: () => {}, applyAmbient: () => {} });

export function useTime() {
  return useContext(Ctx);
}

export default function TimeProvider({ children }: { children: React.ReactNode }) {
  const [hour, setHourState] = useState<number | null>(null);
  const [auto, setAuto] = useState(true);

  useEffect(() => { setHourState(new Date().getHours()); }, []);

  // Drive the site-wide ambient. In auto mode use the full local date so the
  // weekend moods apply; once the clock is dragged, go by the chosen hour.
  //
  // A function rather than only an effect body: the effect fires on a change
  // of hour or auto, and the home page needs to re-run exactly this when it
  // drops a forced edition — at which point neither of those has changed.
  const applyAmbient = useCallback(() => {
    if (hour === null) return;
    const mood = auto ? daytimeForDate(new Date()) : daytimeForHour(hour);
    document.documentElement.setAttribute("data-daytime", mood);
  }, [hour, auto]);

  useEffect(() => { applyAmbient(); }, [applyAmbient]);

  const setHour = useCallback((h: number) => { setAuto(false); setHourState(h); }, []);
  const setNow = useCallback(() => { setAuto(true); setHourState(new Date().getHours()); }, []);

  return <Ctx.Provider value={{ hour, auto, setHour, setNow, applyAmbient }}>{children}</Ctx.Provider>;
}
