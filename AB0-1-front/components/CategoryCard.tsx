'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Building2, Package, Star, Sparkles } from 'lucide-react';
import { Category } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  category: Category;
  className?: string;
  index?: number;
}

/**
 * CategoryCard - component to display category info with premium design
 */
export default function CategoryCard({ category, className = "", index = 0 }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayData = {
    title: category.short_description || category.name,
    description: category.description,
    bannerUrl: getFullImageUrl(category.banner_url || category.icon_url),
    products_count: category.products_count || 0,
    companies_count: category.companies_count || 0,
    rating: category.average_rating || 0,
    featured: category.featured || false,
    path: buildCategoryPath(category.slug || category.seo_url || "")
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className={cn("h-full", className)}
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
            "h-full overflow-hidden transition-all duration-300 flex flex-col clay-card hover:shadow-2xl hover:border-primary/30 rounded-2xl bg-white dark:bg-slate-900",
            isHovered && "ring-2 ring-primary/10"
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
                  "object-cover transition-transform duration-700 ease-out",
                  isHovered ? "scale-105" : "scale-100"
                )}
                priority={index < 3}
             />
             
             {/* Dynamic Gradient Overlay - Subtler for depth only */}
             <div className={cn(
               "absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent transition-opacity duration-500",
               isHovered ? "opacity-40" : "opacity-30"
             )} />

             {/* Sweep Effect on Hover */}
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

             {/* Badges - Floating with Staggered Feel */}
             <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
               <AnimatePresence>
                 {displayData.featured && (
                   <motion.div
                     initial={{ x: 20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     className="bg-primary text-white shadow-lg shadow-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5"
                   >
                     <Sparkles className="w-3 h-3 animate-pulse" />
                     <span className="font-black uppercase text-[10px] tracking-[0.1em]">Destaque</span>
                   </motion.div>
                 )}
                 {displayData.rating > 0 && (
                   <motion.div
                     initial={{ x: 20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: 0.1 }}
                     className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20"
                   >
                     <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                     <span className="font-black text-xs text-slate-950 dark:text-white">{displayData.rating}</span>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>

          {/* New Floating Title Container - AS-EDS Clay Precision */}
          <div className="relative -mt-8 px-5 z-20">
            <motion.div 
              className="bg-white dark:bg-slate-800 p-4 rounded-xl clay-card clay-precision shadow-xl border border-white/50 dark:border-slate-700/50 flex items-center justify-between gap-4"
              animate={isHovered ? { y: -2, scale: 1.01 } : { y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <h3 className="text-slate-950 dark:text-white text-[1.1rem] font-black tracking-tight leading-tight flex-1">
                {displayData.title}
              </h3>
              <div className="bg-primary/10 dark:bg-primary/20 p-2.5 rounded-lg text-primary flex-shrink-0">
                <motion.div
                  animate={isHovered ? { rotate: [0, 15, -15, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Sparkles size={18} />
                </motion.div>
              </div>
            </motion.div>
          </div>

          <CardContent className="p-5 pt-6 flex-grow">
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed font-medium">
              {displayData.description}
            </p>
            
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                  <Building2 size={16} />
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Empresas</p>
                   <p className="font-black text-sm text-slate-950 dark:text-white">{displayData.companies_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Package size={16} />
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Produtos</p>
                   <p className="font-black text-sm text-slate-950 dark:text-white">{displayData.products_count}</p>
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
