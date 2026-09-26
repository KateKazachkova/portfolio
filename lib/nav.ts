/**
 * The site's navigation, in one place.
 *
 * It used to be declared twice — once in components/Nav.tsx for the bar that
 * runs across the inner pages, once in app/page.tsx for the hero's left
 * column — which is two lists to keep in step and one of them to forget.
 *
 * The labels are the case's own vocabulary, not the routes: /work is filed as
 * Case Files, /about as Profile. Each is a stop of the camera on home's desk;
 * the old pages are gone, so the links point at the stop (`stop`, the hash
 * home opens it from); `href` is the old URL, kept as the item's name and
 * redirected by next.config.ts for anything that still links to it.
 * (/kit, the Parts List, still exists but is off the menu.)
 */
export const NAV_LINKS = [
  // The room itself, where the case stands open — the camera's rest. A link
  // to "/" from a stop brings the camera back (DeskScene's onHomeLink).
  { href: "/", stop: "/", label: "Studio" },
  { href: "/work", stop: "/#case-files", label: "Case Files" },
  { href: "/about", stop: "/#profile", label: "Profile" },
  { href: "/off-duty", stop: "/#off-duty", label: "Off Duty" },
  { href: "/recognition", stop: "/#recognition", label: "Recognition" },
] as const;

export const CONTACT_HREF = "mailto:e.kazachkova.kh@gmail.com";

export const CV_HREF =
  "https://docs.google.com/document/d/11tvwCA6ZPIoi8v4u_ycBm_ZK570Rci7f/export?format=pdf";

/** Who she is, in the column and at the top of the menu panel — the same two
 *  lines wherever the navigation is. */
export const NAV_TITLE = "Product Designer & Design Lead";
export const NAV_LEAD = "I work on complicated products and make them less complicated.";
