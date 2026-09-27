import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The E2E suite (tests/e2e.cjs) drives the dev server through http://127.0.0.1:3210.
  // Next.js 16 blocks cross-origin requests to dev assets by default, so 127.0.0.1 has to
  // be allowed here — otherwise the pages render but never hydrate (no client JS).
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
