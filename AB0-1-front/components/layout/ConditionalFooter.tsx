'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

/**
 * Renders the global Footer only on public pages.
 * Dashboard and internal management areas are excluded to maximize screen space.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();

  const hideFooterRoutes = [
    '/dashboard',
    '/review-dashboard',
    '/profile',
    '/chat',
    '/company-dashboard',
    '/admin',
    '/painel',
    '/control',
  ];

  const isInternal =
    pathname &&
    hideFooterRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isInternal) return null;

  return <Footer />;
}
