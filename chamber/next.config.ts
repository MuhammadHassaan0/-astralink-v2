import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence the workspace-root detection warning in monorepo layouts
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Standalone output — smaller Railway / Docker images
  // postbuild script copies public/ and .next/static/ into the standalone folder
  output: "standalone",

  // Ensure file tracing covers the chamber directory only (monorepo layout)
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
