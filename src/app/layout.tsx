import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, Space_Grotesk } from 'next/font/google';
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker';
import './globals.css';

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Control de Estacionamiento',
  description: 'Sistema de control de entradas y salidas de vehículos',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Estacionamiento',
  },
};

export const viewport: Viewport = {
  themeColor: '#f6a723',
};

// Runs before hydration so a stored "light" preference doesn't flash the
// dark default first — CSS vars only switch once `data-theme` is set.
const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem('theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${barlowCondensed.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
