import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
} from 'lucide-react';

import BannerByLocation from '@/components/BannerByLocation';
import CompanyCard from '@/components/CompanyCard';
import {
  localSolarPagesApi,
  type Company,
  type LocalSolarPageResponse,
} from '@/lib/api-client';
import { projectTypeVisualFor } from '@/lib/company-project-visuals';
import { SITE, absoluteUrl } from '@/lib/site';
import { CategoryCarousel } from './CategoryCarousel';

type SearchParams = Record<string, string | string[] | undefined>;

type LocalSolarPageInput = {
  state: string;
  city?: string | null;
  searchParams?: SearchParams;
};

const FILTER_KEYS = ['q', 'category_ids', 'project_types', 'featured', 'verified', 'min_rating', 'sort', 'page'] as const;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function allParams(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function buildApiFilters(searchParams?: SearchParams) {
  const categoryIds = allParams(searchParams?.category_ids)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  const projectTypes = allParams(searchParams?.project_types)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    q: firstParam(searchParams?.q),
    category_ids: categoryIds,
    project_types: projectTypes,
    featured: firstParam(searchParams?.featured),
    verified: firstParam(searchParams?.verified),
    min_rating: firstParam(searchParams?.min_rating),
    sort: firstParam(searchParams?.sort) || 'recommended',
    page: firstParam(searchParams?.page) || '1',
    per_page: '12',
  };
}

function buildQuery(searchParams: SearchParams | undefined, overrides: Record<string, string | number | null>) {
  const params = new URLSearchParams();

  FILTER_KEYS.forEach((key) => {
    allParams(searchParams?.[key]).forEach((value) => {
      if (value) params.append(key, value);
    });
  });

  Object.entries(overrides).forEach(([key, value]) => {
    params.delete(key);
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

function selectedCategoryIds(data: LocalSolarPageResponse): number[] {
  return Array.isArray(data.filters.category_ids) ? data.filters.category_ids : [];
}

function selectedProjectTypes(data: LocalSolarPageResponse): string[] {
  return Array.isArray(data.filters.project_types) ? data.filters.project_types : [];
}

function companyCountLabel(count: number) {
  return count === 1 ? '1 empresa' : `${count} empresas`;
}

async function getLocalData(input: LocalSolarPageInput) {
  return localSolarPagesApi.get(input.state, input.city, buildApiFilters(input.searchParams));
}

export async function generateLocalSolarMetadata(input: LocalSolarPageInput): Promise<Metadata> {
  const data = await localSolarPagesApi.get(input.state, input.city, { page: 1, per_page: 1 });

  if (!data) {
    return {
      title: 'Página local não encontrada | Avalia Solar',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: data.seo.title,
    description: data.seo.description,
    robots: data.seo.indexable ? undefined : { index: false, follow: true },
    alternates: {
      canonical: data.location.canonical_path,
    },
    openGraph: {
      title: data.seo.title,
      description: data.seo.description,
      url: absoluteUrl(data.location.canonical_path),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.seo.title,
      description: data.seo.description,
    },
  };
}

function jsonLdFor(data: LocalSolarPageResponse) {
  const pageUrl = absoluteUrl(data.location.canonical_path);
  const locality = data.location.scope === 'city'
    ? `${data.location.city}/${data.location.state}`
    : data.location.state_name;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: data.seo.title,
      description: data.seo.description,
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
        { '@type': 'ListItem', position: 4, name: locality, item: pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Empresas que atendem ${locality}`,
      numberOfItems: data.companies.length,
      itemListElement: data.companies.map((company, index) => ({
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

function LocationLabel({ data }: { data: LocalSolarPageResponse }) {
  if (data.location.scope === 'city') {
    return <>{data.location.city}/{data.location.state}</>;
  }

  return <>{data.location.state_name}</>;
}

function FilterSidebar({ data, searchParams, input }: { data: LocalSolarPageResponse; searchParams?: SearchParams; input: LocalSolarPageInput }) {
  const selected = selectedProjectTypes(data);
  const projectTypes = data.project_types || [];
  const minRating = String(data.filters.min_rating || '');
  const sort = data.filters.sort || 'recommended';

  return (
    <aside className="space-y-6">
      <form action={data.location.canonical_path} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-700" />
          <h2 className="font-bold text-slate-950">Filtrar empresas</h2>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="local-q">
          Buscar
        </label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="local-q"
            name="q"
            defaultValue={data.filters.q || ''}
            placeholder="Nome ou serviço"
            className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categorias</p>
          <div className="max-h-48 space-y-2 overflow-auto pr-1">
            {projectTypes.map((projectType) => (
              <label key={projectType.name} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="project_types"
                  value={projectType.name}
                  defaultChecked={selected.includes(projectType.name)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                <span className="min-w-0 flex-1 truncate">{projectType.name}</span>
                <span className="text-xs text-slate-400">{projectType.companies_count}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="verified"
              value="true"
              defaultChecked={String(data.filters.verified) === 'true'}
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
            Verificadas
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={String(data.filters.featured) === 'true'}
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
            Destaques
          </label>
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="local-rating">
          Nota mínima
        </label>
        <select
          id="local-rating"
          name="min_rating"
          defaultValue={minRating}
          className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todas</option>
          <option value="4.5">4.5+</option>
          <option value="4">4.0+</option>
          <option value="3.5">3.5+</option>
        </select>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="local-sort">
          Ordenar por
        </label>
        <select
          id="local-sort"
          name="sort"
          defaultValue={sort}
          className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="recommended">Mais relevantes</option>
          <option value="rating_desc">Melhor avaliação</option>
          <option value="reviews_desc">Mais avaliações</option>
          <option value="name_asc">Nome A-Z</option>
          <option value="newest">Mais recentes</option>
        </select>

        <button
          type="submit"
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrar
        </button>
        <Link
          href={data.location.canonical_path}
          className="mt-3 block text-center text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          Limpar filtros
        </Link>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-950">Seja encontrado</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Cadastre sua empresa para aparecer em buscas locais qualificadas.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Destaque para clientes da região</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Destaque por cidade e categoria</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Leads qualificados e visibilidade local</li>
        </ul>
        <Link
          href="/register"
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-violet-700 px-4 text-sm font-bold text-white transition hover:bg-violet-800"
        >
          Cadastrar minha empresa
        </Link>
      </div>

      {data.nearby_locations.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">Cidades próximas</h2>
          <div className="mt-3 space-y-2">
            {data.nearby_locations.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700"
              >
                <span>{item.city}/{item.state}</span>
                <span className="text-xs text-slate-400">{item.companies_count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <BannerByLocation
        location="companies_right_rail"
        limit={1}
        state={input.state}
        city={input.city || undefined}
        className="rounded-lg"
      />
    </aside>
  );
}

function Pagination({ data, searchParams }: { data: LocalSolarPageResponse; searchParams?: SearchParams }) {
  const { pagination } = data;
  if (pagination.total_pages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
      <Link
        aria-disabled={pagination.first_page}
        href={`${data.location.canonical_path}${buildQuery(searchParams, { page: pagination.prev_page || 1 })}`}
        className={`inline-flex h-10 items-center gap-1 rounded-lg border px-4 text-sm font-semibold ${
          pagination.first_page ? 'pointer-events-none border-slate-200 text-slate-300' : 'border-slate-200 text-slate-700 hover:border-blue-200 hover:text-blue-700'
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Link>
      <span className="text-sm text-slate-500">
        Página {pagination.page} de {pagination.total_pages}
      </span>
      <Link
        aria-disabled={pagination.last_page}
        href={`${data.location.canonical_path}${buildQuery(searchParams, { page: pagination.next_page || pagination.total_pages })}`}
        className={`inline-flex h-10 items-center gap-1 rounded-lg border px-4 text-sm font-semibold ${
          pagination.last_page ? 'pointer-events-none border-slate-200 text-slate-300' : 'border-slate-200 text-slate-700 hover:border-blue-200 hover:text-blue-700'
        }`}
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function CompanyGrid({ companies }: { companies: Company[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {companies.map((company, index) => (
        <CompanyCard
          key={company.id}
          company={company}
          rank={index + 1}
          schemaEnabled={false}
        />
      ))}
    </div>
  );
}

export async function LocalSolarDirectoryPage(input: LocalSolarPageInput) {
  const data = await getLocalData(input);
  if (!data) notFound();

  const jsonLd = jsonLdFor(data);
  const locality = data.location.scope === 'city'
    ? `${data.location.city}/${data.location.state}`
    : data.location.state_name;
  const topProjectTypes = (data.project_types || []).filter((item) => item.companies_count > 0).slice(0, 3);
  const locationTitle = data.location.scope === 'city'
    ? data.location.city
    : data.location.state_name;

  return (
    <main className="min-h-screen bg-slate-50">
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-700">Início</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/companies" className="hover:text-blue-700">Empresas</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-slate-900"><LocationLabel data={data} /></span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0">
            <FilterSidebar data={data} searchParams={input.searchParams} input={input} />
          </div>

          <div className="flex-1 min-w-0 space-y-8">
            <div className="grid gap-8 xl:grid-cols-[1fr_400px] xl:items-center">
              <div>
                <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Encontre empresas de energia solar em {locality}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  Compare integradores, avaliações, categorias, serviços oferecidos e solicite orçamento com empresas que atendem sua região.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#todas"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Solicitar orçamento
                  </Link>
                  <Link
                    href="#todas"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                  >
                    <Building2 className="h-4 w-4" />
                    Comparar empresas
                  </Link>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-sky-50 to-blue-100 shadow-sm">
                <div className="grid gap-5 p-5 sm:grid-cols-[1fr_220px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-700" />
                      <p className="text-xl font-bold text-slate-950">{locationTitle}/{data.location.state}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {data.stats.total_companies} empresas encontradas<br />
                      {data.stats.verified_companies} verificadas · {data.stats.featured_companies} em destaque
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-white/85 p-3 shadow-sm">
                        <Star className="mx-auto h-5 w-5 text-amber-500" />
                        <p className="mt-1 text-xs font-semibold text-slate-700">Ranking</p>
                      </div>
                      <div className="rounded-lg bg-white/85 p-3 shadow-sm">
                        <Building2 className="mx-auto h-5 w-5 text-blue-600" />
                        <p className="mt-1 text-xs font-semibold text-slate-700">Local</p>
                      </div>
                      <div className="rounded-lg bg-white/85 p-3 shadow-sm">
                        <ShieldCheck className="mx-auto h-5 w-5 text-emerald-600" />
                        <p className="mt-1 text-xs font-semibold text-slate-700">Verificadas</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden min-h-44 items-center justify-center gap-3 rounded-xl bg-white/40 p-4 sm:flex">
                    {topProjectTypes.map((projectType) => {
                      const { iconSrc } = projectTypeVisualFor(projectType.name);
                      return iconSrc ? (
                        <div key={projectType.name} className="relative h-16 w-16 rounded-xl bg-white shadow-sm">
                          <Image src={iconSrc} alt={projectType.name} fill sizes="64px" className="object-contain p-2" unoptimized />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>

            {(data.project_types || []).length > 0 && <CategoryCarousel data={data} searchParams={input.searchParams} />}

            <BannerByLocation
              location="companies_top"
              limit={5}
              categoryId={selectedCategoryIds(data)[0]}
              state={input.state}
              city={input.city || undefined}
              className="rounded-lg"
            />

            {data.featured_companies.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-950">Empresas em destaque</h2>
                  <Link href="#todas" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                    Ver todas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <CompanyGrid companies={data.featured_companies} />
              </section>
            )}

            <section id="todas" className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Todas as empresas</h2>
                  <p className="text-sm text-slate-600">
                    {data.pagination.total} resultado(s) para os filtros atuais.
                  </p>
                </div>
              </div>

              {data.companies.length > 0 ? (
                <>
                  <CompanyGrid companies={data.companies} />
                  <Pagination data={data} searchParams={input.searchParams} />
                </>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                  <p className="text-lg font-semibold text-slate-950">Nenhuma empresa encontrada com estes filtros.</p>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Ajuste categorias, nota mínima ou busca por nome para ver outras opções em {locality}.
                  </p>
                  <Link
                    href={data.location.canonical_path}
                    className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Limpar filtros
                  </Link>
                </div>
              )}
            </section>

            <section className="rounded-lg bg-gradient-to-r from-emerald-700 to-cyan-700 p-6 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Compare empresas e receba orçamentos grátis</h2>
                  <p className="mt-2 max-w-2xl text-sm text-emerald-50">
                    É rápido, gratuito e ajuda você a economizar tempo ao encontrar empresas que atendem {locality}.
                  </p>
                </div>
                <Link
                  href="#todas"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
                >
                  Solicitar orçamento grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.2fr_1fr]">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Energia solar em {locality}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {locationTitle} conta com empresas especializadas em energia solar residencial, comercial,
                  industrial, condomínios, sistemas off-grid e mobilidade elétrica. No Avalia Solar, você compara
                  integradores, verifica serviços oferecidos e solicita contato com empresas que atendem sua região.
                </p>
              </div>
              {data.categories.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-slate-950">Categorias mais buscadas</h2>
                  <div className="mt-3 grid gap-2 text-sm">
                    {data.categories.slice(0, 5).map((category) => (
                      <Link
                        key={category.id}
                        href={`${data.location.canonical_path}${buildQuery(input.searchParams, { category_ids: category.id, page: null })}`}
                        className="font-medium text-blue-700 hover:text-blue-800"
                      >
                        {category.name} em {locality}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <BannerByLocation
              location="companies_footer"
              limit={3}
              categoryId={selectedCategoryIds(data)[0]}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
