'use client';

import { useEffect } from 'react';
import { page, track } from '@/lib/analytics/lazy';

interface Props {
  slug: string;
  cityName: string;
  categoryName: string;
}

export function SeoPageAnalytics({ slug, cityName, categoryName }: Props) {
  useEffect(() => {
    // Track page view with custom properties
    page(`Soluções: ${categoryName} em ${cityName}`, {
      page_type: 'seo_landing_page',
      city: cityName,
      category: categoryName,
      slug: slug
    });

    // Track regional intent
    track('regional_page_view', {
      location: cityName,
      category: categoryName,
      slug: slug
    });
  }, [slug, cityName, categoryName]);

  return null;
}
