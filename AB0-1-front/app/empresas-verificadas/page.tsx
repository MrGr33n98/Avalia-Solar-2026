import type { Metadata } from 'next';

import TrustPage from '@/components/seo/TrustPage';
import { TRUST_PAGES } from '@/lib/seo/trust-pages';
import { SITE, absoluteUrl } from '@/lib/site';

const page = TRUST_PAGES['empresas-verificadas'];

export const metadata: Metadata = {
  title: `${page.title} | Avalia Solar`,
  description: page.description,
  alternates: { canonical: absoluteUrl('/empresas-verificadas') },
  openGraph: {
    title: page.title,
    description: page.description,
    url: absoluteUrl('/empresas-verificadas'),
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: page.title,
    description: page.description,
    images: [SITE.ogImagePath],
  },
};

export default function EmpresasVerificadasPage() {
  return <TrustPage page={page} />;
}
