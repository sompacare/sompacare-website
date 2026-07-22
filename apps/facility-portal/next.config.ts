import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sompacare/shared"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
