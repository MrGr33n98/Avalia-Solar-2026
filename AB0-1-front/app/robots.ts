import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/seo-image'],
      disallow: ['/dashboard/', '/admin/', '/api/'],
    },
    sitemap: [`${SITE.url}/sitemap-index.xml`, `${SITE.url}/sitemap.xml`],
  };
}
