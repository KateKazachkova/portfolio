/**
 * The WebGL room is behind a flag while it is being built: ?gl=1 turns it
 * on for the tab (sessionStorage, so moving about the site keeps it),
 * ?gl=0 turns it off. The boot script sets html[data-gl] before the room's
 * DOM is parsed, so the CSS room is never painted under the flag.
 */
export const GL_BOOT = `try{var q=location.search;if(/[?&]gl=1(&|$)/.test(q))sessionStorage.setItem("room-gl","1");if(/[?&]gl=0(&|$)/.test(q))sessionStorage.removeItem("room-gl");if(sessionStorage.getItem("room-gl")==="1")document.documentElement.setAttribute("data-gl","")}catch(e){}`;

export const glOn = () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-gl");
