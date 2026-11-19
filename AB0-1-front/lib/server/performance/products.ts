import 'server-only';
import { cache } from 'react';
import type { Product } from '@/lib/api';
import { fetchApiPublic } from '@/lib/api-public';

export type InitialProducts = {
  data: Product[];
  meta: { total: number; page: number; per_page: number; total_pages: number };
  filters: {
    filters?: unknown[];
    categories?: unknown[];
    companies?: unknown[];
    brands?: unknown[];
    price_range?: { min: number; max: number };
  } | null;
};

const readPositiveInt = (value: string | null) => {
  const num = Number(value);
  return Number.isSafeInteger(num) && num > 0 ? num : undefined;
};

export const getInitialProducts = cache(async (search: string): Promise<InitialProducts | null> => {
  const params = new URLSearchParams(search);
  const query: Record<string, string | number | boolean> = {
    page: readPositiveInt(params.get('page')) || 1,
    per_page: 12,
    include_specs: false,
  };
  const q = params.get('search')?.trim();
  if (q) query.q = q.slice(0, 160);
  for (const key of ['category_id', 'company_id', 'brand_id'] as const) {
    const raw = key === 'category_id'
      ? (params.get('category_id') || params.get('category'))
      : params.get(key);
    const id = readPositiveInt(raw);
    // Never render unfiltered SSR cards for a deep link the public API cannot express.
    if (raw && !id) return null;
    if (id) query[key] = id;
  }
  for (const key of ['price_min', 'price_max'] as const) {
    const value = Number(params.get(key));
    if (params.has(key) && Number.isFinite(value) && value > 0) query[key] = value;
  }
  const sort = params.get('sort');
  if (sort && sort !== 'relevance') query.sort = sort.slice(0, 40);
  try {
    const [response, filters] = await Promise.all([
      fetchApiPublic<unknown>('products', {
        params: query, revalidate: 60, tags: ['products'], timeoutMs: 5000, silent: true,
      }),
      fetchApiPublic<unknown, null>('products/filters', {
        revalidate: 300, tags: ['products-filters'], timeoutMs: 5000, silent: true, fallback: null,
      }),
    ]);
    const record = response && typeof response === 'object' && !Array.isArray(response)
      ? response as Record<string, unknown>
      : null;
    const data = Array.isArray(response) ? response : record?.data;
    if (!Array.isArray(data)) return null;
    const pageMeta = record?.meta && typeof record.meta === 'object'
      ? record.meta as Record<string, unknown> : {};
    const count = typeof pageMeta.total === 'number' ? pageMeta.total : data.length;
    const totalPages = typeof pageMeta.total_pages === 'number' ? pageMeta.total_pages : 1;
    return {
      data: data as Product[],
      meta: { total: count, page: Number(query.page), per_page: 12, total_pages: totalPages },
      filters: filters && typeof filters === 'object' && !Array.isArray(filters) ? filters as InitialProducts['filters'] : null,
    };
  } catch {
    return null;
  }
});
