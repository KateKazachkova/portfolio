import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second dev server in the same checkout needs its own build dir:
  // NEXT_DIST_DIR=.next-alt next dev -p 3240
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
