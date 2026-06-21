import type { NextConfig } from "next";

/**
 * Store Next.js output under node_modules (usually gitignored, less OneDrive contention).
 * Do NOT delete this folder on every dev start — see scripts/dev.mjs.
 */
const nextConfig: NextConfig = {
  distDir: "node_modules/.cache/next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
