"use client";

import { CSSProperties, ReactNode, useState } from "react";

/**
 * Hover label. Wraps a hoverable target (an item on the suitcase) and, on
 * hover/focus, raises a small frosted-glass tag — the same panel Kate answers
 * from in the niche, so every label on the case speaks in one voice. Purely
 * presentational — pointer-events stay on the child, so hovering the item is
 * what triggers the tag.
 *
 * Replaces the native `title=` tooltips. Pass the wrapper's positioning via
 * `className` / `style` exactly as the old item wrapper had them.
 */
export default function InkTip({
  label,
  meta,
  place = "top",
  className,
  style,
  onHoverChange,
  focusable,
  children,
}: {
  label: string;
  meta?: string;
  place?: "top" | "bottom";
  className?: string;
  style?: CSSProperties;
  /** Told when the tag opens and closes, for items that also wake up on hover. */
  onHoverChange?: (open: boolean) => void;
  /** For an item that is only a picture: the wrapper itself takes focus, so
   *  the keyboard can read its tag too. */
  focusable?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const set = (v: boolean) => { setOpen(v); onHoverChange?.(v); };

  // Lift the whole item above its neighbours (rails z3, etc.) while the tag
  // shows, so the tag always reads on top. Inline z-index would win over
  // a stylesheet rule, so we merge it here.
  const wrapperStyle: CSSProperties = open ? { ...style, zIndex: 60 } : (style ?? {});

  return (
    <div
      className={className}
      style={wrapperStyle}
      tabIndex={focusable ? 0 : undefined}
      onMouseEnter={() => set(true)}
      onMouseLeave={() => set(false)}
      onFocus={() => set(true)}
      onBlur={() => set(false)}
    >
      {children}

      <span className={`inktip inktip--${place}`} data-open={open ? "true" : "false"}>
        <span className="inktip__name t-label">{label}</span>
        {meta && <span className="inktip__meta t-body">{meta}</span>}
      </span>
    </div>
  );
}
