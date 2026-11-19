import 'server-only';
import { cache } from 'react';
import { publicCompaniesApi } from '@/lib/api-public';

export const getCompanyForInitialRender = cache(async (slug: string) => {
  return publicCompaniesApi.getById(slug, {
    revalidate: 900,
    tags: ['company-profile', `company-${slug}`],
  });
});
