import { MantineProvider, ColorSchemeScript, createTheme, MantineColorsTuple } from '@mantine/core';
import '@mantine/core/styles.css';
import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import FloatingSupportButton from '@/components/FloatingSupportButton';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Việt Nam Chất Lượng Cao',
  description: 'Bot AI mạnh mẽ kết hợp các tính năng tài chính tối ưu nhất',
  icons: {
    icon: '/vnclc-small-logo.png',
    shortcut: '/vnclc-small-logo.png',
    apple: '/vnclc-small-logo.png',
  },
};

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
    <html lang="vi" suppressHydrationWarning className={inter.variable} style={{ colorScheme: 'dark' }}>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          {children}
          <FloatingSupportButton />
        </MantineProvider>
      </body>
    </html>
  );
}
