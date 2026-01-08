import { MantineProvider, ColorSchemeScript, createTheme, MantineColorsTuple } from '@mantine/core';
import '@mantine/core/styles.css';
import './globals.css';
import { routing } from '@/routing';

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
  '#B38213',
  '#997010',
];

const theme = createTheme({
  colors: {
    accent: accentColor,
  },
  primaryColor: 'accent',
  black: '#000000',
  white: '#FFFFFF',
  defaultRadius: 'md',
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
    <html suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" ></ColorSchemeScript>
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">{children}</MantineProvider>
      </body>
    </html>
  );
}
