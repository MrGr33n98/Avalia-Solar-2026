import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Busca | Avalia Solar',
  description:
    'Busque empresas, produtos, categorias e avaliações verificadas na plataforma Avalia Solar.',
  alternates: {
    canonical: absoluteUrl('/search'),
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Busca | Avalia Solar',
    description:
      'Busque empresas, produtos, categorias e avaliações verificadas na plataforma Avalia Solar.',
    url: absoluteUrl('/search'),
    type: 'website',
  },
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Busca', item: '/search' },
        ]}
      />
      {children}
    </>
  );
}
