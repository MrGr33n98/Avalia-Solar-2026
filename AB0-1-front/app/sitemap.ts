import type { MetadataRoute } from 'next';

import { getAllSitemapEntries } from '@/lib/seo/sitemap-builders';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getAllSitemapEntries();
}
