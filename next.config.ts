import type { NextConfig } from "next";

/**
 * Store Next.js output under node_modules (usually gitignored, less OneDrive contention).
 * Do NOT delete this folder on every dev start — see scripts/dev.mjs.
 */
const nextConfig: NextConfig = {
  // Vercel expects the default `.next` output; custom distDir is for local OneDrive only.
  ...(process.env.VERCEL ? {} : { distDir: "node_modules/.cache/next" }),
  async redirects() {
    return [
      {
        source: "/case-studies",
        destination: "/resources",
        permanent: true,
      },
      {
        source: "/case-studies/:path*",
        destination: "/resources",
        permanent: true,
      },
    ];
  },
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
