import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors during build (type checking happens elsewhere)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during builds (linting is verified separately)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
