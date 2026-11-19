import { getInitialProducts } from '@/lib/server/performance/products';
import ProductsPageClient from './ProductsPageClient';

export const revalidate = 60;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  const queryString = params.toString();
  const initialData = await getInitialProducts(queryString);
  return <ProductsPageClient initialData={initialData} initialSearchParamsKey={queryString} />;
}
