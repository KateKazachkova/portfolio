"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { mono } from "@/components/ui/type";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/recognition", label: "Recognition" },
  { href: "/contact", label: "Contact" },
];

const CV_HREF =
  "https://docs.google.com/document/d/11tvwCA6ZPIoi8v4u_ycBm_ZK570Rci7f/export?format=pdf";

export default function Nav() {
  const pathname = usePathname();
  // Home carries its navigation in the hero's left column, so the bar stays
  // off that page entirely — nothing across the top of the case.
  const onHome = pathname === "/";
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Transparent at the top of the page; frosted-glass + colour once scrolled.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // account for a page loaded already scrolled
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The row needs ~553px for the links, the CV button and the toggle. Under
  // md it did not get them: the header overflowed, Contact and the CV fell off
  // the right edge and the whole document scrolled sideways. Below md the
  // links move into a panel instead.
  // Held as the route the panel was opened on rather than a plain boolean, so
  // that arriving anywhere else closes it for free. A tap on a link navigates
  // without unmounting the header, and deriving this beats reaching for an
  // effect that sets state on every route change.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname;
  const setOpen = (next: boolean) => setOpenedOn(next ? pathname : null);

  // While the panel is over the page: Escape closes it, and the page behind
  // must not scroll under it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenedOn(null); };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  // The bar is transparent until you scroll, but the panel hangs below it over
  // the page, so it always paints its own ground.
  const barPainted = scrolled || open;

  if (onHome) return null;

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      // Set inline, not by class: globals.css has an unlayered `body > *`
      // rule pinning every direct child of <body> to position:relative and
      // z-index:1, and unlayered CSS beats Tailwind's layered utilities — so
      // `sticky top-0 z-50` above has never actually applied. Inline wins.
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: barPainted ? "color-mix(in srgb, var(--bg) 70%, transparent)" : "transparent",
        backdropFilter: barPainted ? "blur(12px) saturate(140%)" : "none",
        WebkitBackdropFilter: barPainted ? "blur(12px) saturate(140%)" : "none",
        borderBottom: barPainted ? "2px solid var(--border)" : "2px solid transparent",
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="font-black uppercase tracking-tight"
          style={{ fontSize: 18, letterSpacing: "-0.02em", color: "var(--fg)" }}
        >
          KATE<span style={{ color: "var(--accent-red)" }}>™</span>
        </Link>

        {/* Links — the full row, from md up */}
        <div className="hidden md:flex items-center gap-5">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="uppercase font-bold transition-colors"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: isActive(link.href) ? "var(--fg)" : "var(--muted)",
                borderBottom: isActive(link.href) ? "2px solid var(--accent)" : "2px solid transparent",
                paddingBottom: 2,
                paddingTop: 4, // balances border+padding below so the label centres on the button
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Download CV */}
          <a
            href={CV_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="uppercase font-bold transition-colors hover:opacity-80"
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              padding: "6px 12px",
              background: "var(--border)",
              color: "var(--bg)",
            }}
          >
            Download CV
          </a>

          <ThemeToggle />
        </div>

        {/* Toggle + latch — under md. The theme stays in the bar: it is one
            square, it costs nothing to keep, and it is the control people
            reach for without opening anything. */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="nav-panel"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex flex-col items-center justify-center border-2"
            style={{ width: 26, height: 26, borderColor: "var(--border)", gap: 3 }}
          >
            {/* Three ink rules that fold into a cross — same 2px ink as every
                border on the site, so it reads as a stamped control. */}
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                style={{
                  display: "block",
                  width: 14,
                  height: 2,
                  background: "var(--fg)",
                  transition: "transform 0.22s ease, opacity 0.18s ease",
                  transform: open
                    ? i === 0 ? "translateY(5px) rotate(45deg)"
                    : i === 2 ? "translateY(-5px) rotate(-45deg)"
                    : "none"
                    : "none",
                  opacity: open && i === 1 ? 0 : 1,
                }}
              />
            ))}
          </button>
        </div>
      </nav>

      {open && (
        <>
          {/* Scrim — a tap anywhere off the panel puts it away. */}
          <div
            className="md:hidden fixed left-0 right-0 bottom-0"
            // No z-index on either layer: the header is its own stacking
            // context, so the panel below wins on tree order alone. A negative
            // z-index here would drop the scrim behind the header's own
            // background and show nothing.
            style={{ top: 56, background: "color-mix(in srgb, var(--bg) 78%, transparent)" }}
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* The panel. Numbered like the sections on Recognition, because this
              is the same kind of index — a contents page, not a dropdown. */}
          <div
            id="nav-panel"
            className="md:hidden absolute left-0 right-0"
            style={{
              top: "100%",
              background: "var(--bg)",
              borderBottom: "2px solid var(--border)",
            }}
          >
            <div className="max-w-6xl mx-auto px-6 py-2">
              {LINKS.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 uppercase font-bold"
                  style={{
                    fontFamily: mono,
                    fontSize: 13,
                    letterSpacing: "0.14em",
                    color: isActive(link.href) ? "var(--fg)" : "var(--muted)",
                    padding: "14px 0 14px 12px",
                    borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                    borderLeft: isActive(link.href) ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                >
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {link.label}
                </Link>
              ))}

              <a
                href={CV_HREF}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block text-center uppercase font-bold"
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  padding: "12px 16px",
                  margin: "14px 0 16px",
                  background: "var(--border)",
                  color: "var(--bg)",
                }}
              >
                Download CV
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
