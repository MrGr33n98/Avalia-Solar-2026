import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin, ShieldCheck } from 'lucide-react';

import CompanyCard from '@/components/CompanyCard';
import { companiesApiSafe, fetchApiSafe, type Company } from '@/lib/api-client';
import { SITE, absoluteUrl } from '@/lib/site';
import {
  BRAZIL_CAPITAL_SOLAR_PAGES,
  buildLocalSeoPageSlug,
  buildLocalSolarUrl,
  resolveCapitalLocalSolarPage,
  type LocalSolarPage,
} from '@/lib/locations/local-page-slugs';

export const revalidate = 300;

type LocalPageParams = {
  state: string;
  city: string;
};

type LocalSeoPageResponse = {
  slug: string;
  city_name: string;
  state_abbr: string;
  local_solar_path?: string;
  metadata_cache?: Record<string, unknown>;
  category?: {
    id: number;
    name: string;
    seo_url?: string;
    description?: string;
  };
};

type PageProps = {
  params: LocalPageParams;
};

async function getAdminSeoPage(state: string, citySlug: string): Promise<LocalSeoPageResponse | null> {
  const seoSlug = buildLocalSeoPageSlug(state, citySlug);

  try {
    return await fetchApiSafe<LocalSeoPageResponse>(`seo_pages/${encodeURIComponent(seoSlug)}`, {
      cacheTtlMs: 300_000,
      retries: 1,
    });
  } catch {
    return null;
  }
}

async function resolveLocalPage(params: LocalPageParams): Promise<LocalSolarPage | null> {
  const state = params.state.toUpperCase();
  const citySlug = params.city.toLowerCase();
  const adminPage = await getAdminSeoPage(state, citySlug);

  if (adminPage?.city_name && adminPage?.state_abbr) {
    return {
      state: adminPage.state_abbr.toUpperCase(),
      city: adminPage.city_name,
      citySlug,
      href: adminPage.local_solar_path || buildLocalSolarUrl(adminPage.state_abbr, adminPage.city_name),
      seoSlug: adminPage.slug,
    };
  }

  return resolveCapitalLocalSolarPage(state, citySlug);
}

async function getLocalCompanies(page: LocalSolarPage): Promise<Company[]> {
  const response = await companiesApiSafe.getAllPaginated({
    status: 'active',
    serves_state: page.state,
    serves_city: page.city,
    sort: 'recommended',
    page: 1,
    per_page: 12,
    fields: 'card',
  });

  return response.data;
}

async function getLocalCompanyCount(page: LocalSolarPage): Promise<number> {
  const total = await companiesApiSafe.getTotalCount({
    status: 'active',
    serves_state: page.state,
    serves_city: page.city,
    fields: 'card',
  });

  return total ?? 0;
}

export function generateStaticParams(): LocalPageParams[] {
  return BRAZIL_CAPITAL_SOLAR_PAGES.map((page) => ({
    state: page.state.toLowerCase(),
    city: page.citySlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await resolveLocalPage(params);

  if (!page) {
    return {
      title: 'Página local não encontrada | Avalia Solar',
      robots: { index: false, follow: false },
    };
  }

  const title = `Empresas de energia solar em ${page.city}/${page.state} | Avalia Solar`;
  const description = `Compare empresas de energia solar que atendem ${page.city}/${page.state}. Veja reputação, localização, serviços e canais oficiais no Avalia Solar.`;
  const totalCompanies = await getLocalCompanyCount(page);

  return {
    title,
    description,
    robots: totalCompanies > 0 ? undefined : { index: false, follow: true },
    alternates: {
      canonical: page.href,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(page.href),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

function jsonLdFor(page: LocalSolarPage, companies: Company[]) {
  const pageUrl = absoluteUrl(page.href);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Empresas de energia solar em ${page.city}/${page.state}`,
      url: pageUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE.name,
        url: SITE.url,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: 'Empresas', item: absoluteUrl('/companies') },
        { '@type': 'ListItem', position: 3, name: 'Energia Solar', item: absoluteUrl('/companies') },
        { '@type': 'ListItem', position: 4, name: `${page.city}/${page.state}`, item: pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Empresas que atendem ${page.city}/${page.state}`,
      itemListElement: companies.map((company, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LocalBusiness',
          name: company.name,
          url: absoluteUrl(`/companies/${company.slug || company.id}`),
          address: {
            '@type': 'PostalAddress',
            addressLocality: company.city,
            addressRegion: company.state,
            addressCountry: 'BR',
          },
        },
      })),
    },
  ];
}

export default async function LocalSolarCompaniesPage({ params }: PageProps) {
  const page = await resolveLocalPage(params);
  if (!page) notFound();

  const companies = await getLocalCompanies(page);

  const jsonLd = jsonLdFor(page, companies);

  return (
    <main className="min-h-screen bg-slate-50">
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-700">Início</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/companies" className="hover:text-blue-700">Empresas</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-slate-900">{page.city}/{page.state}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <MapPin className="h-4 w-4" />
                Energia Solar em {page.city}/{page.state}
              </div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Empresas de energia solar que atendem {page.city}/{page.state}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                Compare empresas cadastradas no Avalia Solar por reputação, serviços, localização e canais oficiais.
                A lista usa a cidade principal e a área de abrangência informada pelas empresas.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-950">{companies.length} empresa(s) encontrada(s)</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Priorização por destaque, avaliações e dados cadastrados no marketplace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {companies.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company, index) => (
              <CompanyCard
                key={company.id}
                company={company}
                rank={index + 1}
                schemaEnabled={false}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-slate-950">
              Ainda não há empresas qualificadas para {page.city}/{page.state}.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Esta página fica disponível para expansão local, mas não entra no sitemap enquanto não houver empresas ativas atendendo a região.
            </p>
            <Link
              href="/companies"
              className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Ver empresas no Brasil
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
