import type { Metadata } from 'next';

import {
  BRAZIL_CAPITAL_SOLAR_PAGES,
  type LocalSolarPage,
} from '@/lib/locations/local-page-slugs';
import {
  generateLocalSolarMetadata,
  LocalSolarDirectoryPage,
} from '../../local-page';

export const revalidate = 300;

type LocalPageParams = {
  id: string;
  state: string;
  city: string;
};

type PageProps = {
  params: LocalPageParams;
  searchParams?: Record<string, string | string[] | undefined>;
};

export function generateStaticParams(): LocalPageParams[] {
  return BRAZIL_CAPITAL_SOLAR_PAGES.map((page: LocalSolarPage) => ({
    id: 'energia-solar',
    state: page.state.toLowerCase(),
    city: page.citySlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateLocalSolarMetadata({
    vertical: params.id,
    state: params.state,
    city: params.city,
  });
}

export default async function LocalSolarCompaniesPage({ params, searchParams }: PageProps) {
  return LocalSolarDirectoryPage({
    vertical: params.id,
    state: params.state,
    city: params.city,
    searchParams,
  });
}
