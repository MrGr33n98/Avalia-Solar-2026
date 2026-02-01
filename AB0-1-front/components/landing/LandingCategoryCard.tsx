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

type LandingCategoryCardProps = {
  category: Category;
  className?: string;
};

function resolveCategoryImage(category: Category): string {
  const banner = category?.banner_url;
  const logo = category?.logo?.url;
  return banner || logo || '/images/category-placeholder.jpg';
}

export default function LandingCategoryCard({ category, className }: LandingCategoryCardProps) {
  const href = buildCategoryPath(category?.seo_url, category?.id);
  const companiesCount = category?.companies_count ?? category?.companies?.length ?? 0;
  const reviewsCount = Number(category?.reviews_count ?? 0);
  const avgRating = parseFloat((category?.average_rating ?? 0).toString());
  const ratingLabel = avgRating > 0 ? avgRating.toFixed(1) : null;

  return (
    <Card className={cn('overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow h-auto max-h-[320px]', className)}>
      <Link href={href} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl">
        <div className="relative aspect-[3/1] bg-gray-100 overflow-hidden">
          <Image
            src={resolveCategoryImage(category)}
            alt={category?.name || 'Categoria'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center transition-transform duration-500 hover:scale-105"
          />
        </div>

        <div className="p-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm md:text-base font-semibold text-slate-900 leading-tight line-clamp-1">
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
              className="h-11 lg:h-7 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 px-3 lg:px-2 text-xs lg:text-[10px]"
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
