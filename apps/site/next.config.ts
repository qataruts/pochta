import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // This app is standalone; pin the tracing root to its own directory so Next
  // doesn't infer the parent monorepo (which has its own pnpm lockfile).
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
