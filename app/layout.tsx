import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  IM_Fell_English,
  Newsreader,
  Archivo,
  Courier_Prime,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import SideNav from "@/components/SideNav";
import Footer from "@/components/Footer";
import TimeProvider from "@/components/TimeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Antique press serif for the ink tooltips (Marauder's-Map labels).
const fell = IM_Fell_English({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-fell",
});

// Case-study voices. Newsreader reads as a printed document where Arial
// cannot; Archivo carries a width axis, so headlines condense without a
// second family; Courier Prime is a real typewriter letterform, used for
// every label, numeral and margin note.
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
});

const typewriter = Courier_Prime({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-typewriter",
});

// Kate's own handwriting, drawn from her notes — replaces Caveat everywhere
// the site writes by hand (chalk to-do, case-study margin notes).
const chalk = localFont({
  src: "./fonts/Kate2-Regular.otf",
  variable: "--font-chalk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kate Kazachkova – Product Designer",
  description: "Product designer. Limited Edition №001. Available for hire.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The first frame, before React runs: paint the theme the visitor is about
  // to get, so the page never flashes the wrong one.
  //
  // In auto it restates themeForDaytime() from lib/time.ts in hours rather
  // than editions — dark from the walk home (17:00, or 19:00 at the weekend,
  // when the morning starts later and the day runs longer) through to the
  // alarm. TimeProvider corrects it from the real edition on mount, so a
  // disagreement of an hour costs a repaint, not a wrong page. A pinned
  // light or dark is the visitor's and wins outright.
  const themeScript = `
    (function () {
      try {
        var saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') {
          document.documentElement.setAttribute('data-theme', saved);
          return;
        }
        var d = new Date(), h = d.getHours(), weekend = d.getDay() === 0 || d.getDay() === 6;
        var dark = weekend ? (h < 8 || h >= 19) : (h < 7 || h >= 17);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      } catch (e) {}
    })();
  `;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fell.variable} ${chalk.variable} ${serif.variable} ${display.variable} ${typewriter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <TimeProvider>
          {/* The navigation is a left margin, not a bar across the top — the
              way home has always carried it. The row keeps the default stretch
              so the rail's column runs the full height of the page: that is
              what its sticky inner block needs to travel in. On home SideNav
              renders nothing and the row collapses to the page itself. The
              breakpoint is the one SideNav documents (1280px): under it the navigation
              is a bar again and there is no column to lay out.

              The row turns into a flex only when the rail is actually in it —
              `.page-row:has(> .nav-rail)` in globals.css. Home and the case
              files render no rail, and there the row must stay a block or the
              bar would line up beside the page instead of above it. */}
          <div className="flex-1 page-row">
            <SideNav />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
          <Footer />
        </TimeProvider>
      </body>
    </html>
  );
}
