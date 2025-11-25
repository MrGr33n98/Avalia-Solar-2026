import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import ClientBody from '@/components/ClientBody';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // This helps with font loading
});

export const metadata: Metadata = {
  title: 'Compare Solar - Marketplace de Energia Solar',
  description: 'O maior marketplace de energia solar do Brasil. Compare empresas, produtos e encontre a melhor solução para sua casa ou empresa.',
  keywords: 'energia solar, painéis solares, instalação solar, empresas solares, comparação, marketplace, energia renovável, sustentabilidade, economia de energia',
  authors: [{ name: 'Compare Solar' }],
  creator: 'Compare Solar',
  publisher: 'Compare Solar',
  metadataBase: new URL('https://www.comparesolar.com.br'),
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
    siteName: 'Compare Solar',
    title: 'Compare Solar - Marketplace de Energia Solar',
    description: 'O maior marketplace de energia solar do Brasil. Compare empresas, produtos e encontre a melhor solução.',
    images: [
      {
        url: '/images/category-placeholder.jpg', // ✅ sua imagem local
        width: 1200,
        height: 630,
        alt: 'Avalia - Marketplace de Energia Solar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avalia - Marketplace de Energia Solar',
    description: 'O maior marketplace de energia solar do Brasil. Compare empresas, produtos e encontre a melhor solução.',
    images: ['/images/category-placeholder.jpg'], // ✅ mesma imagem no Twitter
    creator: '@comparesolar',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.className} light`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientBody>
          <Navbar />
          {children}
          <Footer />
        </ClientBody>
      </body>
    </html>
  );
}
