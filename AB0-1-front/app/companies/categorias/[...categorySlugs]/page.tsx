import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import CompaniesPageClient from '@/app/companies/CompaniesPageClient';
import {
  buildCompaniesCategoriesPath,
  COMPANIES_PATH,
  toSearchParams,
} from '@/lib/seo/companies-category-url';
import {
  getCompaniesCategorySeoIndex,
  resolveCategoryIdsFromSegments,
  resolveCategoryNamesFromIds,
} from '@/lib/server/companies-category-seo';
import { shouldNoindexSearchParams } from '@/lib/seo/search-params';
import { absoluteUrl } from '@/lib/site';

interface CompaniesCategoryPageProps {
  params: { categorySlugs: string[] };
  searchParams?: Record<string, string | string[] | undefined>;
}

function buildCategoryMetadata(categoryNames: string[], canonicalPath: string, noindex = false): Metadata {
  const title = categoryNames.length > 0
    ? `Empresas de ${categoryNames.join(' e ')} | Avalia Solar`
    : 'Empresas de Energia Solar | Avalia Solar';

  const description = categoryNames.length > 0
    ? `Explore empresas de ${categoryNames.join(', ')} com filtros por localizacao, avaliacao e qualidade de atendimento.`
    : 'Explore empresas de energia solar com filtros por categoria, localizacao e reputacao.';

  const canonicalUrl = absoluteUrl(canonicalPath);

  return {
    title,
    description,
    keywords: [
      'empresas de energia solar',
      ...categoryNames,
      'instalacao solar',
      'fornecedores energia limpa',
    ],
    robots: noindex ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export async function generateMetadata({ params, searchParams }: CompaniesCategoryPageProps): Promise<Metadata> {
  const seoIndex = await getCompaniesCategorySeoIndex();
  const categoryIds = resolveCategoryIdsFromSegments(params.categorySlugs || [], seoIndex);
  const noindex = shouldNoindexSearchParams(searchParams);

  if (categoryIds.length === 0) {
    return buildCategoryMetadata([], COMPANIES_PATH, noindex);
  }

  const categoryNames = resolveCategoryNamesFromIds(categoryIds, seoIndex);
  const canonicalPath = buildCompaniesCategoriesPath(categoryIds, seoIndex.byId);

  return buildCategoryMetadata(categoryNames, canonicalPath, noindex);
}

export default async function CompaniesCategoryPage({ params, searchParams }: CompaniesCategoryPageProps) {
  const seoIndex = await getCompaniesCategorySeoIndex();
  const categoryIds = resolveCategoryIdsFromSegments(params.categorySlugs || [], seoIndex);

  if (categoryIds.length === 0) {
    permanentRedirect(COMPANIES_PATH);
  }

  const categoryNames = resolveCategoryNamesFromIds(categoryIds, seoIndex);
  const canonicalPath = buildCompaniesCategoriesPath(categoryIds, seoIndex.byId);
  const currentPath = `/companies/categorias/${(params.categorySlugs || []).join('/')}`;

  const normalizedSearchParams = toSearchParams(searchParams);
  const hadLegacyCategoryParam = normalizedSearchParams.has('category_ids');
  normalizedSearchParams.delete('category_ids');
  const queryString = normalizedSearchParams.toString();

  if (currentPath !== canonicalPath || hadLegacyCategoryParam) {
    const destination = `${canonicalPath}${queryString ? `?${queryString}` : ''}`;
    permanentRedirect(destination);
  }

  return (
    <CompaniesPageClient
      forcedCategoryIds={categoryIds}
      categoryNames={categoryNames}
      canonicalPath={canonicalPath}
    />
  );
}
