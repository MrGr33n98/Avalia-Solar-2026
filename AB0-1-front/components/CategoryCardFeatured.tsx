'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/lib/api';
import { ArrowUpRight, TrendingUp, Users, Star, Zap, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buildCategoryPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';

interface CategoryCardFeaturedProps {
  category: Category;
  className?: string;
}

export default function CategoryCardFeatured({ category, className }: CategoryCardFeaturedProps) {
  const seoUrl = buildCategoryPath(category.seo_url, category.id);
  
  const companiesCount = category.companies_count || 0;
  const productsCount = category.products_count || 0;
  const rating = (category as any).average_rating || 4.5;
  const reviewsCount = (category as any).reviews_count || 0;

  // Image handling
  const iconUrl = (category as any).icon_url;
  const logoUrl = category.logo?.url;
  const bannerUrl = category.banner_url;
  const rawImageUrl = iconUrl || logoUrl || bannerUrl;
  const imageUrl = getFullImageUrl(rawImageUrl);

  return (
    <Link 
      href={seoUrl} 
      className={cn(
        "block group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-blue-200", 
        className
      )}
    >
      {/* Background & Overlay - Updated to Corporate Blue Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 transition-transform duration-500 group-hover:scale-105" />
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
      
      {/* Image/Icon Background (if available) - Low opacity overlay */}
      {imageUrl && (
        <div className="absolute inset-0 opacity-10 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-20">
          <Image
            src={imageUrl}
            alt={category.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="relative p-5 flex flex-col h-full justify-between text-white">
        
        {/* Header: Tag & Icon */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-blue-100 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
            <TrendingUp className="w-3 h-3" />
            <span>Destaque</span>
          </div>
          <div className="bg-white/20 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
            <ArrowUpRight className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2 leading-tight group-hover:translate-x-1 transition-transform duration-300 drop-shadow-sm">
            {category.name}
          </h3>
          <p className="text-blue-50 text-xs sm:text-sm line-clamp-2 leading-relaxed opacity-90 font-medium">
            {category.short_description || category.description || 'Soluções completas em energia solar.'}
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {companiesCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/10 px-2 py-1 rounded-md backdrop-blur-sm">
              <Users className="w-3 h-3" />
              <span>{companiesCount}</span>
            </div>
          )}
          {productsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/10 px-2 py-1 rounded-md backdrop-blur-sm">
              <Package className="w-3 h-3" />
              <span>{productsCount}</span>
            </div>
          )}
          {reviewsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/10 px-2 py-1 rounded-md backdrop-blur-sm">
              <Star className="w-3 h-3 fill-white/50" />
              <span>{rating}</span>
            </div>
          )}
          {!companiesCount && !reviewsCount && (
             <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/10 px-2 py-1 rounded-md backdrop-blur-sm">
               <Zap className="w-3 h-3" />
               <span>Ver opções</span>
             </div>
          )}
        </div>
      </div>
    </Link>
  );
}
