import type { Metadata } from 'next';
import type { Category } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';
import { type SeoSearchParams } from '@/lib/seo/search-params';
import { evaluateCategoryFacetsPolicy } from '@/lib/seo/facets-policy';
import { normalizeCategorySlug } from '@/lib/server/category-discovery/get-public-category';

const BRAND_SUFFIX = ' | Avalia Solar';
const BRAND_TRAILING_REGEX = /(?:\s*\|\s*Avalia Solar\s*)+$/i;
const MAX_META_DESCRIPTION_LENGTH = 160;

export interface BuildCategoryPageMetadataInput {
  category: Category;
  requestedSlug?: string;
  searchParams?: SeoSearchParams;
  subpath?: string;
}

/**
 * CDSI-042 (J06): Resolve o slug canônico publicado a partir do DTO da categoria.
 * Nunca deriva a canonical a partir do slug cru da URL se o DTO possuir seo_url/canonical_slug válido.
 */
export function resolveCategoryCanonicalSlug(
  category: Pick<Category, 'seo_url' | 'slug' | 'indexability'>,
  fallbackSlug?: string
): string {
  const fromDto =
    normalizeCategorySlug(category.indexability?.canonical_slug) ||
    normalizeCategorySlug(category.seo_url) ||
    normalizeCategorySlug(category.slug);

  if (fromDto) return fromDto;

  return normalizeCategorySlug(fallbackSlug) || 'categoria';
}

/**
 * CDSI-042 (J06): Resolve o caminho canônico relativo (/categories/:slug) da categoria.
 */
export function resolveCategoryCanonicalPath(
  category: Pick<Category, 'seo_url' | 'slug' | 'indexability'>,
  fallbackSlug?: string,
  subpath?: string
): string {
  const canonicalSlug = resolveCategoryCanonicalSlug(category, fallbackSlug);
  const cleanSubpath = subpath ? `/${subpath.replace(/^\/+|\/+$/g, '')}` : '';
  return `/categories/${canonicalSlug}${cleanSubpath}`;
}

/**
 * CDSI-042 (J05): Normaliza o título SEO removendo repetições de "| Avalia Solar"
 * e aplicando sufixo de localização + marca exatamente uma vez.
 */
export function formatCategoryTitle(rawTitle: string, locationSuffix = ''): string {
  const cleanBase = String(rawTitle || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(BRAND_TRAILING_REGEX, '')
    .trim();

  const baseWithLocation = `${cleanBase}${locationSuffix}`.trim();
  return `${baseWithLocation}${BRAND_SUFFIX}`;
}

/**
 * CDSI-042 (J07): Remove tags HTML, blocos <script>/<style> e espaços extras,
 * truncando sem cortar palavras dentro do limite de 160 caracteres.
 */
export function sanitizeMetaDescription(
  rawText: string | null | undefined,
  maxLength = MAX_META_DESCRIPTION_LENGTH
): string {
  if (!rawText) return '';

  const stripped = String(rawText)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped.length <= maxLength) {
    return stripped;
  }

  const sliceLimit = Math.max(10, maxLength - 3);
  const sliced = stripped.slice(0, sliceLimit);
  const lastSpace = sliced.lastIndexOf(' ');
  const safePrefix = lastSpace > sliceLimit * 0.6 ? sliced.slice(0, lastSpace) : sliced;

  return `${safePrefix.trim()}...`;
}

/**
 * CDSI-042 / CDSI-043 / CDSI-050 / CDSI-064 / CDSI-065 / CDSI-101:
 * Constrói o Metadata de Next.js para páginas de categoria:
 * - Canonical derivada do DTO (`canonical_path` / `seo_url`).
 * - Paginação limpa (`?page=N`, N >= 2) sem facetas recebe self-canonical (`/categories/:slug?page=N`) e permanece indexável.
 * - Filtros de faceta (`state`, `city`, `sort`, `min_rating`, etc.) recebem `noindex,follow`, canonical base e NÃO injetam cidade no `<title>` global para evitar páginas doorway falsas (CDSI-101).
 */
export function buildCategoryPageMetadata({
  category,
  requestedSlug,
  searchParams,
  subpath,
}: BuildCategoryPageMetadataInput): Metadata {
  const baseCanonicalPath = resolveCategoryCanonicalPath(category, requestedSlug, subpath);
  const facetsDecision = evaluateCategoryFacetsPolicy(searchParams);

  const canonicalPathWithPage =
    !subpath && facetsDecision.selfCanonicalPageNumber
      ? `${baseCanonicalPath}?page=${facetsDecision.selfCanonicalPageNumber}`
      : baseCanonicalPath;

  const canonicalUrl = absoluteUrl(canonicalPathWithPage);

  const pageSuffix =
    !subpath && facetsDecision.selfCanonicalPageNumber
      ? ` — Página ${facetsDecision.selfCanonicalPageNumber}`
      : '';

  const rawTitle = category.seo_title || category.name;
  const title = formatCategoryTitle(rawTitle, pageSuffix);

  const rawDescriptionSource =
    category.seo_description ||
    category.short_description ||
    category.description ||
    `Encontre as melhores empresas e orçamentos de ${category.name} no Avalia Solar.`;

  const description = sanitizeMetaDescription(rawDescriptionSource, MAX_META_DESCRIPTION_LENGTH);

  const keywords =
    category.seo_keywords || ['energia solar', category.name, 'melhores empresas'].join(', ');

  const policyNoindex = category.indexability?.indexable === false;
  const noindex = facetsDecision.noindex || policyNoindex;

  return {
    title,
    description,
    keywords,
    robots: noindex ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: category.banner_url ? [category.banner_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: category.banner_url ? [category.banner_url] : [],
    },
  };
}

