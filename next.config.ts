import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root explicitly. Without this, Turbopack walks up
  // from this directory looking for a lockfile and can lock onto an
  // unrelated one higher up the filesystem (e.g. ~/package-lock.json),
  // then fails to resolve dependencies that only exist in this project's
  // own node_modules.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        pathname: '/coins/images/**',
      },
    ],
  },
};

export default nextConfig;
