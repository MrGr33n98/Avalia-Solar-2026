import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import CompaniesPageClient from './CompaniesPageClient';
import {
  buildCompaniesCategoriesPath,
  COMPANIES_PATH,
  normalizeCategoryIds,
  toSearchParams,
} from '@/lib/seo/companies-category-url';
import { getCompaniesCategorySeoIndex, resolveCategoryNamesFromIds } from '@/lib/server/companies-category-seo';

interface CompaniesPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const SITE_URL = 'https://www.avaliasolar.com.br';
const DEFAULT_TITLE = 'Empresas de Energia Solar no Brasil | Avalia Solar';
const DEFAULT_DESCRIPTION =
  'Encontre empresas de energia solar avaliadas em todo o Brasil. Compare reputacao, servicos e localizacao para contratar com mais seguranca.';

export const revalidate = 300;

function buildCompaniesMetadata(categoryNames: string[], canonicalPath: string): Metadata {
  const hasCategories = categoryNames.length > 0;
  const title = hasCategories
    ? `Empresas de ${categoryNames.join(' e ')} | Avalia Solar`
    : DEFAULT_TITLE;

  const description = hasCategories
    ? `Compare empresas especialistas em ${categoryNames.join(', ')} com avaliacoes reais, localizacao e canais de contato Premium.`
    : DEFAULT_DESCRIPTION;

  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  return {
    title,
    description,
    keywords: [
      'empresas de energia solar',
      'instaladores solares',
      ...categoryNames,
      'avaliacoes de empresas solares',
    ],
    alternates: {
      canonical: canonicalPath,
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

  if (categoryIds.length === 0) {
    return buildCompaniesMetadata([], COMPANIES_PATH);
  }

  const seoIndex = await getCompaniesCategorySeoIndex();
  const categoryNames = resolveCategoryNamesFromIds(categoryIds, seoIndex);
  const canonicalPath = buildCompaniesCategoriesPath(categoryIds, seoIndex.byId);

  return buildCompaniesMetadata(categoryNames, canonicalPath);
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

  return <CompaniesPageClient canonicalPath={COMPANIES_PATH} />;
}
