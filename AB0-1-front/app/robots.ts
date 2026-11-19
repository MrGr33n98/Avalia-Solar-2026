import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/seo-image'],
      disallow: [
        '/admin/',
        '/api/',
        '/dashboard/',
        '/company-dashboard/',
        '/review-dashboard/',
        '/favorites',
        '/profile',
        '/login',
        '/logout',
        '/register',
        '/signup',
        '/register-user',
        '/forgot-password',
        '/reset-password/',
        '/confirm-email/',
        '/search',
        '/compare',
        '/quote-wizard',
        '/select-company',
        '/chat',
        '/companies/*/review',
        '/companies/*/claim',
        '/companies/*/quote',
        '/*?*category_ids=*',
        '/*?*project_types=*',
      ],
    },
    sitemap: [`${SITE.url}/sitemap-index.xml`],
  };
}
