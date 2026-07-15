import type { Metadata } from 'next';

import { BRAZIL_STATE_SOLAR_PAGES } from '@/lib/locations/local-page-slugs';
import {
  generateLocalSolarMetadata,
  LocalSolarDirectoryPage,
} from '../local-page';

export const revalidate = 1800;

type StatePageParams = {
  id: string;
  state: string;
};

type PageProps = {
  params: StatePageParams;
  searchParams?: Record<string, string | string[] | undefined>;
};

export function generateStaticParams(): StatePageParams[] {
  return BRAZIL_STATE_SOLAR_PAGES.map((page) => ({
    id: 'energia-solar',
    state: page.state.toLowerCase(),
  }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  return generateLocalSolarMetadata({
    vertical: params.id,
    state: params.state,
    searchParams,
  });
}

export default async function StateSolarCompaniesPage({ params, searchParams }: PageProps) {
  return LocalSolarDirectoryPage({
    vertical: params.id,
    state: params.state,
    searchParams,
  });
}
