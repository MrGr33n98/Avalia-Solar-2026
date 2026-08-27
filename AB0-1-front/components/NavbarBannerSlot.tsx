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

  return (
    <BannerByLocation
      location="navbar"
      limit={1}
      className="mx-auto"
      showLoadingPlaceholder={false}
    />
  );
}

export default function NavbarBannerSlot() {
  const pathname = usePathname();
  const hiddenRoute =
    pathname === '/' ||
    pathname === '/review-dashboard' ||
    pathname?.startsWith('/review-dashboard/');

  if (hiddenRoute) return null;

  return <DesktopNavbarBanner />;
}
