"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import HeroAside from "./HeroAside";
import { mono } from "@/components/ui/type";
import { NAV_LINKS as LINKS, CV_HREF, CONTACT_HREF, NAV_TITLE, NAV_LEAD } from "@/lib/nav";
import { openStop } from "@/components/DeskScene";

/** The site's navigation, in the left margin of every page.
 *
 *  It used to run across the top in a bar. Home never had that bar — its
 *  links sit in the column beside the case — so the rest of the site now
 *  reads the same way, and reads it from the same component: the rail *is*
 *  HeroAside, at home's own measure and offsets. Wordmark at 56px from the
 *  top, the masthead 124px under it, the index 56px under that, 34ch of
 *  measure. One column, one set of spacings, on every page.
 *
 *  Home renders HeroAside itself, inside the hero, so the rail stays off that
 *  route rather than standing a second copy of the column beside the first.
 *
 *  The rail only appears once the window can spare it: at home's measure it
 *  takes 376px out of every page's, and the widest thing on the site — the
 *  inspection record on /recognition — needs about 913px alongside it. Under
 *  that the component falls back to what it replaced: a sticky bar with a
 *  latch, and the index as a numbered panel under it. 1280px is that
 *  threshold; app/layout.tsx switches the row to a flex at the same width,
 *  and components/ui/DocTable.tsx lets the record's findings run unbroken
 *  from it.
 */
export default function SideNav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // A case file is already a document with a margin of its own: app/case.css
  // sets a rail of notes, a fixed measure and an annotation field, and the
  // widths are the page's, not the window's. Taking 232px off the front of it
  // collapses that grid onto one column on any laptop — so on a case file the
  // navigation stays the bar, and the only rail on the page is the one the
  // document brought. Its own "← Case Files" link goes back.
  const inCaseFile = pathname.startsWith("/work/");

  // Transparent at the top of the page; frosted-glass + colour once scrolled.
  // Only the small-screen bar uses this — the rail sits on the page's own
  // ground and never needs to paint over anything.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // account for a page loaded already scrolled
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Home carries its own column (HeroAside, beside the case) from 1024px up,
  // so there it gets no rail and no bar. Under 1024 the column stands over
  // the case and keeps only its title and line; the index folds into this
  // bar's latch, as it does on every other page.
  const barClass = inCaseFile ? undefined : onHome ? "min-[1024px]:hidden" : "min-[1280px]:hidden";

  return (
    <>
      {/* ── The rail, once there is room for it ── */}
      {!inCaseFile && !onHome && (
      <div
        className="nav-rail hidden min-[1280px]:block shrink-0"
        // The measure and the offsets are home's, read off the hero: 48px in
        // from the edge, then 34ch of column — home's own cap — then 24px.
        // No rule down the edge: home dropped its own. 376 = 48 + 303 + 24 + 1.
        style={{ width: 376 }}
      >
        <div
          className="sticky top-0"
          // Sticky set inline for the same reason the bar's is: globals.css
          // has an unlayered `body > *` rule that beats Tailwind's layered
          // utilities, and this column is close enough to that root to be
          // worth not relying on the class.
          style={{ position: "sticky", top: 0, padding: "56px 24px 40px 48px" }}
        >
          <HeroAside />
        </div>
      </div>
      )}

      {/* ── The bar + panel, under that ── */}
      <header
        className={barClass}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          background: barPainted ? "color-mix(in srgb, var(--bg) 70%, transparent)" : "transparent",
          backdropFilter: barPainted ? "blur(12px) saturate(140%)" : "none",
          WebkitBackdropFilter: barPainted ? "blur(12px) saturate(140%)" : "none",
          // A case file's bar carries no ink rule under it — the page is a notebook.
          borderBottom: barPainted && !inCaseFile ? "2px solid var(--border)" : "2px solid transparent",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <nav className="px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-black uppercase tracking-tight"
            style={{ fontSize: 18, letterSpacing: "-0.02em", color: "var(--fg)" }}
          >
            KATE<span style={{ color: "var(--accent-red)" }}>™</span>
          </Link>

          {/* Toggle + latch. The theme stays in the bar: it is one square, it
              costs nothing to keep, and it is the control people reach for
              without opening anything. A case file is a notebook page with no
              night, so it has no toggle, and its latch is bare rules. */}
          <div className="flex items-center gap-3">
            {/* not on home: the theme is off home's menu (Kate, 26.09) */}
            {!inCaseFile && !onHome && <ThemeToggle />}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="nav-panel"
              aria-label={open ? "Close menu" : "Open menu"}
              className={`flex flex-col items-center justify-center${inCaseFile ? "" : " border-2"}`}
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
              // No z-index on either layer: the header is its own stacking
              // context, so the panel below wins on tree order alone. A
              // negative z-index here would drop the scrim behind the header's
              // own background and show nothing.
              className="fixed left-0 right-0 bottom-0"
              style={{ top: 56, background: "color-mix(in srgb, var(--bg) 78%, transparent)" }}
              onClick={() => setOpen(false)}
              aria-hidden
            />

            {/* The panel. Numbered like the sections on Recognition, because
                this is the same kind of index — a contents page, not a
                dropdown. */}
            <div
              id="nav-panel"
              className="absolute left-0 right-0"
              style={{
                top: "100%",
                background: "var(--bg)",
                borderBottom: "2px solid var(--border)",
              }}
            >
              <div className="px-6 py-2">
                {/* The same two lines the rail carries, so the menu reads the
                    same on every page and at every width. */}
                <div style={{ padding: "18px 0 18px 14px", borderBottom: "1px solid var(--hairline)" }}>
                  <p className="t-title">{NAV_TITLE}</p>
                  <p className="t-body mt-2" style={{ color: "var(--fg)" }}>{NAV_LEAD}</p>
                </div>
                {LINKS.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.stop}
                    onClick={(e) => { setOpen(false); openStop(e, link.stop); }}
                    className="flex items-baseline gap-4 uppercase font-bold"
                    style={{
                      fontFamily: mono,
                      fontSize: 13,
                      letterSpacing: "0.14em",
                      color: isActive(link.href) ? "var(--fg)" : "var(--muted)",
                      padding: "14px 0 14px 12px",
                      borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                      borderLeft: isActive(link.href) ? "2px solid var(--accent-red)" : "2px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {link.label}
                  </Link>
                ))}

                <a
                  href={CONTACT_HREF}
                  onClick={() => setOpen(false)}
                  className="block text-center uppercase font-bold"
                  style={{
                    fontFamily: mono,
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    padding: "12px 16px",
                    margin: "14px 0 0",
                    borderRadius: 4,
                    border: "2px solid var(--border)",
                    color: "var(--fg)",
                  }}
                >
                  Let&rsquo;s Talk
                </a>
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
                    margin: "8px 0 16px",
                    borderRadius: 4,
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
    </>
  );
}
