"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { daytimeForHour } from "@/lib/time";

type TimeCtx = {
  hour: number | null;
  setHour: (h: number) => void;
  setNow: () => void;
};

const Ctx = createContext<TimeCtx>({ hour: null, setHour: () => {}, setNow: () => {} });

export function useTime() {
  return useContext(Ctx);
}

export default function TimeProvider({ children }: { children: React.ReactNode }) {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => { setHour(new Date().getHours()); }, []);

  // Drive the site-wide ambient by time of day
  useEffect(() => {
    if (hour === null) return;
    document.documentElement.setAttribute("data-daytime", daytimeForHour(hour));
  }, [hour]);

  const setNow = useCallback(() => setHour(new Date().getHours()), []);

  return <Ctx.Provider value={{ hour, setHour, setNow }}>{children}</Ctx.Provider>;
}
