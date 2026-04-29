import type { NextConfig } from "next";
import path from "path";

const BACKEND_URL = process.env.BACKEND_URL ?? 'https://athletic-force-1-main-bacckend.vercel.app';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // ─── Reverse Proxy ──────────────────────────────────────────────────────────
  // All /api/* requests are proxied through Next.js to the backend.
  // This eliminates CORS entirely — the browser sees one single origin.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "af1.groomyorlife.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
