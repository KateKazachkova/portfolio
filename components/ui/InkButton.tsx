/**
 * The solid stamp of a button: the ink block with the paper knocked out of it.
 *
 * Two of these existed, a pixel apart — 11px type on 16px of padding in one
 * place, 12px on 18px in the other. That is drift rather than design, so they
 * are one size now; the 404's button grew by a pixel of type.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { mono } from "@/components/ui/type";

export function InkButton({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  // A route gets Next's Link so the navigation stays client-side; an anchor on
  // the page, or anything off it, is a plain link.
  const Tag = href.startsWith("/") ? Link : "a";
  return (
    <Tag
      href={href}
      className={`inline-block uppercase font-bold transition-opacity hover:opacity-80 ${className}`}
      style={{
        fontFamily: mono,
        fontSize: 12,
        letterSpacing: "0.1em",
        padding: "10px 18px",
        background: "var(--border)",
        color: "var(--bg)",
      }}
    >
      {children}
    </Tag>
  );
}
