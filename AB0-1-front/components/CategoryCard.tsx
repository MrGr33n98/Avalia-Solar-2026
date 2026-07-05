'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Category } from '@/lib/api';
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';

interface CategoryCardProps {
  category: Category;
  className?: string;
  index?: number;
}

/** Card compacto usado nos grids da página pública de categorias. */
export default function CategoryCard({ category, className = '', index = 0 }: CategoryCardProps) {
  const title = category.short_description || category.name;
  const description = category.description;
  const bannerUrl = getFullImageUrl(category.banner_url || category.icon_url);
  const path = buildCategoryPath(category.slug || category.seo_url || '');
  const rating = category.average_rating || 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      className={cn('h-[216px] min-w-0 sm:h-[220px]', className)}
    >
      <Link
        href={path}
        className="group block h-full no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2"
        aria-label={`Explorar ${category.name}`}
      >
        <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:border-blue-300 group-hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="relative h-[92px] shrink-0 overflow-hidden sm:h-[96px]">
            <Image
              src={bannerUrl}
              alt={category.name}
              fill
              sizes="(max-width: 479px) 100vw, (max-width: 1023px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              priority={index < 4}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />

            <div className="absolute right-2 top-2 flex items-center gap-1.5">
              {category.featured ? (
                <span className="rounded-md bg-blue-600 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm">
                  Destaque
                </span>
              ) : null}
              {rating > 0 ? (
                <span className="flex items-center gap-1 rounded-md border border-white/60 bg-white/90 px-1.5 py-1 text-[10px] font-semibold text-slate-900 backdrop-blur-sm">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {rating}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-3.5 py-3 sm:px-4">
            <h3 className="line-clamp-2 text-sm font-semibold leading-[1.25rem] tracking-tight text-slate-950 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-[1.05rem] text-slate-500 dark:text-slate-400">
              {description}
            </p>

            <div className="mt-auto flex items-center justify-end border-t border-slate-100 pt-2 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400">
                Explorar
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.article>
  );
}
