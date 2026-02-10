import { slugify } from '@/lib/slug';

export const COMPANIES_PATH = '/companies';
export const COMPANIES_CATEGORIES_PATH = '/companies/categorias';

export interface CategorySeoDescriptor {
  id: number;
  name?: string | null;
  seo_url?: string | null;
}

const FALLBACK_CATEGORY_SLUG = 'categoria';

export function normalizeCategoryIds(value: string | null | undefined): number[] {
  if (!value) return [];

  const parsed = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);

  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

export function buildCategorySegment(category: CategorySeoDescriptor): string {
  const normalizedSlug = slugify(String(category.seo_url || category.name || `${FALLBACK_CATEGORY_SLUG}-${category.id}`));
  const safeSlug = normalizedSlug || `${FALLBACK_CATEGORY_SLUG}-${category.id}`;
  return `${safeSlug}--${category.id}`;
}

export function parseCategorySegment(segment: string): { id: number | null; slug: string } {
  const cleanSegment = decodeURIComponent(segment || '').trim().toLowerCase();
  const match = cleanSegment.match(/^(.*)--(\d+)$/);

  if (match) {
    return {
      slug: slugify(match[1]) || FALLBACK_CATEGORY_SLUG,
      id: Number(match[2]),
    };
  }

  return {
    slug: slugify(cleanSegment) || FALLBACK_CATEGORY_SLUG,
    id: null,
  };
}

export function isCompaniesCategoriesPath(pathname: string): boolean {
  return pathname === COMPANIES_CATEGORIES_PATH || pathname.startsWith(`${COMPANIES_CATEGORIES_PATH}/`);
}

export function extractCategorySegmentsFromPath(pathname: string): string[] {
  if (!isCompaniesCategoriesPath(pathname)) return [];

  const rest = pathname.slice(COMPANIES_CATEGORIES_PATH.length).replace(/^\/+/, '');
  if (!rest) return [];

  return rest
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function extractCategoryIdsFromPath(pathname: string): number[] {
  const ids = extractCategorySegmentsFromPath(pathname)
    .map((segment) => parseCategorySegment(segment).id)
    .filter((id): id is number => typeof id === 'number' && id > 0);

  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

export function extractCategorySlugByIdFromPath(pathname: string): Record<number, string> {
  const entries = extractCategorySegmentsFromPath(pathname)
    .map((segment) => parseCategorySegment(segment))
    .filter((entry): entry is { id: number; slug: string } => typeof entry.id === 'number' && entry.id > 0);

  return entries.reduce<Record<number, string>>((acc, entry) => {
    acc[entry.id] = entry.slug;
    return acc;
  }, {});
}

export function buildCompaniesCategoriesPath(
  categoryIds: number[],
  categoriesById: Record<number, CategorySeoDescriptor> = {},
  slugFallbackById: Record<number, string> = {}
): string {
  const uniqueIds = Array.from(new Set(categoryIds)).filter((id) => id > 0).sort((a, b) => a - b);
  if (uniqueIds.length === 0) return COMPANIES_PATH;

  const segments = uniqueIds.map((id) => {
    const descriptor = categoriesById[id];
    const fallbackSlug = slugify(slugFallbackById[id] || `${FALLBACK_CATEGORY_SLUG}-${id}`);

    return buildCategorySegment({
      id,
      name: descriptor?.name,
      seo_url: descriptor?.seo_url || fallbackSlug,
    });
  });

  return `${COMPANIES_CATEGORIES_PATH}/${segments.join('/')}`;
}

export function toSearchParams(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams | undefined
): URLSearchParams {
  if (!searchParams) return new URLSearchParams();
  if (searchParams instanceof URLSearchParams) return new URLSearchParams(searchParams);

  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }
    params.set(key, value);
  });

  return params;
}
