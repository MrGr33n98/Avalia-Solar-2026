import './globals.css';
import '@/lib/env'; // Validate environment variables
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';

import dynamic from 'next/dynamic';
import ClientBody from '@/components/ClientBody';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
const Footer = dynamic(() => import('@/components/Footer'), { ssr: true });
import JsonLd from '@/components/JsonLd';
import GoogleTagManager, { GoogleTagManagerNoScript, GoogleAnalytics, GTM_ID } from '@/components/GoogleTagManager';
import UtmProvider from '@/components/UtmProvider';
import WebVitalsReporter from '@/components/WebVitalsReporter';
import ComparisonDebugger from '@/components/ComparisonDebugger';

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
          </>
        )}
        {/* Mixpanel preconnects removed - analytics lazy loaded after consent */}
        <link rel="preconnect" href="https://nyc3.digitaloceanspaces.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://nyc3.digitaloceanspaces.com" />
      </head>
      <body suppressHydrationWarning className="font-sans">
        {/* Google Tag Manager - Initialized early in body to avoid blocking head, but still before main content */}
        <GoogleTagManager gtmId={GTM_ID} />
        
        {/* GA4 Direct Integration (works independently of GTM) */}
        <GoogleAnalytics />
        
        {/* Google Tag Manager (noscript) */}
        <GoogleTagManagerNoScript gtmId={GTM_ID} />
        
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <UtmProvider>
              <ClientBody>
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
      </body>
    </html>
  );
}

