import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import CompanyDetailClient from './CompanyDetailClient';
import { publicReviewsApi } from '@/lib/api-public';
import { loadCompanyProfile } from '@/lib/server/performance/loaders';
import type { Company, Review } from '@/lib/api';
import { buildCompanyLocalBusinessJsonLd, buildCompanyFaqJsonLd } from '@/lib/seo/company-jsonld';
import { buildGeoOtherMeta } from '@/lib/seo/geo-metadata';
import { buildCompanyPath } from '@/lib/slug';
import { absoluteUrl } from '@/lib/site';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

interface Props {
  params: { id: string }; // slug da empresa
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const company = await loadCompanyProfile(params.id);

    if (!company) {
      return {
        title: 'Empresa não encontrada | Avalia Solar',
      };
    }

    const canonicalPath = buildCompanyPath(company.slug, company.name, company.id);
    const canonicalUrl = absoluteUrl(canonicalPath);

    const locationLabel = [company.city, company.state].filter(Boolean).join(' - ');
    const seoTitle = company.seo_title || `${company.name} - Avaliações e Orçamento | Avalia Solar`;
    const fallbackDescription = [
      `Veja avaliações, telefone, endereço e solicite orçamento para ${company.name} no Avalia Solar.`,
      company.description,
    ].filter(Boolean).join(' ');
    const seoDescription = (company.seo_description || company.meta_description || fallbackDescription).slice(0, 160);
    const seoKeywords = company.seo_keywords || [
      'energia solar',
      company.name,
      'avaliação solar',
      'orçamento solar',
      locationLabel,
    ].filter(Boolean).join(', ');

    const geoMeta = buildGeoOtherMeta({
      city: company.city,
      state: company.state,
      latitude: company.latitude,
      longitude: company.longitude,
    });

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: seoKeywords,
      other: geoMeta,
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url: canonicalUrl,
        images: company.banner_url ? [{ url: company.banner_url }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: seoDescription,
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch {
    return {
      title: 'Empresa não encontrada | Avalia Solar',
    };
  }
}

// Enable ISR with 900s revalidation
export const revalidate = 900;

export default async function CompanyDetailPage({ params }: Props) {
  const company = await loadCompanyProfile(params.id);

  if (!company) {
    notFound();
  }

  const canonicalPath = buildCompanyPath(company.slug, company.name, company.id);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const canonicalSegment = canonicalPath.split('/').pop();
  if (canonicalSegment && params.id !== canonicalSegment) {
    permanentRedirect(canonicalPath);
  }

  // Start secondary data early, but do not await it before the primary hero.
  const reviewsPromise = publicReviewsApi.getAll(
    { company_id: company.id, limit: 6 },
    { revalidate: 600, tags: ['company-reviews', `company-${company.id}`] }
  );

  const faqJsonLd = buildCompanyFaqJsonLd({
    company,
    canonicalUrl,
  });

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Início', item: '/' },
          { name: 'Empresas', item: '/companies' },
          { name: company.name, item: canonicalPath },
        ]}
      />
      <Suspense fallback={null}>
        <CompanyReviewsJsonLd company={company} canonicalUrl={canonicalUrl} reviewsPromise={reviewsPromise} />
      </Suspense>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <CompanyDetailClient company={company} />
    </>
  );
}

/** Stream SEO review evidence independently of the interactive company hero. */
async function CompanyReviewsJsonLd({
  company,
  canonicalUrl,
  reviewsPromise,
}: {
  company: Company;
  canonicalUrl: string;
  reviewsPromise: Promise<Review[]>;
}) {
  const reviews = await reviewsPromise.catch(() => []);
  const data = buildCompanyLocalBusinessJsonLd({ company, reviews, canonicalUrl });
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
