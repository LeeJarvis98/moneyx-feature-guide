import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'vi'];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming 'locale' parameter is valid
  if (!locale || !locales.includes(locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}/common.json`)).default
  };
});