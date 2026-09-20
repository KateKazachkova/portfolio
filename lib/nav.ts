/**
 * The site's navigation, in one place.
 *
 * It used to be declared twice — once in components/Nav.tsx for the bar that
 * runs across the inner pages, once in app/page.tsx for the hero's left
 * column — which is two lists to keep in step and one of them to forget.
 */
export const NAV_LINKS = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/recognition", label: "Recognition" },
  { href: "/contact", label: "Contact" },
] as const;

export const CV_HREF =
  "https://docs.google.com/document/d/11tvwCA6ZPIoi8v4u_ycBm_ZK570Rci7f/export?format=pdf";
