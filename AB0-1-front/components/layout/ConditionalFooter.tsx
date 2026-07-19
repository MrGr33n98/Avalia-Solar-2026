'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import { shouldShowStrategicFooter } from '@/lib/footer-visibility';

/**
 * Renders the global Footer only on public pages.
 * Dashboard and internal management areas are excluded to maximize screen space.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();

  if (!shouldShowStrategicFooter(pathname)) return null;

  return <Footer compact={pathname === '/'} />;
}
