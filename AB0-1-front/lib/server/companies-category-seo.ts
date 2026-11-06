import { unstable_cache } from 'next/cache';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import { CategorySeoDescriptor, parseCategorySegment } from '@/lib/seo/companies-category-url';
import { slugify } from '@/lib/slug';

/**
 * CDSI-049: Matriz de Intenção e Prevenção de Canibalização SEO
 *
 * 1. `/categories/[slug]` -> Hub Editorial & AEO Canônico da Categoria:
 *    - Intenção dominante: descoberta vertical, guia editorial técnico, FAQs estruturadas,
 *      soluções por tecnologia e vitrine curada da categoria única.
 *    - Canonical: `https://www.avaliasolar.com.br/categories/${seo_url}`
 *
 * 2. `/companies/categorias/[...categorySlugs]` -> Diretório Transacional Multi-Filtro:
 *    - Intenção dominante: filtragem combinada do diretório geral de empresas (`/companies`)
 *      com segmentos `<slug>--<id>` (suporta interseção/união de múltiplas categorias).
 *    - Canonical: `https://www.avaliasolar.com.br/companies/categorias/${segments}`
 *    - Não substitui nem recebe links editoriais primários no lugar de `/categories/[slug]`.
 */
interface CategoryTreeLike {
  id?: number;
  name?: string;
  seo_url?: string;
  slug?: string;
  status?: string;
  children?: CategoryTreeLike[];
  subcategories?: CategoryTreeLike[];
}

interface CategorySeoIndex {
  byId: Record<number, CategorySeoDescriptor>;
  bySlug: Record<string, CategorySeoDescriptor>;
}

function extractCollection(payload: unknown): CategoryTreeLike[] {
  if (Array.isArray(payload)) return payload as CategoryTreeLike[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as CategoryTreeLike[];
    if (Array.isArray(obj.categories)) return obj.categories as CategoryTreeLike[];
  }
  return [];
}

function flattenCategories(nodes: CategoryTreeLike[]): CategorySeoDescriptor[] {
  const queue = [...nodes];
  const items: CategorySeoDescriptor[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current.id !== 'number') continue;
    if (typeof current.status === 'string' && current.status !== 'active') continue;

    items.push({
      id: current.id,
      name: current.name,
      seo_url: current.seo_url || current.slug,
    });

    if (Array.isArray(current.children)) queue.push(...current.children);
    if (Array.isArray(current.subcategories)) queue.push(...current.subcategories);
  }

  return items;
}

const fetchCompaniesCategorySeoIndex = unstable_cache(
  async (): Promise<CategorySeoIndex> => {
    try {
      const response = await fetch(buildApiUrl('categories/tree'), {
        method: 'GET',
        headers: getApiRequestHeaders(),
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        return { byId: {}, bySlug: {} };
      }

      const payload = await response.json();
      const categories = flattenCategories(extractCollection(payload));

      const byId: Record<number, CategorySeoDescriptor> = {};
      const bySlug: Record<string, CategorySeoDescriptor> = {};

      categories.forEach((category) => {
        byId[category.id] = category;

        const normalizedSeo = slugify(String(category.seo_url || category.name || ''));
        if (normalizedSeo) {
          bySlug[normalizedSeo] = category;
        }
      });

      return { byId, bySlug };
    } catch {
      return { byId: {}, bySlug: {} };
    }
  },
  ['companies-category-seo-index-v1'],
  { revalidate: 3600 }
);

export async function getCompaniesCategorySeoIndex(): Promise<CategorySeoIndex> {
  return fetchCompaniesCategorySeoIndex();
}

export function resolveCategoryIdsFromSegments(
  segments: string[],
  index: CategorySeoIndex
): number[] {
  const ids = segments
    .map((segment) => {
      const parsed = parseCategorySegment(segment);
      if (parsed.id && parsed.id > 0) return parsed.id;

      const mapped = index.bySlug[parsed.slug];
      return mapped?.id;
    })
    .filter((id): id is number => typeof id === 'number' && id > 0);

  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

export function resolveCategoryNamesFromIds(
  categoryIds: number[],
  index: CategorySeoIndex
): string[] {
  return categoryIds
    .map((id) => index.byId[id]?.name)
    .filter((name): name is string => Boolean(name));
}
