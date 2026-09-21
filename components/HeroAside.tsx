import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { NAV_LINKS, CV_HREF } from "@/lib/nav";

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
  title = "Product Designer & Design Lead",
  lead = "I work on complicated products and make them less complicated.",
}: {
  title?: React.ReactNode;
  lead?: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="font-black uppercase tracking-tight leading-none"
        style={{ fontSize: 24, letterSpacing: "-0.02em", color: "var(--fg)" }}
      >
        KATE<span style={{ color: "var(--accent-red)" }}>™</span>
      </p>
      <h2 className="t-title mt-[124px]">{title}</h2>
      {/* Full ink, not the muted grey .t-body carries elsewhere: on the hero
          this line is the second half of the title, not body copy. */}
      <p className="t-body mt-4" style={{ color: "var(--fg)" }}>{lead}</p>

      <nav className="mt-14 flex flex-col items-start gap-3">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="t-label hover:opacity-60 transition-opacity"
          >
            {l.label}
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
    </div>
  );
}
