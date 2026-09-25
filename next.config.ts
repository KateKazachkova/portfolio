import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second dev server in the same checkout needs its own build dir:
  // NEXT_DIST_DIR=.next-alt next dev -p 3240
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The old pages beside the desk are gone: their URLs go to the camera's
  // stop on home that replaced each, and Contact to home.
  async redirects() {
    return [
      { source: "/work", destination: "/#case-files", permanent: true },
      { source: "/about", destination: "/#profile", permanent: true },
      { source: "/recognition", destination: "/#recognition", permanent: true },
      { source: "/off-duty", destination: "/#off-duty", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
