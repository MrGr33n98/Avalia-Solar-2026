'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, Package, Star } from 'lucide-react';
import { Category } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { buildCategoryPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/lazy';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export default function CategoryCard({ category, className = "" }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayData = {
    id: category?.id,
    name: category?.name || 'Categoria',
    description: category?.short_description || category?.description || 'Encontre as melhores soluções em energia solar.',
    banner_url: getFullImageUrl(category?.banner_url),
    seo_url: buildCategoryPath(category?.seo_url, category?.id),
    companies_count: category?.companies_count ?? 0,
    products_count: category?.products_count ?? 0,
    rating: category?.average_rating && Number(category.average_rating) > 0
      ? Number(category.average_rating).toFixed(1)
      : null,
    featured: category?.featured,
    tags: category?.tags || []
  };

  return (
    <div className={cn("h-full animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
      <Link
        href={displayData.seo_url}
        className="block h-full group outline-none"
        onClick={() => {
          track('category_card_click', {
            category_id: displayData.id,
            category_name: displayData.name,
            element_type: 'card'
          });
        }}
      >
        <Card
          className="h-full overflow-hidden border-slate-200 bg-white transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] hover:border-blue-200 flex flex-col rounded-2xl"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 1. Image Header - Z-Pattern Start */}
          <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
             {displayData.banner_url ? (
               <Image
                 src={displayData.banner_url}
                 alt={displayData.name}
                 fill
                 className="object-cover transition-transform duration-700 group-hover:scale-110"
                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-slate-50">
                 <Building2 className="w-12 h-12 text-slate-200" />
               </div>
             )}

             {/* Overlay Gradient for Text Readability */}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />

             {/* Badges */}
             <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10">
               {displayData.featured && (
                 <Badge className="bg-blue-600 text-white border-none shadow-md px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider">
                   Destaque
                 </Badge>
               )}
               {displayData.rating && (
                 <Badge variant="secondary" className="bg-white/95 text-slate-900 backdrop-blur-sm border-none shadow-sm flex items-center gap-1 px-2 py-0.5">
                   <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                   <span className="font-black text-xs">{displayData.rating}</span>
                 </Badge>
               )}
             </div>
          </div>

          {/* 2. Content Body - Hierarchy & Z-Pattern */}
          <CardContent className="px-4 py-4 md:px-5 md:py-5 flex-grow space-y-2">
            <h3 className="text-xl md:text-2xl font-black text-slate-950 group-hover:text-blue-600 transition-colors tracking-tight leading-tight">
              {displayData.name}
            </h3>
            
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">
              {displayData.description}
            </p>

            <div className="flex items-center gap-3 pt-1">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-100/50 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                {displayData.companies_count} EMPRESAS
              </Badge>
              {displayData.products_count > 0 && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-800 border-blue-100/50 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                  {displayData.products_count} PRODUTOS
                </Badge>
              )}
            </div>
          </CardContent>

          {/* 3. Footer - Strong CTA */}
          <CardFooter className="px-4 py-4 md:px-5 md:py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              SOLUÇÕES SOLARES
            </div>

            <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-blue-100 group-hover:bg-blue-700 transition-all group-hover:translate-x-1">
              Explorar
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}
