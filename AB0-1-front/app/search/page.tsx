import { getInitialSearch } from '@/lib/server/performance/search';
import SearchPageClient from './SearchPageClient';

export const revalidate = 60;

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
    else if (value !== undefined) params.set(key, value);
  }
  const queryString = params.toString();
  const initialData = await getInitialSearch(queryString);
  return <SearchPageClient initialData={initialData} initialSearchParamsKey={queryString} />;
}
