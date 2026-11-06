import type { MetadataRoute } from 'next';

import { getAllSitemapEntries } from '@/lib/seo/sitemap-builders';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getAllSitemapEntries();
}
