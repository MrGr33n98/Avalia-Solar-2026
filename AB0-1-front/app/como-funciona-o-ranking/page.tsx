import type { Metadata } from 'next';

import TrustPage from '@/components/seo/TrustPage';
import { TRUST_PAGES } from '@/lib/seo/trust-pages';
import { SITE, absoluteUrl } from '@/lib/site';

const page = TRUST_PAGES['como-funciona-o-ranking'];

export const metadata: Metadata = {
  title: `${page.title} | Avalia Solar`,
  description: page.description,
  alternates: { canonical: absoluteUrl('/como-funciona-o-ranking') },
  openGraph: {
    title: page.title,
    description: page.description,
    url: absoluteUrl('/como-funciona-o-ranking'),
    images: [SITE.ogImagePath],
  },
  twitter: {
    card: 'summary_large_image',
    title: page.title,
    description: page.description,
    images: [SITE.ogImagePath],
  },
};

export default function RankingPage() {
  return <TrustPage page={page} />;
}
