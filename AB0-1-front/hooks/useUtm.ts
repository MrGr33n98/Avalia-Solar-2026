'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { updateAttribution } from '@/lib/analytics/utm';

/**
 * Captura UTMs/ad IDs e atualiza attribution em cada navegação (client-only).
 */
export function useUtm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams ? new URLSearchParams(searchParams.toString()) : undefined;
    updateAttribution(pathname, params);
    // referrer extraído dentro de updateAttribution via document.referrer
  }, [pathname, searchParams?.toString()]);
}
