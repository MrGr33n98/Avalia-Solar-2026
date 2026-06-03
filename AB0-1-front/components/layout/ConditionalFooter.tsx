'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

/**
 * Renders the global Footer only on public pages.
 * Dashboard and internal management areas are excluded to maximize screen space.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Define routes where footer should be hidden
  const hideFooterRoutes = [
    '/dashboard',
    '/painel',
    '/control',
    '/admin'
  ];

  const shouldHide = hideFooterRoutes.some(route => pathname?.startsWith(hideFooterRoutes.find(r => pathname?.startsWith(r)) || 'UNDEFINED_ROUTE'));
  // More robust check
  const isInternal = pathname && hideFooterRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  if (isInternal) return null;

  return <Footer />;
}
