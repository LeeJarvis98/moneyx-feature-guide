import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

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

export default withNextIntl(nextConfig);
