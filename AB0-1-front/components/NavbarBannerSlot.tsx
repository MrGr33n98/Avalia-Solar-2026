'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import BannerByLocation from '@/components/BannerByLocation';

function DesktopNavbarBanner() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (!desktop) return null;

  return <BannerByLocation location="navbar" limit={1} className="mx-auto" />;
}

export default function NavbarBannerSlot() {
  const pathname = usePathname();
  const isReviewerDashboard =
    pathname === '/review-dashboard' || pathname?.startsWith('/review-dashboard/');

  if (isReviewerDashboard) return null;

  return (
    <div
      className="hidden border-b border-slate-100 bg-white md:block dark:border-slate-800 dark:bg-slate-950"
      aria-label="Publicidade no topo"
    >
      <div className="mx-auto max-w-[1200px] px-4 py-1">
        <DesktopNavbarBanner />
      </div>
    </div>
  );
}
