import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

export default withNextIntl(nextConfig);
