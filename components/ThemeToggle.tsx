"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
    setTheme(current ?? "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    setTheme(next);
  };

  // Avoid hydration mismatch – render a neutral button until mounted
  if (theme === null) {
    return <span style={{ width: 26, height: 26, display: "inline-block" }} aria-hidden />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="flex items-center justify-center border-2 transition-colors"
      style={{
        width: 26,
        height: 26,
        borderColor: "var(--border)",
        color: "var(--fg)",
        fontSize: 12,
        lineHeight: 1,
      }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
