import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The travel map moved with the personal half of the manual: it was
  // /about/map while About carried both halves, and /about is now Profile
  // alone. Permanent, because the old path was linked from the page itself.
  async redirects() {
    return [{ source: "/about/map", destination: "/off-duty/map", permanent: true }];
  },
};

export default nextConfig;
