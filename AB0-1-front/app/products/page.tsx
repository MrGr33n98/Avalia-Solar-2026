import ProductsPageClient from './ProductsPageClient';
import { loadProductsInitial } from '@/lib/server/performance/loaders';

interface ProductsPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export const revalidate = 300;

export default async function ProductsPage({ searchParams = {} }: ProductsPageProps) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') params.set(key, value);
    else if (Array.isArray(value)) for (const entry of value) params.append(key, entry);
  }
  // On API outages keep the existing recoverable client path; never fabricate products.
  const initialPage = await loadProductsInitial(params.toString()).catch(() => undefined);
  return <ProductsPageClient initialPage={initialPage} />;
}
