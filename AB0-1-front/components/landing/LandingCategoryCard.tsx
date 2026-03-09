'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RatingStars } from '@/components/RatingStars';
import type { Category } from '@/lib/api';
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';

type LandingCategoryCardProps = {
  category: Category;
  className?: string;
};

function resolveCategoryImage(category: Category): string {
  const banner = category?.banner_url;
  const logo = category?.logo?.url;
  return getFullImageUrl(banner || logo) || '/images/category-placeholder.jpg';
}

export default function LandingCategoryCard({ category, className }: LandingCategoryCardProps) {
  const href = buildCategoryPath(category?.seo_url, category?.id);
  const companiesCount = category?.companies_count ?? category?.companies?.length ?? 0;
  const reviewsCount = Number(category?.reviews_count ?? 0);
  const avgRating = parseFloat((category?.average_rating ?? 0).toString());
  const ratingLabel = avgRating > 0 ? avgRating.toFixed(1) : null;

  return (
    <Card className={cn('overflow-hidden clay-card border-clay-shadow-light hover:shadow-md smooth-transition h-auto max-h-[320px]', className)}>
      <Link href={href} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-clay-lg">
        <div className="relative aspect-[3/1] bg-clay-bg overflow-hidden">
          <Image
            src={resolveCategoryImage(category)}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center smooth-transition hover:scale-105"
          />
        </div>

        <div className="p-2.5 flex flex-col justify-between min-h-[110px]">
          <div>
            <h3 className="text-sm md:text-base font-extrabold text-slate-900 leading-tight line-clamp-1">
              {category?.name || 'Categoria'}
            </h3>

            <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
              {category?.short_description || 'Empresas verificadas e confiáveis'}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-600">
              {companiesCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  {companiesCount}
                </span>
              ) : null}

              {reviewsCount > 0 ? (
                <RatingStars 
                  rating={avgRating || 0} 
                  count={reviewsCount} 
                  showCount={false}
                  starClassName="w-3.5 h-3.5"
                />
              ) : null}
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-11 lg:h-10 clay-chip border-clay-shadow-light text-blue-700 hover:bg-clay-surface-raised px-4 lg:px-3 text-sm lg:text-xs font-bold"
            >
              <span>
                Explorar <ArrowRight className="ml-1 h-3.5 w-3.5 lg:h-3 lg:w-3" />
              </span>
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
}
