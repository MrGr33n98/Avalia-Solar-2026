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
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, PageData, UserData } from '@/lib/dataLayer';

interface UsePageTrackingOptions {
  type: PageData['type'];
  title?: string;
  sections?: string[];
  user?: UserData;
  additionalData?: Record<string, any>;
}

export function usePageTracking(options: UsePageTrackingOptions) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Aguarda 100ms para garantir que a página foi renderizada
    const timeoutId = setTimeout(() => {
      const pageData: PageData = {
        type: options.type,
        path: pathname,
        title: options.title || document.title,
        referrer: document.referrer || undefined,
        language: 'pt-BR',
        sections: options.sections,
      };

      trackPageView(pageData, options.user, options.additionalData);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, searchParams, options]);
}

export default usePageTracking;
