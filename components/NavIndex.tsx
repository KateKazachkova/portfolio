"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS as LINKS, CV_HREF, CONTACT_HREF } from "@/lib/nav";
import { openStop } from "@/components/DeskScene";

/** The index itself: the links, then the two calls — the CV and a letter — set down the page.
 *
 *  Its own file because it has two callers: the column beside the case on home
 *  and the rail down every other page, which is HeroAside again
 *  (components/HeroAside.tsx, components/SideNav.tsx). One list of links,
 *  rendered one way, wherever it appears.
 *
 *  The active rule is the same 2px the top bar used, stood on its end: on a
 *  vertical index "you are here" belongs down the side of a label, not under
 *  it. The negative margin pays back the border and the padding exactly, so
 *  the labels sit on the same left edge whether or not one of them is lit.
 */

export default function NavIndex({ className = "mt-14" }: { className?: string }) {
  const pathname = usePathname();
  // Studio is "/", and on home every stop is "/" too: which one is lit there
  // follows the camera, in globals.css (.nav-index a[data-stop]).
  const isActive = (href: string) => href !== "/" && (pathname === href || pathname.startsWith(href + "/"));

  return (
    <nav className={`nav-index flex flex-col items-start gap-3 ${className}`}>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.stop}
          // On home these are camera moves — down to the desk, over to the
          // wall — rather than pages (components/DeskScene.tsx).
          onClick={(e) => { openStop(e, link.stop); }}
          data-stop={link.stop}
          className="t-label transition-opacity hover:opacity-60"
          style={{
            // Not --muted: on the glass over the dark wall that grey sank.
            color: isActive(link.href) ? "var(--fg)" : "color-mix(in srgb, var(--fg) 74%, transparent)",
            borderLeft: isActive(link.href) ? "2px solid var(--accent-red)" : "2px solid transparent",
            paddingLeft: 10,
            marginLeft: -12,
          }}
        >
          {link.label}
        </Link>
      ))}

      <div className="nav-calls flex flex-wrap gap-2 mt-4">
        <a href={CONTACT_HREF} className="nav-call nav-call--primary t-label">Let&rsquo;s Talk</a>
        <a href={CV_HREF} target="_blank" rel="noopener noreferrer" className="nav-call t-label">CV</a>
      </div>
    </nav>
  );
}
