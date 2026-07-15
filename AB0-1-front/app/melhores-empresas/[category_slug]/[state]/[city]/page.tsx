import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCategoryBySlug, categoriesApi } from '@/lib/api';
import CategoryClientComponent from '@/app/categories/[slug]/CategoryClientComponent';

interface LocalRankingPageProps {
  params: { category_slug: string; state: string; city: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

// Transformação de slug para nome de cidade (básico)
function unslugify(slug: string) {
  return decodeURIComponent(slug).split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export async function generateMetadata({ params }: LocalRankingPageProps): Promise<Metadata> {
  try {
    const category = await fetchCategoryBySlug(params.category_slug);
    const cityName = unslugify(params.city);
    const stateName = params.state.toUpperCase();
    
    if (!category) {
      return { title: 'Página não encontrada' };
    }

    // Busca rápida para melhorar a description
    const companiesResponse = await categoriesApi.getCompaniesPaginated(category.id, {
      status: 'active', state: stateName, city: cityName, per_page: 3
    });
    const topNames = companiesResponse?.companies?.slice(0,3).map(c => c.name).join(', ');

    const title = `Top 3 Melhores Empresas de ${category.name} em ${cityName}, ${stateName} - 2026`;
    const description = topNames 
      ? `Ranking 2026: Confira as melhores empresas de ${category.name} em ${cityName} (${stateName}). Destaque para ${topNames}. Peça orçamentos grátis.`
      : `Confira o ranking das melhores empresas de ${category.name} em ${cityName} (${stateName}). Veja avaliações reais, peça orçamentos e descubra os especialistas da região.`;
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://avaliasolar.com.br';
    const canonicalUrl = `${siteUrl}/melhores-empresas/${category.seo_url || params.category_slug}/${params.state.toLowerCase()}/${params.city.toLowerCase()}`;

    const totalCount = companiesResponse?.meta?.total_count || companiesResponse?.companies?.length || 0;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      robots: totalCount >= 3 ? { index: true, follow: true } : { index: false, follow: true },
      openGraph: {
        title,
        description,
        type: 'website',
      },
    };
  } catch (error) {
    return { title: 'Avalia Solar' };
  }
}

export default async function LocalRankingPage({ params, searchParams }: LocalRankingPageProps) {
  try {
    const category = await fetchCategoryBySlug(params.category_slug);
    const cityName = unslugify(params.city);
    const stateName = params.state.toUpperCase();

    // Filtros forçados para a cidade
    const filters = {
      status: 'active',
      state: stateName,
      city: cityName,
      page: 1,
      per_page: 20,
    };

    const companiesResponse = await categoriesApi.getCompaniesPaginated(category.id, filters);
    const companies = companiesResponse?.companies || [];
    const paginationMeta = companiesResponse?.meta || null;

    if (companies.length === 0) {
      notFound();
    }

    const getCategorySchemaType = (slug: string): string => {
      const s = slug.toLowerCase();
      if (s.includes('solar') || s.includes('painel') || s.includes('inversor')) {
        return 'SolarEnergySystemInstaller';
      }
      return 'LocalBusiness';
    };

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': `Melhores Empresas de ${category.name} em ${cityName}, ${stateName}`,
      'description': `Lista das melhores empresas e instaladores de ${category.name} que atendem na região de ${cityName} - ${stateName}.`,
      'url': `https://www.avaliasolar.com.br/melhores-empresas/${category.seo_url}/${params.state.toLowerCase()}/${params.city.toLowerCase()}`,
      'numberOfItems': companies.length,
      'itemListElement': companies.map((company, index) => {
        const schemaType = getCategorySchemaType(category.seo_url || params.category_slug);
        return {
          '@type': 'ListItem',
          'position': index + 1,
          'item': {
            '@type': schemaType,
            '@id': `https://www.avaliasolar.com.br/companies/${company.slug}`,
            'name': company.name,
            'image': company.logo_url || 'https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.svg',
            'url': `https://www.avaliasolar.com.br/companies/${company.slug}`,
            'telephone': company.phone || undefined,
            'address': {
              '@type': 'PostalAddress',
              'addressLocality': company.city || cityName,
              'addressRegion': company.state || stateName,
              'addressCountry': 'BR'
            },
            ...(company.rating_avg && company.rating_count ? {
              'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': company.rating_avg,
                'reviewCount': company.rating_count,
                'bestRating': '5',
                'worstRating': '1'
              }
            } : {})
          }
        };
      })
    };

    return (
      <div className="relative">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* US12: SEO Copywriting Section */}
        <div className="bg-slate-900 text-white py-12 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
          <div className="container mx-auto max-w-4xl relative z-10 text-center space-y-4">
            <span className="text-amber-400 font-bold tracking-widest text-xs uppercase">Ranking Exclusivo 2026</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              As Melhores Empresas de <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                {category.name} em {cityName}
              </span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto md:text-lg">
              {companies.length > 0 ? (
                <>
                  Analisamos <strong>{paginationMeta?.total || companies.length} fornecedores</strong> em {cityName} - {stateName} e criamos um ranking baseado em avaliações reais, qualidade de instalação e atendimento. Compare e escolha com segurança.
                </>
              ) : (
                <>
                  Buscando instaladores locais de <strong>{category.name}</strong> em {cityName} - {stateName}? Solicite um orçamento grátis e nossa equipe conectará você com os melhores profissionais certificados que atendem a sua região.
                </>
              )}
            </p>
            {companies.length > 0 && (
              <p className="text-sm text-slate-400 max-w-xl mx-auto italic">
                Destaque especial para as líderes locais: {companies.slice(0, 3).map(c => c.name).join(', ')}.
              </p>
            )}
          </div>
        </div>

        <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Carregando empresas...</div>}>
          {/* Reusa o Client Component da categoria, mas injetando os dados da cidade */}
          <CategoryClientComponent
            initialCategory={category}
            initialCompanies={companies}
            initialBanners={[]}
            paginationMeta={paginationMeta}
            titleTag="h2"
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
