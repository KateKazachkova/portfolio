"use client";

import { CSSProperties, ReactNode, useState } from "react";

/**
 * Marauder's-Map-style hover label. Wraps a hoverable target (an item on the
 * suitcase) and, on hover/focus, reveals a small aged-parchment tag whose name
 * "writes on" in old ink. Purely presentational — pointer-events stay on the
 * child, so hovering the item is what triggers the tag.
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
  children,
}: {
  label: string;
  meta?: string;
  place?: "top" | "bottom";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Lift the whole item above its neighbours (rails z3, etc.) while the tag
  // shows, so the parchment always reads on top. Inline z-index would win over
  // a stylesheet rule, so we merge it here.
  const wrapperStyle: CSSProperties = open ? { ...style, zIndex: 60 } : (style ?? {});

  return (
    <div
      className={className}
      style={wrapperStyle}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}

      <span className={`inktip inktip--${place}`} data-open={open ? "true" : "false"}>
        <span className="inktip__paper">
          <span className="inktip__emblem" aria-hidden="true">
            <svg viewBox="0 0 24 32">
              <ellipse cx="12" cy="9" rx="8" ry="10" />
              <ellipse cx="12" cy="26" rx="5.4" ry="5" />
            </svg>
            <svg viewBox="0 0 24 32">
              <ellipse cx="12" cy="9" rx="8" ry="10" />
              <ellipse cx="12" cy="26" rx="5.4" ry="5" />
            </svg>
          </span>
          <span className="inktip__name">{label}</span>
          <svg className="inktip__under" viewBox="0 0 100 9" preserveAspectRatio="none" aria-hidden="true">
            <path d="M1,6 C18,2 34,8 50,5 C66,2 82,8 99,4" />
          </svg>
          {meta && <span className="inktip__meta">{meta}</span>}
        </span>
      </span>
    </div>
  );
}
