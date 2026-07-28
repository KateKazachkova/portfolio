"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/recognition", label: "Recognition" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{
        background: "color-mix(in srgb, var(--bg) 90%, transparent)",
        borderBottom: "2px solid var(--border)",
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

        {/* Links */}
        <div className="flex items-center gap-5">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className="uppercase font-bold transition-colors"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: active ? "var(--fg)" : "var(--muted)",
                  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Download CV */}
          <a
            href="https://docs.google.com/document/d/11tvwCA6ZPIoi8v4u_ycBm_ZK570Rci7f/export?format=pdf"
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
      </nav>
    </header>
  );
}
