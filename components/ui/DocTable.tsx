/**
 * The document table — the one the report's inspection records are set in.
 *
 * Split the way the markup allows rather than the way a Figma library would:
 * in HTML a table is not a stack of boxes, it is `table > thead > tr > th`, and
 * a component may stand in for any of those only if it renders that exact
 * element and wraps it in nothing. One stray <div> and the rows stop being rows.
 *
 * So there are four, and they carry different weights:
 *  - DocTable owns everything true of the table as a whole — the rule it hangs
 *    from, the collapsed borders, the caption, and going back to `block` on a
 *    phone, which is what lets the columns stack instead of shrink.
 *  - DocHeadCell carries semantics and no style: this table's header is read,
 *    not seen.
 *  - DocRow is nearly empty today — a rule under it — and is here because
 *    behaviour is coming to it, not because it has anything to draw.
 *  - DocCell is where the repetition actually was: four kinds of cell, each
 *    with its own type, colour and alignment.
 */

import type { ReactNode } from "react";
import { mono } from "@/components/ui/type";

export function DocTable({
  caption,
  columns,
  children,
}: {
  /** Read out before the table. Says what the rows are, for someone who
   *  cannot see that they are rows. */
  caption: string;
  /** Column names. Hidden — by eye the columns are self-evident, and the
   *  design never showed a header — but a screen reader gets them. */
  columns: string[];
  children: ReactNode;
}) {
  return (
    <table
      className="w-full border-t mb-4 max-md:block"
      style={{ borderColor: "var(--border)", borderCollapse: "collapse" }}
    >
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          {columns.map((c) => (
            <DocHeadCell key={c}>{c}</DocHeadCell>
          ))}
        </tr>
      </thead>
      <tbody className="max-md:block">{children}</tbody>
    </table>
  );
}

export function DocHeadCell({ children }: { children: ReactNode }) {
  return <th scope="col">{children}</th>;
}

export function DocRow({
  children,
  className = "",
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
}: {
  children: ReactNode;
  className?: string;
  /** Optional — the certificate hover preview drives these from a client
   *  wrapper; a plain record leaves them off and the row stays inert. */
  onMouseEnter?: React.MouseEventHandler<HTMLTableRowElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLTableRowElement>;
  onMouseMove?: React.MouseEventHandler<HTMLTableRowElement>;
}) {
  return (
    <tr
      className={`border-b max-md:block ${className}`}
      style={{ borderColor: "var(--hairline)" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    >
      {children}
    </tr>
  );
}

/** ref — the stamped-on number in the margin; key — what the row is about;
 *  muted — the supporting detail; value — the finding, set against the edge. */
type CellKind = "ref" | "key" | "muted" | "value";

const CELL: Record<CellKind, { className: string; style?: React.CSSProperties }> = {
  ref:   { className: "text-gray-400 max-md:pb-0", style: { fontFamily: mono, fontSize: 12 } },
  key:   { className: "text-sm font-semibold max-md:py-0", style: { color: "var(--fg)" } },
  muted: { className: "text-sm text-gray-500 max-md:py-0" },
  value: { className: "text-sm text-right whitespace-nowrap max-md:text-left max-md:pt-0", style: { color: "var(--fg)" } },
};

export function DocCell({
  kind = "muted",
  className = "",
  children,
}: {
  kind?: CellKind;
  /** Column width belongs to the call site, and only from md up: below it the
   *  cells are `block` and a set width would squeeze the text into a column of
   *  single words. Pass `md:w-[46px]` and such. */
  className?: string;
  /** Optional — a spacer cell (the year now lives on the group header, so the
   *  ref column renders empty) passes none. */
  children?: ReactNode;
}) {
  const c = CELL[kind];
  return (
    <td className={`align-baseline py-2 pr-4 max-md:block ${c.className} ${className}`} style={c.style}>
      {children}
    </td>
  );
}
