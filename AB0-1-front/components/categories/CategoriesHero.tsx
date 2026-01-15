'use client';

import { BannerCarousel, Banner } from './BannerCarousel';

interface CategoriesHeroProps {
  banners: Banner[];
  loading?: boolean;
}

export default function CategoriesHero({ banners, loading }: CategoriesHeroProps) {
  return (
    <section className="relative w-full mb-8" aria-label="Destaques">
      <div className="container mx-auto px-4">
         <BannerCarousel banners={banners} loading={loading} />
      </div>
    </section>
  );
}