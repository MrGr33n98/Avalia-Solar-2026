'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Building2, Package, Star } from 'lucide-react';
import { Category } from '@/lib/api';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';
import { getPreferredCategoryIcon } from '@/lib/categoryIcons';

interface CategoryCardProps {
  category: Category;
  className?: string;
  index?: number;
}

/**
 * CategoryCard - component to display category info with premium design
 */
export default function CategoryCard({ category, className = '', index = 0 }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayData = {
    title: category.short_description || category.name,
    description: category.description,
    bannerUrl: getFullImageUrl(category.banner_url || category.icon_url),
    iconUrl: getPreferredCategoryIcon(
      category.slug || category.seo_url,
      category.icon_url,
      category.name
    ),
    products_count: category.products_count || 0,
    companies_count: category.companies_count || 0,
    rating: category.average_rating || 0,
    featured: category.featured || false,
    path: buildCategoryPath(category.slug || category.seo_url || ''),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className={cn('h-full', className)}
    >
      <Link
        href={displayData.path}
        className="block h-full no-underline"
        onClick={(e) => {
          if (e.defaultPrevented) return;
        }}
      >
        <Card
          className={cn(
            'h-full overflow-hidden transition-all duration-300 flex flex-col clay-card hover:shadow-xl border-[0.5px] border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl bg-white dark:bg-slate-900',
            isHovered && 'ring-2 ring-primary/5 shadow-2xl'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Visual Header / Banner Section */}
          <div className="relative aspect-[21/9] overflow-hidden group">
            <Image
              src={displayData.bannerUrl}
              alt={displayData.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={cn(
                'object-cover transition-transform duration-700 ease-out',
                isHovered ? 'scale-105' : 'scale-100'
              )}
              priority={index < 3}
            />

            {/* Dynamic Gradient Overlay - Extremely Subtle */}
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent transition-opacity duration-500',
                isHovered ? 'opacity-30' : 'opacity-20'
              )}
            />

            {/* Sweep Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

            {/* Badges - Floating with Staggered Feel */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
              <AnimatePresence>
                {displayData.featured && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-primary/90 text-white shadow-md px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm"
                  >
                    <span className="font-bold uppercase text-[8px] tracking-[0.2em]">
                      Destaque
                    </span>
                  </motion.div>
                )}
                {displayData.rating > 0 && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border-[0.5px] border-slate-200/40 dark:border-slate-800/40"
                  >
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[11px] text-slate-950 dark:text-white">
                      {displayData.rating}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* New Floating Title Container - Hairline Style */}
          <div className="relative -mt-6 px-5 z-20">
            <motion.div
              className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl clay-card clay-precision shadow-lg border-[0.5px] border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4"
              animate={isHovered ? { y: -2, scale: 1.01 } : { y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {displayData.iconUrl ? (
                  <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700">
                    <Image
                      src={displayData.iconUrl}
                      alt={`Ícone de ${category.name}`}
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  </span>
                ) : null}
                <h3 className="flex-1 text-[0.95rem] font-medium leading-tight tracking-tight text-slate-950 dark:text-white">
                  {displayData.title}
                </h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg text-slate-400 flex-shrink-0 border-[0.5px] border-slate-100 dark:border-slate-800">
                <ArrowRight
                  size={12}
                  className={cn(
                    'transition-transform duration-300',
                    isHovered ? 'translate-x-0.5' : 'opacity-40'
                  )}
                />
              </div>
            </motion.div>
          </div>

          <CardContent className="p-5 pt-6 flex-grow">
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed font-medium">
              {displayData.description}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-[0.5px] border-slate-100 dark:border-slate-800 transition-colors">
                <div className="bg-blue-100 dark:bg-blue-500/20 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
                  <Building2 size={10} />
                </div>
                <div>
                  <p className="text-[7px] uppercase tracking-[0.1em] text-muted-foreground font-bold">
                    Empresas
                  </p>
                  <p className="font-black text-xs text-slate-950 dark:text-white leading-none">
                    {displayData.companies_count}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-[0.5px] border-slate-100 dark:border-slate-800 transition-colors">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Package size={10} />
                </div>
                <div>
                  <p className="text-[7px] uppercase tracking-[0.1em] text-muted-foreground font-bold">
                    Produtos
                  </p>
                  <p className="font-black text-xs text-slate-950 dark:text-white leading-none">
                    {displayData.products_count}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center justify-between w-full group/btn mt-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors group-hover/btn:text-primary">
                Ver Detalhes
              </span>
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-muted-foreground group-hover/btn:bg-primary group-hover/btn:text-white transition-all duration-300 transform group-hover/btn:rotate-[-45deg]">
                <ArrowRight size={16} />
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
