import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Disable static export for Vercel (needed for API routes)
  // Use 'next build && next export' manually for Firebase if needed
  // output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

export default nextConfig;
