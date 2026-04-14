/**
 * usePageTracking Hook
 *
 * Hook personalizado para rastrear automaticamente page views
 * Integra com Next.js App Router e envia eventos para o GTM
 *
 * Uso:
 * ```tsx
 * 'use client';
 * import { usePageTracking } from '@/hooks/usePageTracking';
 *
 * export default function MyPage() {
 *   usePageTracking({
 *     type: 'homepage',
 *     title: 'Home - Avalia Solar',
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView, type PageData, type UserData } from '@/lib/analytics/consolidated';

interface UsePageTrackingOptions {
  type: PageData['type'];
  title?: string;
  sections?: string[];
  user?: UserData;
  additionalData?: Record<string, any>;
}

export function usePageTracking(options: UsePageTrackingOptions) {
  const pathname = usePathname();
  const { type, title, sections, user, additionalData } = options;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const pageData: PageData = {
        type,
        path: pathname,
        title: title || document.title,
        referrer: document.referrer || undefined,
        language: 'pt-BR',
        sections,
      };

      trackPageView(pageData, user, additionalData);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, type, title, sections, user, additionalData]);
}

export default usePageTracking;
