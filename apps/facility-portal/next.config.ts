import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@sompacare/shared"],
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
