import type { Metadata } from 'next';
import FounderPageClient from './FounderPageClient';

export const metadata: Metadata = {
  title: 'Plano Founder Avalia Solar | Brand Page & Programa de Lançamento',
  description:
    'Conheça o Plano Founder Avalia Solar: dois meses gratuitos no lançamento, Brand Page empresarial verificada, catálogo de produtos, avaliações reais e contato direto.',
  alternates: {
    canonical: 'https://www.avaliasolar.com.br/founder',
  },
  openGraph: {
    title: 'Plano Founder Avalia Solar | Brand Page & Programa de Lançamento',
    description:
      'Posicione sua empresa de energia solar ou mobilidade com Brand Page verificada, avaliações reais de clientes e dois meses gratuitos de lançamento.',
    url: 'https://www.avaliasolar.com.br/founder',
    siteName: 'Avalia Solar',
    images: [
      {
        url: '/assets/founder-laptop.jpg',
        width: 1024,
        height: 768,
        alt: 'Showcase do Plano Founder Avalia Solar no notebook com a Brand Page da GoodWe Brasil',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plano Founder Avalia Solar | Brand Page & Programa de Lançamento',
    description:
      'Brand Page verificada, catálogo de produtos e dois meses gratuitos no programa de lançamento da Avalia Solar.',
    images: ['/assets/founder-laptop.jpg'],
  },
};

const founderSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Plano Founder Avalia Solar',
  description:
    'Programa de homologação e lançamento empresarial da Avalia Solar, incluindo Brand Page, catálogo técnico, avaliações reais e dois meses gratuitos.',
  brand: {
    '@type': 'Brand',
    name: 'Avalia Solar',
  },
  offers: {
    '@type': 'Offer',
    price: '0.00',
    priceCurrency: 'BRL',
    description: 'Dois meses gratuitos no programa de lançamento para empresas qualificadas',
    url: 'https://www.avaliasolar.com.br/founder',
    availability: 'https://schema.org/InStock',
    validFrom: '2026-01-01',
  },
};

export default function FounderPage() {
  return (
    <>
      <script
        id="founder-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderSchema) }}
      />
      <FounderPageClient />
    </>
  );
}
