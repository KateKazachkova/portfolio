import Link from "next/link";
import NavIndex from "@/components/NavIndex";
import { NAV_TITLE, NAV_LEAD } from "@/lib/nav";

/**
 * The column to the left of the case: the wordmark, who she is, and the
 * navigation — which on Home lives here instead of in a bar across the top,
 * so nothing runs over the suitcase.
 *
 * The heading and the line under it are props because the block is the page's
 * masthead, not a fixed sign: a route that wants the same column with its own
 * sentence gets it without a second copy of the markup.
 */
export default function HeroAside({
  title = NAV_TITLE,
  lead = NAV_LEAD,
}: {
  title?: React.ReactNode;
  lead?: React.ReactNode;
}) {
  return (
    <div className="hero-aside">
      <p
        className="font-black uppercase tracking-tight leading-none"
        style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--fg)" }}
      >
        <Link href="/" aria-label="KATE™ – home" className="aside-strip" style={{ color: "inherit" }}>
          KATE<span style={{ color: "var(--accent-red)" }}>™</span>
        </Link>
      </p>
      {/* (their words in spans: over the desk each line gets a strip of the
          desk under it, globals.css .aside-strip) */}
      <h2 className="t-title mt-[124px]"><span className="aside-strip">{title}</span></h2>
      {/* Full ink, not the muted grey .t-body carries elsewhere: on the hero
          this line is the second half of the title, not body copy. */}
      <p className="t-body mt-4" style={{ color: "var(--fg)" }}><span className="aside-strip">{lead}</span></p>

      {/* The index itself — the same component the rail down every other page
          uses, because the rail is this column. */}
      <NavIndex />
    </div>
  );
}
