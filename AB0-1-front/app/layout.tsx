import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import ClientBody from '@/components/ClientBody';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import GoogleTagManager, { GoogleTagManagerNoScript, GTM_ID, GA_ID } from '@/components/GoogleTagManager';
import UtmProvider from '@/components/UtmProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  variable: '--font-sans',
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
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Google Tag Manager & GA4 */}
        <GoogleTagManager gtmId={GTM_ID} gaId={GA_ID} />
        <link rel="preconnect" href="https://api.avaliasolar.com.br" />
        <link rel="dns-prefetch" href="https://api.avaliasolar.com.br" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link
          rel="preload"
          as="image"
          href="/images/banner-landing-page-avalia-solar.jpg"
          imagesizes="100vw"
        />
      </head>
      <body suppressHydrationWarning className={inter.className}>
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
      </body>
    </html>
  );
}

