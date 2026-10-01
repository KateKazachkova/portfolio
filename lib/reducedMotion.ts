import { matches, useMedia } from "./useMedia";

/** Whether the visitor has asked for less motion (the system setting). The
 *  server, and the first render in the browser, assume they have not. */
const QUERY = "(prefers-reduced-motion: reduce)";

export const prefersReducedMotion = () => matches(QUERY);

export function useReducedMotion(): boolean {
  return useMedia(QUERY);
}
