import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';
import { RegionalDataTracker } from '@/components/seo-lp/RegionalDataTracker';
import { SeoPageAnalytics } from '@/components/seo-lp/SeoPageAnalytics';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { track } from '@/lib/analytics/lazy';
import Link from 'next/link';

interface SeoPageData {
  slug: string;
  city_name: string;
  state_abbr: string;
  metadata_cache: {
    solar_radiation?: number;
    estimated_roi?: number;
    avg_price_per_kw?: number;
    faq?: Array<{ question: string; answer: string }>;
  };
  category: {
    id: number;
    name: string;
    seo_url: string;
    description: string;
  };
}

async function getSeoPage(slug: string): Promise<SeoPageData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/v1/seo_pages/${slug}`, {
      next: { revalidate: 3600, tags: ['seo-pages'] }, // ISR: 1 hour
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch SEO page:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const data = await getSeoPage(params.slug);

  if (!data) return {};

  const title = `${data.category.name} em ${data.city_name} - ${data.state_abbr} | Avalia Solar`;
  const description = `Encontre as melhores opções de ${data.category.name.toLowerCase()} em ${data.city_name}. Economia estimada de até 90% na conta de luz. Veja avaliações e solicite orçamentos.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/solucoes/${data.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const data = await getSeoPage(params.slug);

  if (!data) {
    notFound();
  }

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Serviços de ${data.category.name} em ${data.city_name}`,
    description: data.category.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: data.city_name,
      addressRegion: data.state_abbr,
      addressCountry: 'BR',
    },
  };

  const faqLd = data.metadata_cache.faq ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.metadata_cache.faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null;

  return (
    <main className="container mx-auto px-4 py-8">
      <SeoPageAnalytics 
        slug={data.slug} 
        cityName={data.city_name} 
        categoryName={data.category.name} 
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          {data.category.name} em <span className="text-yellow-600">{data.city_name} - {data.state_abbr}</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Compare instaladores, veja preços e entenda o potencial solar da sua região.
        </p>
      </header>

      {/* Bloco de Dados Sociais/Regionais */}
      <section className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12 overflow-hidden">
        <RegionalDataTracker 
          location={data.city_name} 
          category={data.category.name} 
          estimatedPayback={data.metadata_cache.estimated_roi} 
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Irradiação Solar</span>
            <span className="text-3xl font-bold text-yellow-600 mt-2">
              {data.metadata_cache.solar_radiation || '--'} <small className="text-sm text-gray-400">kWh/m²</small>
            </span>
            <p className="mt-2 text-sm text-gray-500">Média anual em {data.city_name}</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Payback Estimado</span>
            <span className="text-3xl font-bold text-green-600 mt-2">
              {data.metadata_cache.estimated_roi || '--'} <small className="text-sm text-gray-400">anos</small>
            </span>
            <p className="mt-2 text-sm text-gray-500">Retorno do investimento</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Preço Médio</span>
            <span className="text-3xl font-bold text-blue-600 mt-2">
              R$ {data.metadata_cache.avg_price_per_kw || '--'} <small className="text-sm text-gray-400">/kWp</small>
            </span>
            <p className="mt-2 text-sm text-gray-500">Valor de mercado regional</p>
          </div>
        </div>
      </section>

      <section className="prose prose-lg max-w-none">
        <h2>Por que investir em {data.category.name.toLowerCase()} em {data.city_name}?</h2>
        <p>{data.category.description}</p>
        <p>
          A cidade de {data.city_name} apresenta excelentes condições para a geração de energia fotovoltaica. 
          Com uma irradiação de {data.metadata_cache.solar_radiation} kWh/m², o sistema se paga em média em {data.metadata_cache.estimated_roi} anos.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
          <CTAPrimaryButton 
            label="Solicitar Orçamento Grátis"
            companyId="0"
            companySlug="multi-vendor"
            className="w-full sm:w-auto px-12 h-14 text-lg"
          />
          <Link 
            href={`/categories/${data.category.seo_url}?city=${data.city_name}`}
            className="text-blue-600 font-semibold hover:underline"
          >
            Ver instaladores em {data.city_name}
          </Link>
        </div>
      </section>
    </main>
  );
}
