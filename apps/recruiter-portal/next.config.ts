import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sompacare/shared"],
  eslint: { ignoreDuringBuilds: true },
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
