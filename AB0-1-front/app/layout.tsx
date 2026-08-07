import './globals.css';
import '@/lib/env'; // Validate environment variables
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';

import AppContentFrame from '@/components/layout/AppContentFrame';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import Navbar from '@/components/Navbar';
import JsonLd from '@/components/JsonLd';
import GoogleTagManager, { GoogleTagManagerNoScript, GTM_ID } from '@/components/GoogleTagManager';
import UtmProvider from '@/components/UtmProvider';
import Providers from '@/components/Providers';
import WebVitalsReporter from '@/components/WebVitalsReporter';
import ComparisonDebugger from '@/components/ComparisonDebugger';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import DeferredClientRuntime from '@/components/performance/DeferredClientRuntime';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Avalia Solar | Compare Empresas de Energia Solar',
  description: SITE.description,
  keywords:
    'energia solar, painéis solares, instalação solar, empresas solares, comparação, marketplace, energia renovável, sustentabilidade, economia de energia',
  authors: [{ name: 'Avalia Solar' }],
  creator: 'Avalia Solar',
  publisher: 'Avalia Solar',
  applicationName: 'Avalia Solar',
  category: 'business',
  icons: {
    icon: [
      { url: '/icons/avalia-solar-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/avalia-solar-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      {
        url: '/icons/avalia-solar-apple-touch-180x180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.webmanifest',
  metadataBase: new URL(SITE.url),
  alternates: {
    canonical: '/',
    languages: {
      'pt-BR': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE.url,
    siteName: SITE.name,
    title: 'Avalia Solar | Compare Empresas de Energia Solar',
    description: SITE.description,
    images: [
      {
        url: SITE.ogImagePath,
        width: 1200,
        height: 630,
        alt: 'Avalia Solar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avalia Solar | Compare Empresas de Energia Solar',
    description: SITE.description,
    images: [SITE.ogImagePath],
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Avalia Solar',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1b36' },
  ],
  colorScheme: 'light dark',
};

import { ThemeProvider } from '@/components/theme-provider';
import NutshellAnalytics from '@/components/NutshellAnalytics';
import { AnalyticsDebugger } from '@/components/analytics/AnalyticsDebugger';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false';
  const nutshellEnabled = analyticsEnabled && process.env.NEXT_PUBLIC_ENABLE_NUTSHELL === 'true';

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      style={{ '--font-sans': 'system-ui, sans-serif' } as React.CSSProperties}
    >
      <head>
        <link rel="preconnect" href="https://api.avaliasolar.com.br" />
        <link rel="dns-prefetch" href="https://api.avaliasolar.com.br" />
        <JsonLd />
        {analyticsEnabled && (
          <>
            <link
              rel="preconnect"
              href="https://www.googletagmanager.com"
              crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            {/* PostHog */}
            <link rel="preconnect" href="https://us.i.posthog.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://us.i.posthog.com" />
          </>
        )}
        {nutshellEnabled && (
          <>
            <link
              rel="preconnect"
              href="https://growth.avaliasolar.com.br"
              crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href="https://growth.avaliasolar.com.br" />
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
            __html: `(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.classList.remove('light','darkmodern','monokai');document.documentElement.classList.add(t)}catch(e){}})()`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="pb-[calc(4.75rem+var(--safe-area-inset-bottom))] font-sans antialiased md:pb-0"
      >
        {/* Google Tag Manager (noscript) */}
        <GoogleTagManagerNoScript gtmId={GTM_ID} />

        {/* GTM + Consent Mode: afterInteractive — não bloqueia TBT */}
        <GoogleTagManager gtmId={GTM_ID} />

        {/* Nutshell Analytics */}
        <NutshellAnalytics />

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          themes={['light', 'darkmodern', 'monokai']}
        >
          <UtmProvider>
            <Providers>
              <Navbar />
              <AppContentFrame>{children}</AppContentFrame>
              <ConditionalFooter />
              <MobileBottomNav />
              <DeferredClientRuntime />
            </Providers>
          </UtmProvider>
        </ThemeProvider>

        {/* Debug components for development */}
        {process.env.NODE_ENV !== 'production' && (
          <>
            <Suspense fallback={null}>
              <ComparisonDebugger />
            </Suspense>
            <AnalyticsDebugger />
          </>
        )}

        <Suspense fallback={null}>
          <WebVitalsReporter />
        </Suspense>
      </body>
    </html>
  );
}
