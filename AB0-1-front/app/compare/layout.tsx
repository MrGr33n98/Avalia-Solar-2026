import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Comparador de empresas solares | Avalia Solar',
  description:
    'Compare empresas de energia solar lado a lado por reputação, verificação, cobertura e sinais de confiança.',
  alternates: {
    canonical: absoluteUrl('/compare'),
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Comparador de empresas solares | Avalia Solar',
    description:
      'Compare empresas de energia solar lado a lado por reputação, verificação, cobertura e sinais de confiança.',
    url: absoluteUrl('/compare'),
    type: 'website',
  },
};

export default function CompareLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Comparador', item: '/compare' },
        ]}
      />
      {children}
    </>
  );
}
