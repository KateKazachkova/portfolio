/**
 * The room is WebGL's by default; the CSS room (legacy) stays as the
 * fallback and for A/B: ?gl=0 turns WebGL off for the tab (sessionStorage,
 * so moving about the site keeps it), ?gl=1 back on. A tab whose WebGL room
 * could not start is kept on the CSS room too (glOff). The boot script sets
 * html[data-gl] before the room's DOM is parsed, so the CSS room is never
 * painted under it; with no sessionStorage at all, WebGL.
 */
export const GL_BOOT = `(function(){var r=document.documentElement,on=true;try{var q=location.search,s=sessionStorage;if(/[?&]gl=1(&|$)/.test(q))s.setItem("room-gl","1");if(/[?&]gl=0(&|$)/.test(q))s.setItem("room-gl","0");on=s.getItem("room-gl")!=="0"}catch(e){}if(on)r.setAttribute("data-gl","")})()`;

export const glOn = () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-gl");

const subs = new Set<() => void>();
export const onGl = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

/** The room could not start (no WebGL, or it failed): the tab goes back to
 *  the CSS room and stays there — the flag and what the room set on html go,
 *  and whatever reads glOn renders the CSS room again. */
export function glOff() {
  const r = document.documentElement;
  r.removeAttribute("data-gl");
  for (const k of Object.keys(r.dataset)) if (/^gl[A-Z]/.test(k) && k !== "glFailed") delete r.dataset[k];
  try { sessionStorage.setItem("room-gl", "0"); } catch {}
  for (const f of subs) f();
}
