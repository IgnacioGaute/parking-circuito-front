import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Manrope } from 'next/font/google';
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
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
  themeColor: '#D9A441',
  // Pinned viewport: this is a kiosk-style operator tool, not a document to
  // pinch-zoom — combined with 16px+ form-control font sizes (the iOS
  // Safari auto-zoom threshold) this keeps the layout from zooming at all,
  // including when the keyboard opens over a form field.
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      className={`${manrope.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
