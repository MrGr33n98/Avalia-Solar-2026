import type { Metadata } from 'next';

import TrustPage from '@/components/seo/TrustPage';
import { TRUST_PAGES } from '@/lib/seo/trust-pages';
import { SITE, absoluteUrl } from '@/lib/site';

const page = TRUST_PAGES['criterios-de-avaliacao'];

export const metadata: Metadata = {
  title: `${page.title} | Avalia Solar`,
  description: page.description,
  alternates: { canonical: absoluteUrl('/criterios-de-avaliacao') },
  openGraph: {
    title: page.title,
    description: page.description,
    url: absoluteUrl('/criterios-de-avaliacao'),
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: page.title,
    description: page.description,
    images: [SITE.ogImagePath],
  },
};

export default function CriteriosDeAvaliacaoPage() {
  return <TrustPage page={page} />;
}
