import './globals.css';
import '@/lib/env'; // Validate environment variables
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';

import dynamic from 'next/dynamic';
import ClientBody from '@/components/ClientBody';
import Navbar from '@/components/Navbar';
const Footer = dynamic(() => import('@/components/Footer'), { ssr: true });
import JsonLd from '@/components/JsonLd';
import GoogleTagManager, { GoogleTagManagerNoScript, GTM_ID } from '@/components/GoogleTagManager';
import UtmProvider from '@/components/UtmProvider';
import WebVitalsReporter from '@/components/WebVitalsReporter';
import ComparisonDebugger from '@/components/ComparisonDebugger';
import PwaOfflineController from '@/components/PwaOfflineController';
import ClipboardTracker from '@/components/ClipboardTracker';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'Avalia Solar - Marketplace de Energia Solar',
  description: 'O maior marketplace de energia solar do Brasil. Compare empresas, produtos e encontre a melhor solução para sua casa ou empresa.',
  keywords: 'energia solar, painéis solares, instalação solar, empresas solares, comparação, marketplace, energia renovável, sustentabilidade, economia de energia',
  authors: [{ name: 'Avalia Solar' }],
  creator: 'Avalia Solar',
  publisher: 'Avalia Solar',
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL('https://www.avaliasolar.com.br'),
  alternates: {
    canonical: '/',
    languages: {
      'pt-BR': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://www.avaliasolar.com.br',
    siteName: 'Avalia Solar',
    title: 'Avalia Solar - Marketplace de Energia Solar',
    description: 'O maior marketplace de energia solar do Brasil. Compare empresas, produtos e encontre a melhor solução.',
    images: [
      {
        url: '/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'Avalia Solar Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avalia - Marketplace de Energia Solar',
    description: 'O maior marketplace de energia solar do Brasil. Compare empresas, produtos e encontre a melhor solução.',
    images: ['/images/logo.png'],
    creator: '@avaliasolar',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';

  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://api.avaliasolar.com.br" />
        <link rel="dns-prefetch" href="https://api.avaliasolar.com.br" />
        {analyticsEnabled && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            {/* PostHog */}
            <link rel="preconnect" href="https://us.i.posthog.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://us.i.posthog.com" />
          </>
        )}
        {/* Analytics preconnects */}
        <link rel="preconnect" href="https://nyc3.digitaloceanspaces.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://nyc3.digitaloceanspaces.com" />

          {/*
          Theme detection: script síncrono mínimo que aplica a classe dark/light
          antes do primeiro paint, eliminando o CLS causado pelo ThemeProvider.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==='system'&&m)||(!t&&m)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-sans">
          {/* Google Tag Manager (noscript) */}
        <GoogleTagManagerNoScript gtmId={GTM_ID} />

        {/* GTM + Consent Mode: afterInteractive — não bloqueia TBT */}
        <GoogleTagManager gtmId={GTM_ID} />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UtmProvider>
            <ClientBody>
              <PwaOfflineController />
              <Navbar />
              {children}
              <Footer />
            </ClientBody>
          </UtmProvider>
        </ThemeProvider>

        {/* Debug component for development */}
        {process.env.NODE_ENV === 'development' && (
          <Suspense fallback={null}>
            <ComparisonDebugger />
          </Suspense>
        )}

        {/* Web Vitals Tracking - Non-blocking, after consent */}
        <Suspense fallback={null}>
          <WebVitalsReporter />
        </Suspense>

        {/* Clipboard Tracking - Micro-interactions */}
        <Suspense fallback={null}>
          <ClipboardTracker />
        </Suspense>
      </body>
    </html>
  );
}

