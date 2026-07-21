import './globals.css';
import '@/lib/env'; // Validate environment variables
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import AppContentFrame from '@/components/layout/AppContentFrame';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import Navbar from '@/components/Navbar';
import JsonLd from '@/components/JsonLd';
import GoogleTagManager, { GoogleTagManagerNoScript, GTM_ID } from '@/components/GoogleTagManager';
import UtmProvider from '@/components/UtmProvider';
import Providers from '@/components/Providers';
import WebVitalsReporter from '@/components/WebVitalsReporter';
import ComparisonDebugger from '@/components/ComparisonDebugger';
import PwaOfflineController from '@/components/PwaOfflineController';
import ClipboardTracker from '@/components/ClipboardTracker';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { TabNotificationNotifier } from '@/components/notifications/TabNotificationNotifier';
import { SITE } from '@/lib/site';

const ComparisonFloatingBar = dynamic(() => import('@/components/ComparisonFloatingBar'), { ssr: false });
const GlobalChatWidget = dynamic(() => import('@/components/chat/GlobalChatWidget'), { ssr: false });

export const metadata: Metadata = {
  title: 'Avalia Solar | Compare Empresas de Energia Solar',
  description: SITE.description,
  keywords:
    'energia solar, painéis solares, instalação solar, empresas solares, comparação, marketplace, energia renovável, sustentabilidade, economia de energia',
  authors: [{ name: 'Avalia Solar' }],
  creator: 'Avalia Solar',
  publisher: 'Avalia Solar',
  icons: {
    icon: '/favicon.ico',
  },
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
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
        >
          <UtmProvider>
            <Providers>
              <TabNotificationNotifier />
              <PwaOfflineController />
              <Navbar />
              <AppContentFrame>{children}</AppContentFrame>
              <ComparisonFloatingBar />
              <GlobalChatWidget />
              <ConditionalFooter />
              <MobileBottomNav />
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
