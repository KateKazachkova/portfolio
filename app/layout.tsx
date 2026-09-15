import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  IM_Fell_English,
  Caveat,
  Newsreader,
  Archivo,
  Courier_Prime,
} from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
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

const chalk = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-chalk",
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
  // Default the theme by local time — night (dark) from 19:00 to 06:00,
  // day (light) otherwise — on top of the time-of-day dolls. A manual
  // toggle is saved to localStorage and always wins over the time default.
  const themeScript = `
    (function () {
      try {
        var saved = localStorage.getItem('theme');
        var h = new Date().getHours();
        var byTime = (h >= 19 || h < 6) ? 'dark' : 'light';
        var theme = saved || byTime;
        document.documentElement.setAttribute('data-theme', theme);
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
          <Nav />
          <div className="flex-1">{children}</div>
          <Footer />
        </TimeProvider>
      </body>
    </html>
  );
}
