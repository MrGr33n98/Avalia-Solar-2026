import type { Metadata } from 'next';
import { cache } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import { companiesApiSafe } from '@/lib/api-client';
import { buildCompanyPath, buildProductPath } from '@/lib/slug';
import { CompanyLogo } from '@/components/CompanyLogo';
import CatalogClient from './CatalogClient';

interface Props {
  params: { id: string; categorySlug: string };
}

const loadCatalog = cache(async (companySlug: string, categorySlug: string) => {
  const company = await companiesApiSafe.getById(companySlug);
  return company ? companiesApiSafe.getCatalog(company.id, categorySlug) : null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let catalog;
  try {
    catalog = await loadCatalog(params.id, params.categorySlug);
  } catch {
    return {
      title: 'Catálogo temporariamente indisponível | Avalia Solar',
      robots: { index: false, follow: true },
    };
  }
  if (!catalog) return { title: 'Catálogo não encontrado | Avalia Solar' };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.avaliasolar.com.br';
  const path = `${buildCompanyPath(catalog.company.slug, catalog.company.name, catalog.company.id)}/categories/${catalog.category.seo_url}`;
  const description = `${catalog.category.name} da ${catalog.company.name}: produtos e serviços disponíveis no catálogo Avalia Solar.`;
  return {
    title: `${catalog.category.name} da ${catalog.company.name} | Avalia Solar`,
    description,
    alternates: { canonical: `${siteUrl}${path}` },
    openGraph: {
      title: `${catalog.category.name} — ${catalog.company.name}`,
      description,
      url: `${siteUrl}${path}`,
    },
  };
}

export const revalidate = 900;

export default async function CompanyCategoryCatalogPage({ params }: Props) {
  const catalog = await loadCatalog(params.id, params.categorySlug);
  if (!catalog) notFound();
  const companyPath = buildCompanyPath(
    catalog.company.slug,
    catalog.company.name,
    catalog.company.id
  );
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${catalog.category.name} — ${catalog.company.name}`,
    itemListElement: catalog.products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: buildProductPath(product.id, product.name),
      name: product.name,
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6">
        <nav className="mb-5 text-sm text-slate-600" aria-label="Breadcrumb">
          <Link href={companyPath} className="hover:text-blue-700">
            {catalog.company.name}
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{catalog.category.name}</span>
        </nav>
        <header className="border border-slate-300 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <CompanyLogo
              logoUrl={catalog.company.logo_url}
              name={catalog.company.name}
              size="lg"
              className="h-16 w-16 rounded-[2px]"
              badges={catalog.company.badges}
            />
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F4B]">{catalog.company.name}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {Number(catalog.company.rating_avg || 0).toFixed(1)}
                </span>
                {catalog.company.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {catalog.company.city}, {catalog.company.state}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href={companyPath}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[2px] border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:mt-0"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para a empresa
          </Link>
        </header>
        <section className="border-x border-b border-slate-300 bg-white px-5 py-8 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Produtos e serviços
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0B1F4B]">
            {catalog.category.name}
          </h2>
          {(catalog.category.short_description || catalog.category.description) && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
              {catalog.category.short_description || catalog.category.description}
            </p>
          )}
        </section>
        <div className="mt-8">
          <CatalogClient catalog={catalog} />
        </div>
      </div>
    </main>
  );
}
