import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@sompacare/shared"],
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingRoot: repoRoot,
  async rewrites() {
    const apiBase = process.env.API_PROXY_TARGET ?? "http://localhost:4000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
