import { useSyncExternalStore } from "react";

/** Whether a media query matches, kept up to date. The server, and the
 *  first render in the browser, assume it does not. */
const subs = new Map<string, (on: () => void) => () => void>();
const subscribeTo = (query: string) => {
  let s = subs.get(query);
  if (!s) {
    s = (on) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    };
    subs.set(query, s);
  }
  return s;
};

export const matches = (query: string) => typeof window !== "undefined" && window.matchMedia(query).matches;

export function useMedia(query: string): boolean {
  return useSyncExternalStore(subscribeTo(query), () => matches(query), () => false);
}
