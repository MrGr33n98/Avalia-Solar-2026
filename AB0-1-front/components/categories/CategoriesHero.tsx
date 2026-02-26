'use client';

import { BannerCarousel, Banner } from './BannerCarousel';

interface CategoriesHeroProps {
  banners: Banner[];
  loading?: boolean;
}

export default function CategoriesHero({ banners, loading }: CategoriesHeroProps) {
  return (
    <section className="relative w-full mb-0 bg-slate-50" aria-label="Destaques">
      <div className="container mx-auto px-4 py-2 md:py-4">
         <BannerCarousel banners={banners} loading={loading} />
      </div>
    </section>
  );
}
