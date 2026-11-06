import { absoluteUrl } from '@/lib/site';
import type { Category, Company } from '@/lib/api';
import {
  resolveCategoryCanonicalPath,
  resolveCategoryCanonicalSlug,
} from '@/lib/seo/category-metadata';

export interface CategoryBreadcrumbItem {
  name: string;
  item: string;
}

export interface CategoryNavCapability {
  label: string;
  href: string;
}

const ALLOWED_HTML_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'code',
  'a',
]);

/**
 * CDSI-062 (J15 / R34): Sanitiza HTML editorial removendo <script>, <style>, <iframe>,
 * atributos de eventos inline (on*) e protocolos perigosos (javascript:, data:, vbscript:).
 */
export function sanitizeEditorialHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml) return '';

  let sanitized = String(rawHtml)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<(?:iframe|object|embed|form|input|button|meta|link)\b[^>]*>.*?<\/(?:iframe|object|embed|form|input|button|meta|link)>/gis, '')
    .replace(/<(?:iframe|object|embed|form|input|button|meta|link)\b[^>]*\/?>/gi, '');

  sanitized = sanitized.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (fullMatch, rawTag, rawAttrs) => {
    const tag = String(rawTag).toLowerCase();
    if (!ALLOWED_HTML_TAGS.has(tag)) {
      return '';
    }

    if (fullMatch.startsWith('</')) {
      return `</${tag}>`;
    }

    if (tag === 'a') {
      const hrefMatch = String(rawAttrs).match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawHref = (hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || '').trim();
      const isSafeHref =
        rawHref.startsWith('/') ||
        rawHref.startsWith('https://') ||
        rawHref.startsWith('http://');

      if (!isSafeHref) {
        return '<a>';
      }

      const safeHref = rawHref.replace(/"/g, '&quot;');
      const isExternal = /^https?:\/\//i.test(rawHref);
      return isExternal
        ? `<a href="${safeHref}" rel="noopener noreferrer">`
        : `<a href="${safeHref}">`;
    }

    return `<${tag}>`;
  });

  return sanitized.trim();
}

/**
 * CDSI-056 (J12 / E10): Constrói itens de Breadcrumb a partir da hierarquia real (Home -> Categorias -> Pai ativo -> Categoria).
 */
export function buildCategoryBreadcrumbItems(
  category: Pick<Category, 'name' | 'seo_url' | 'slug' | 'parent' | 'indexability'>,
  fallbackSlug?: string
): CategoryBreadcrumbItem[] {
  const canonicalSlug = resolveCategoryCanonicalSlug(category, fallbackSlug);
  const parentSlug = category.parent?.seo_url || category.parent?.slug;

  return [
    { name: 'Início', item: '/' },
    { name: 'Categorias', item: '/categories' },
    ...(category.parent?.name && parentSlug
      ? [{ name: category.parent.name, item: `/categories/${parentSlug}` }]
      : []),
    { name: category.name, item: `/categories/${canonicalSlug}` },
  ];
}

/**
 * CDSI-059 (J18 / E17): Retorna apenas rotas auxiliares realmente implementadas e com dados válidos.
 * Remove links quebrados 404 (/about, /guides, /reviews) e omite /solutions e /compare quando vazias.
 */
export function buildCategoryNavigationCapabilities(
  category: Pick<Category, 'seo_url' | 'slug' | 'solution_types' | 'faqs' | 'indexability'>,
  fallbackSlug?: string
): CategoryNavCapability[] {
  const basePath = resolveCategoryCanonicalPath(category, fallbackSlug);
  const items: CategoryNavCapability[] = [
    { label: 'Empresas', href: basePath },
    { label: 'Sobre a categoria', href: `${basePath}#editorial-category-guide` },
  ];

  const hasSolutions = Array.isArray(category.solution_types) && category.solution_types.length > 0;
  if (hasSolutions) {
    items.push({ label: 'Tipos de soluções', href: `${basePath}/solutions` });
    items.push({ label: 'Comparar soluções', href: `${basePath}/compare` });
  }

  if (Array.isArray(category.faqs) && category.faqs.length > 0) {
    items.push({ label: 'Dúvidas frequentes', href: `${basePath}#category-faq-section` });
  }

  items.push({ label: 'Empresas para seu projeto', href: `${basePath}/matching` });

  return items;
}

/**
 * CDSI-057 / CDSI-098 (J13 / J14): Constrói JSON-LD factual de CollectionPage + ItemList
 * contendo exclusivamente as empresas renderizadas na página atual, sem AggregateRating inventado.
 */
export function buildCategoryCollectionPageSchema({
  category,
  companies,
  totalCount,
  fallbackSlug,
}: {
  category: Category;
  companies: Company[];
  totalCount?: number;
  fallbackSlug?: string;
}) {
  const canonicalPath = resolveCategoryCanonicalPath(category, fallbackSlug);
  const canonicalUrl = absoluteUrl(canonicalPath);

  const visibleCompanies = Array.isArray(companies) ? companies.slice(0, 50) : [];

  const itemListElements = visibleCompanies.map((company, index) => {
    const companyPath = company.slug ? `/companies/${company.slug}` : `/companies/${company.id}`;
    return {
      '@type': 'ListItem' as const,
      position: index + 1,
      name: company.name,
      url: absoluteUrl(companyPath),
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description:
      category.short_description ||
      category.seo_description ||
      `Diretório técnico de empresas de ${category.name} no Avalia Solar.`,
    url: canonicalUrl,
    inLanguage: 'pt-BR',
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems:
        typeof totalCount === 'number' && totalCount >= visibleCompanies.length
          ? totalCount
          : visibleCompanies.length,
      itemListElement: itemListElements,
    },
  };
}

