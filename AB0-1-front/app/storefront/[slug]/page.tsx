import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicStorefrontsApi, type PublicStorefrontResponse } from '@/lib/api-public';
import StorefrontClient from './StorefrontClient';

interface Props {
  params: { slug: string };
}

export const revalidate = 1800; // 30 minutos ISR

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const storefront = await publicStorefrontsApi.getBySlug(params.slug);

  if (!storefront?.data?.company) {
    return {
      title: 'Vitrine não encontrada | Avalia Solar',
    };
  }

  const { company, settings } = storefront.data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.avaliasolar.com.br';
  const canonicalUrl = `${siteUrl}/storefront/${params.slug}`;

  return {
    title: `${company.name} | Vitrine Solar & Catálogo`,
    description: settings.headline || `Conheça os produtos, marcas e projetos fotovoltaicos executados por ${company.name} no Avalia Solar.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${company.name} | Vitrine Solar`,
      description: settings.headline,
      url: canonicalUrl,
      type: 'website',
      images: company.logo_url ? [{ url: company.logo_url }] : [],
    },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const storefront = await publicStorefrontsApi.getBySlug(params.slug);

  if (!storefront?.data?.company) {
    notFound();
  }

  const { company, settings, projects, curated_products } = storefront.data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.avaliasolar.com.br';
  const canonicalUrl = `${siteUrl}/storefront/${params.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': canonicalUrl,
    name: company.name,
    description: settings.headline,
    image: company.logo_url || undefined,
    url: canonicalUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.headquarters.city,
      addressRegion: company.headquarters.state,
      addressCountry: 'BR',
    },
    ...(company.review_count > 0 && company.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: company.rating,
        reviewCount: company.review_count,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StorefrontClient
        company={company}
        settings={settings}
        projects={projects}
        curatedProducts={curated_products}
      />
    </>
  );
}

