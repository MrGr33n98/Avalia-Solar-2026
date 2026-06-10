import type { Metadata } from 'next';
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
import { SITE, absoluteUrl } from '@/lib/site';

type SearchParams = Record<string, string | string[] | undefined>;

type LocalSolarPageInput = {
  state: string;
  city?: string | null;
  searchParams?: SearchParams;
};

const FILTER_KEYS = ['q', 'category_ids', 'featured', 'verified', 'min_rating', 'sort', 'page'] as const;

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

  return {
    q: firstParam(searchParams?.q),
    category_ids: categoryIds,
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

function CategoryLinks({ data, searchParams }: { data: LocalSolarPageResponse; searchParams?: SearchParams }) {
  const selected = selectedCategoryIds(data);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">Navegue por categoria</h2>
        <Link href="/categories" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
          Ver todas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {data.categories.map((category) => {
          const active = selected.includes(category.id);
          return (
            <Link
              key={category.id}
              href={`${data.location.canonical_path}${buildQuery(searchParams, { category_ids: active ? null : category.id, page: null })}`}
              className={`min-h-24 rounded-lg border bg-white p-3 text-center shadow-sm transition hover:border-blue-200 hover:shadow-md ${
                active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Building2 className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold leading-snug text-slate-800">{category.name}</p>
              <p className="mt-1 text-[11px] text-slate-500">{category.companies_count} empresas</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FilterSidebar({ data, searchParams }: { data: LocalSolarPageResponse; searchParams?: SearchParams }) {
  const selected = selectedCategoryIds(data);
  const minRating = String(data.filters.min_rating || '');
  const sort = data.filters.sort || 'recommended';

  return (
    <aside className="space-y-4">
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
            {data.categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="category_ids"
                  value={category.id}
                  defaultChecked={selected.includes(category.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                <span className="text-xs text-slate-400">{category.companies_count}</span>
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
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Reputação e avaliações reais</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Área de atendimento controlada</li>
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
        slotKey="local_directory_sidebar"
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
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-blue-700">Início</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/companies" className="hover:text-blue-700">Empresas</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-slate-900"><LocationLabel data={data} /></span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                <MapPin className="h-4 w-4" />
                Energia Solar em <LocationLabel data={data} />
              </div>
              <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Empresas de energia solar que atendem {locality}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                Compare reputação, serviços, localização, categorias e sinais de confiança. Em páginas de cidade,
                só entram empresas com vínculo explícito com a cidade.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-950">{data.stats.total_companies} empresas encontradas</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {data.stats.verified_companies} verificadas · {data.stats.featured_companies} em destaque
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-white p-2">
                  <Star className="mx-auto h-4 w-4 text-amber-500" />
                  <p className="mt-1 text-xs font-semibold text-slate-600">Ranking</p>
                </div>
                <div className="rounded-md bg-white p-2">
                  <MapPin className="mx-auto h-4 w-4 text-blue-600" />
                  <p className="mt-1 text-xs font-semibold text-slate-600">Local</p>
                </div>
                <div className="rounded-md bg-white p-2">
                  <ShieldCheck className="mx-auto h-4 w-4 text-emerald-600" />
                  <p className="mt-1 text-xs font-semibold text-slate-600">Confiança</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <BannerByLocation
          location="companies_top"
          limit={5}
          slotKey="local_directory_hero"
          categoryId={selectedCategoryIds(data)[0]}
          className="rounded-lg"
        />

        {data.categories.length > 0 && <CategoryLinks data={data} searchParams={input.searchParams} />}

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

        <section className="rounded-lg bg-gradient-to-r from-emerald-700 to-cyan-700 p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Economize comparando empresas qualificadas</h2>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50">
                Encontre instaladores e fornecedores que realmente atendem {locality}, com filtros por reputação e categoria.
              </p>
            </div>
            <Link
              href="/companies"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
            >
              Solicitar orçamento
            </Link>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section id="todas" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Todas as empresas</h2>
                <p className="text-sm text-slate-600">
                  {data.pagination.total} resultado(s) para os filtros atuais.
                </p>
              </div>
              <Link
                href={`${data.location.canonical_path}${buildQuery(input.searchParams, { page: null })}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Atualizar filtros
              </Link>
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

          <FilterSidebar data={data} searchParams={input.searchParams} />
        </div>

        <BannerByLocation
          location="companies_footer"
          limit={3}
          slotKey="local_directory_footer"
          categoryId={selectedCategoryIds(data)[0]}
          className="rounded-lg"
        />
      </div>
    </main>
  );
}
