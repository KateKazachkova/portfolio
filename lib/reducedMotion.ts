import { useSyncExternalStore } from "react";

/** Whether the visitor has asked for less motion (the system setting). The
 *  server, and the first render in the browser, assume they have not. */
const QUERY = "(prefers-reduced-motion: reduce)";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia(QUERY).matches;

const subscribe = (on: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", on);
  return () => mq.removeEventListener("change", on);
};

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
