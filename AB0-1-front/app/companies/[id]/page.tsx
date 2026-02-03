// app/companies/[id]/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import CompanyDetailClient from './CompanyDetailClient';
import { companiesApiSafe } from '@/lib/api-client';
import { buildCompanyPath } from '@/lib/slug';

interface Props {
  params: { id: string }; // slug da empresa
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Log the ID being requested
    console.log('Fetching company with slug:', params.id);
    const company = await companiesApiSafe.getById(params.id);

    if (!company) {
      console.log('Company not found for slug:', params.id);
      return {
        title: 'Empresa não encontrada | Avalia Solar',
      };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const canonicalPath = buildCompanyPath(company.slug, company.name, company.id);
    const canonicalUrl = `${siteUrl}${canonicalPath}`;

    return {
      title: `${company.name} | Avalia Solar`,
      description: `${company.description || ''} - Localizada em ${company.address || 'Endereço não informado'}. Telefone: ${company.phone || 'N/A'}`,
      openGraph: {
        title: `${company.name} - Empresa de Energia Solar`,
        description: `${company.description || ''} - Localizada em ${company.address || 'Endereço não informado'}. Telefone: ${company.phone || 'N/A'}`,
        url: canonicalUrl,
        images: company.banner_url ? [{ url: company.banner_url }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${company.name} | Avalia Solar`,
        description: company.description || '',
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    console.error('Erro no generateMetadata:', error);
    return {
      title: 'Empresa não encontrada | Avalia Solar',
    };
  }
}

// Force no cache for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompanyDetailPage({ params }: Props) {
  // Log the ID being requested
  console.log('[CompanyDetailPage] Loading company with slug:', params.id);

  console.log('[CompanyDetailPage] Fetching company from API...');
  const company = await companiesApiSafe.getById(params.id);

  if (!company) {
    console.log('[CompanyDetailPage] Company not found for slug:', params.id);
    notFound();
  }

  const canonicalPath = buildCompanyPath(company.slug, company.name, company.id);
  const canonicalSegment = canonicalPath.split('/').pop();
  if (canonicalSegment && params.id !== canonicalSegment) {
    permanentRedirect(canonicalPath);
  }

  console.log('[CompanyDetailPage] Company data loaded:', {
    id: company.id,
    name: company.name,
    banner_url: company.banner_url,
    logo_url: company.logo_url
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://avaliasolar.com.br/companies/${company.slug}`,
    name: company.name,
    description: company.description || undefined,
    url: company.website || `https://avaliasolar.com.br/companies/${company.slug}`,
    telephone: company.phone || undefined,
    logo: company.logo_url || undefined,
    image: company.banner_url || company.logo_url || undefined,
    priceRange: '$$',
    address: company.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: company.address,
          addressLocality: company.city || undefined,
          addressRegion: company.state || undefined,
          addressCountry: 'BR',
        }
      : undefined,
    geo: (company.latitude && company.longitude) ? {
      '@type': 'GeoCoordinates',
      latitude: company.latitude,
      longitude: company.longitude
    } : undefined,
    aggregateRating: company.rating_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: company.rating_avg,
      reviewCount: company.rating_count,
      bestRating: '5',
      worstRating: '1'
    } : undefined,
    openingHoursSpecification: company.working_hours ? {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
      ],
      opens: '08:00',
      closes: '18:00'
    } : undefined,
    sameAs: [
      company.instagram,
      company.facebook,
      company.linkedin
    ].filter(Boolean)
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando detalhes da empresa...</div>}>
        <CompanyDetailClient company={company} />
      </Suspense>
    </>
  );
}
