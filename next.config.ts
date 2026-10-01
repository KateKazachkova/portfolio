import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second dev server in the same checkout needs its own build dir:
  // NEXT_DIST_DIR=.next-alt next dev -p 3240
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // lib/content.ts reads public/posters on the server (the discs' labels,
  // the posters' small copies), so the trace takes in the whole of public/
  // and a function passed Vercel's 250 MB (30.09, the room's textures).
  // Nothing else in public/ is read there: it is only served.
  outputFileTracingExcludes: {
    "/**": ["./public/room/**", "./public/dolls/**", "./public/suitcase/**", "./public/artefacts/**", "./public/items/**", "./public/player/**", "./public/profile/**", "./public/waypro/**", "./public/scene/**", "./public/*.mp4"],
  },
  // The old pages beside the desk are gone: their URLs go to the camera's
  // stop on home that replaced each, and Contact to home. (/work is a page
  // again: Case Studies, the index of every case file.)
  async redirects() {
    return [
      { source: "/about", destination: "/#profile", permanent: true },
      { source: "/recognition", destination: "/#recognition", permanent: true },
      { source: "/off-duty", destination: "/#off-duty", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
