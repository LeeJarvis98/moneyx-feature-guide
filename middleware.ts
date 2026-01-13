import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';

export default createMiddleware({
  ...routing,
  // Disable automatic locale detection based on browser language
  localeDetection: false
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(vi|en)/:path*']
};
