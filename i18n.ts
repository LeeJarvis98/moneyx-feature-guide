import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Support for static export - get locale from requestLocale or default
  const locale = (await requestLocale) || routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./locales/${locale}/common.json`)).default
  };
});