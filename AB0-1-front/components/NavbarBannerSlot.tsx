'use client';

import { useEffect, useState } from 'react';
import BannerByLocation from '@/components/BannerByLocation';

export default function NavbarBannerSlot() {
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
