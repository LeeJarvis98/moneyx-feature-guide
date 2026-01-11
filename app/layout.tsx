import { MantineProvider, ColorSchemeScript, createTheme, MantineColorsTuple } from '@mantine/core';
import '@mantine/core/styles.css';
import './globals.css';
import { routing } from '@/routing';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const accentColor: MantineColorsTuple = [
  '#FFF8E6',
  '#FFECB8',
  '#FFE08A',
  '#FFD45C',
  '#FFC82E',
  '#FFB81C',
  '#E6A619',
  '#CC9416',
  '#FFB81C',
  '#FFC82E',
];

const theme = createTheme({
  colors: {
    accent: accentColor,
  },
  primaryColor: 'accent',
  black: '#000000',
  white: '#FFFFFF',
  defaultRadius: 'md',
  fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  other: {
    mainColor: '#25282A',
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={inter.variable}>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" ></ColorSchemeScript>
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">{children}</MantineProvider>
      </body>
    </html>
  );
}
