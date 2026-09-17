/**
 * A numbered section heading, the way a report numbers its sections.
 *
 * Lived inside the Quality Check page until the kit needed the same thing —
 * which is the moment a local helper earns being shared, and not before.
 */

import { mono } from "@/components/ui/type";

export function SectionHeading({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-3">
      <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent-red)" }}>{n}</span>
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: "var(--fg)" }}>{title}</h2>
    </div>
  );
}
