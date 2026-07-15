import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import CompaniesPageClient from './CompaniesPageClient';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import {
  buildCompaniesCategoriesPath,
  COMPANIES_PATH,
  normalizeCategoryIds,
  toSearchParams,
} from '@/lib/seo/companies-category-url';
import { shouldNoindexSearchParams } from '@/lib/seo/search-params';
import { getCompaniesCategorySeoIndex, resolveCategoryNamesFromIds } from '@/lib/server/companies-category-seo';
import { absoluteUrl } from '@/lib/site';

interface CompaniesPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const DEFAULT_TITLE = 'Empresas de Energia Solar no Brasil | Avalia Solar';
const DEFAULT_DESCRIPTION =
  'Encontre empresas de energia solar avaliadas em todo o Brasil. Compare reputacao, servicos e localizacao para contratar com mais seguranca.';

export const revalidate = 300;

function buildCompaniesMetadata(categoryNames: string[], canonicalPath: string, noindex = false): Metadata {
  const hasCategories = categoryNames.length > 0;
  const title = hasCategories
    ? `Empresas de ${categoryNames.join(' e ')} | Avalia Solar`
    : DEFAULT_TITLE;

  const description = hasCategories
    ? `Compare empresas especialistas em ${categoryNames.join(', ')} com avaliacoes reais, localizacao e canais de contato Premium.`
    : DEFAULT_DESCRIPTION;

  const canonicalUrl = absoluteUrl(canonicalPath);

  return {
    title,
    description,
    keywords: [
      'empresas de energia solar',
      'instaladores solares',
      ...categoryNames,
      'avaliacoes de empresas solares',
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

export async function generateMetadata({ searchParams }: CompaniesPageProps): Promise<Metadata> {
  const params = toSearchParams(searchParams);
  const categoryIds = normalizeCategoryIds(params.get('category_ids'));
  const noindex = shouldNoindexSearchParams(searchParams, {
    allowlistedKeys: ['category_ids'],
  });

  if (categoryIds.length === 0) {
    return buildCompaniesMetadata([], COMPANIES_PATH, noindex);
  }

  const seoIndex = await getCompaniesCategorySeoIndex();
  const categoryNames = resolveCategoryNamesFromIds(categoryIds, seoIndex);
  const canonicalPath = buildCompaniesCategoriesPath(categoryIds, seoIndex.byId);

  return buildCompaniesMetadata(categoryNames, canonicalPath, noindex);
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const params = toSearchParams(searchParams);
  const categoryIds = normalizeCategoryIds(params.get('category_ids'));

  if (categoryIds.length > 0) {
    const seoIndex = await getCompaniesCategorySeoIndex();
    const canonicalPath = buildCompaniesCategoriesPath(categoryIds, seoIndex.byId);

    params.delete('category_ids');
    const queryString = params.toString();
    const destination = `${canonicalPath}${queryString ? `?${queryString}` : ''}`;

    permanentRedirect(destination);
  }

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: '/' },
          { name: 'Empresas', item: COMPANIES_PATH },
        ]}
      />
      <CompaniesPageClient canonicalPath={COMPANIES_PATH} />
    </>
  );
}
