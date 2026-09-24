"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { NAV_LINKS as LINKS, CV_HREF } from "@/lib/nav";
import { DESK_EVENT, shouldOpenDesk } from "@/components/DeskScene";

/** The index itself: the links, the CV and the theme, set down the page.
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
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className={`flex flex-col items-start gap-3 ${className}`}>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          // On home at night, Case Files is a camera move across the desk
          // rather than a page (components/DeskScene.tsx).
          onClick={link.href === "/work" && pathname === "/" ? (e) => {
            if (!shouldOpenDesk(e)) return;
            e.preventDefault();
            window.dispatchEvent(new Event(DESK_EVENT));
          } : undefined}
          className="t-label transition-opacity hover:opacity-60"
          style={{
            color: isActive(link.href) ? "var(--fg)" : "var(--muted)",
            borderLeft: isActive(link.href) ? "2px solid var(--accent)" : "2px solid transparent",
            paddingLeft: 10,
            marginLeft: -12,
          }}
        >
          {link.label}
        </Link>
      ))}

      <a
        href={CV_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="t-label text-gray-400 hover:opacity-60 transition-opacity mt-3"
      >
        CV ↗
      </a>
      <ThemeToggle />
    </nav>
  );
}
