'use client';

import { usePageTracking } from '@/hooks/usePageTracking';

export default function HomePageTracking() {
  usePageTracking({
    type: 'homepage',
    title: 'Avalia Solar - Encontre Empresas de Energia Solar',
    sections: ['hero', 'categories', 'companies', 'testimonials'],
  });

  return null;
}
