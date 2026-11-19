import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import CompanyDetailClient from './CompanyDetailClient';
import { getCompanyForInitialRender } from '@/lib/server/performance/company';
import { buildCompanyFaqJsonLd } from '@/lib/seo/company-jsonld';
import CompanyReviewsSection from './components/CompanyReviewsSection';
import { buildGeoOtherMeta } from '@/lib/seo/geo-metadata';
import { buildCompanyPath } from '@/lib/slug';
import { absoluteUrl } from '@/lib/site';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

interface Props {
  params: { id: string }; // slug da empresa
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const company = await getCompanyForInitialRender(params.id);

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
  const company = await getCompanyForInitialRender(params.id);

  if (!company) {
    notFound();
  }

  const canonicalPath = buildCompanyPath(company.slug, company.name, company.id);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const canonicalSegment = canonicalPath.split('/').pop();
  if (canonicalSegment && params.id !== canonicalSegment) {
    permanentRedirect(canonicalPath);
  }

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
        <CompanyReviewsSection company={company} canonicalUrl={canonicalUrl} />
      </Suspense>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <CompanyDetailClient company={company} />
    </>
  );
}

