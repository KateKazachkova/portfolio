/**
 * A sheet of the report's own stock.
 *
 * Four places were writing this out by hand — the 404 tag, the Quality Check
 * card and its two kinds of panel — and they had already drifted: same paper,
 * but one had a shadow, one had none, one had the shadow pressed inwards.
 *
 * `raised` is the difference that actually means something: paper lying on the
 * desk versus paper held above it. The inset variant is a grid cell whose rules
 * come from its own edges, so it stays a separate thing rather than a third
 * shadow setting.
 */

import type { CSSProperties, ElementType, ReactNode } from "react";

export function Sheet({
  as: Tag = "div",
  raised = false,
  className = "",
  style,
  children,
}: {
  as?: ElementType;
  /** Lifted off the page, with the shadow that says so. */
  raised?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Tag
      className={className}
      style={{
        background: "var(--panel)",
        border: "1px solid var(--hairline)",
        ...(raised ? { boxShadow: "0 8px 16px rgba(30,24,16,0.09)" } : null),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
