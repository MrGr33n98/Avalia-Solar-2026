'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  const reviewsCount = (category as any)?.reviews_count ?? 0;
  const avgRating = (category as any)?.average_rating ?? (category as any)?.rating ?? null;
  const ratingLabel = typeof avgRating === 'number' ? avgRating.toFixed(1) : null;

  return (
    <Card className={cn('overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow', className)}>
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl">
        <div className="relative aspect-[16/9] bg-gray-100">
          <Image
            src={resolveCategoryImage(category)}
            alt={category?.name || 'Categoria'}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center"
          />
        </div>

        <div className="p-4">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 leading-tight line-clamp-2">
            {category?.name || 'Categoria'}
          </h3>

          <p className="mt-1 text-sm text-slate-600 line-clamp-2">
            {category?.short_description || 'Empresas verificadas e confiáveis'}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              {companiesCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  {companiesCount}
                </span>
              ) : null}

              {reviewsCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  {ratingLabel ? <span className="font-medium">{ratingLabel}</span> : null}
                  <span className="text-slate-400">{ratingLabel ? `(${reviewsCount})` : reviewsCount}</span>
                </span>
              ) : null}
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <span>
                Explorar <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
}
