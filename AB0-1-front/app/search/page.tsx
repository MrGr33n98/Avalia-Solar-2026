import SearchPageClient from './SearchPageClient';
import { loadSearchInitial } from '@/lib/server/performance/loaders';

interface SearchPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

/** Anonymous search result is rendered in HTML/RSC before client hydration. */
export const revalidate = 120;

export default async function SearchPage({ searchParams = {} }: SearchPageProps) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') params.set(key, value);
    else if (Array.isArray(value)) for (const entry of value) params.append(key, entry);
  }

  // Keep the existing client error/retry flow available if the public API fails.
  const initialPage = await loadSearchInitial(params.toString()).catch(() => undefined);
  return <SearchPageClient initialPage={initialPage} />;
}
