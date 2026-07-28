"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/recognition", label: "Recognition" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#f0ebe0]/90 backdrop-blur-sm border-b-2 border-black">
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="font-black uppercase tracking-tight text-black"
          style={{ fontSize: 18, letterSpacing: "-0.02em" }}
        >
          KATE<span className="text-[#e8212e]">™</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
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
                  color: active ? "#000" : "#888",
                  borderBottom: active ? "2px solid #f5e642" : "2px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Download CV */}
          <a
            href="/cv.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="uppercase font-bold bg-black text-[#f5e642] hover:bg-[#e8212e] hover:text-white transition-colors"
            style={{ fontSize: 11, letterSpacing: "0.1em", padding: "6px 12px" }}
          >
            Download CV
          </a>
        </div>
      </nav>
    </header>
  );
}
