import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import CompanyDetailClient from './CompanyDetailClient';
import { publicCompaniesApi, publicReviewsApi } from '@/lib/api-public';
import { buildCompanyLocalBusinessJsonLd } from '@/lib/seo/company-jsonld';
import { buildCompanyPath } from '@/lib/slug';
import { absoluteUrl } from '@/lib/site';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

interface Props {
  params: { id: string }; // slug da empresa
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const company = await publicCompaniesApi.getById(params.id, {
      revalidate: 900,
      tags: ['company-profile', `company-${params.id}`],
    });

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

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: seoKeywords,
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
  const company = await publicCompaniesApi.getById(params.id, {
    revalidate: 900,
    tags: ['company-profile', `company-${params.id}`],
  });

  if (!company) {
    notFound();
  }

  const canonicalPath = buildCompanyPath(company.slug, company.name, company.id);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const canonicalSegment = canonicalPath.split('/').pop();
  if (canonicalSegment && params.id !== canonicalSegment) {
    permanentRedirect(canonicalPath);
  }

  const initialReviews = await publicReviewsApi.getAll(
    {
      company_id: company.id,
      limit: 6,
    },
    {
      revalidate: 600,
      tags: ['company-reviews', `company-${company.id}`],
    }
  );

  const jsonLd = buildCompanyLocalBusinessJsonLd({
    company,
    reviews: initialReviews,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={
        <div className="min-h-screen bg-slate-50">
          <div className="relative h-[250px] sm:h-[300px] w-full bg-slate-900 overflow-hidden">
            <div className="container mx-auto px-4 pt-24 pb-12 flex flex-col md:flex-row md:items-end gap-6">
              <div className="h-32 w-32 rounded-3xl bg-slate-800 animate-pulse shrink-0" />
              <div className="flex-1 space-y-4">
                <div className="h-10 w-2/3 bg-slate-800 animate-pulse rounded-lg" />
                <div className="h-5 w-1/3 bg-slate-800 animate-pulse rounded-lg" />
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-64 w-full bg-white rounded-3xl animate-pulse shadow-sm" />
              <div className="h-96 w-full bg-white rounded-3xl animate-pulse shadow-sm" />
            </div>
            <div className="space-y-6">
              <div className="h-48 w-full bg-white rounded-3xl animate-pulse shadow-sm" />
              <div className="h-64 w-full bg-white rounded-3xl animate-pulse shadow-sm" />
            </div>
          </div>
        </div>
      }>
        <CompanyDetailClient
          company={company}
          initialReviews={initialReviews || []}
          initialReviewsLoaded
        />
      </Suspense>
    </>
  );
}
