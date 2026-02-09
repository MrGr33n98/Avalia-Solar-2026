'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, Package, Star, TrendingUp, Users } from 'lucide-react';
import { Category } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { buildCategoryPath } from '@/lib/slug';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/lazy';

interface CategoryCardProps {
  category: Category;
  className?: string;
  layout?: string;
}

export default function CategoryCard({ category, className = "" }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayData = {
    id: category?.id,
    name: category?.name || 'Categoria',
    description: category?.short_description || category?.description || '',
    banner_url: getFullImageUrl(category?.banner_url),
    seo_url: buildCategoryPath(category?.seo_url, category?.id),
    companies_count: category?.companies_count ?? 0,
    products_count: category?.products_count ?? 0,
    rating: category?.average_rating && Number(category.average_rating) > 0 
      ? Number(category.average_rating).toFixed(1) 
      : 'Nova',
    featured: category?.featured,
    average_price: category?.average_price && Number(category.average_price) > 0
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(category.average_price))
      : null,
    tags: category?.tags || [],
    badges: category?.badges || []
  };

  return (
    <div
      className={cn("h-full animate-in fade-in slide-in-from-bottom-4 duration-500", className)}
    >
      <Link 
        href={displayData.seo_url} 
        className="block h-full group outline-none"
        onClick={() => {
          track('category_card_click', {
            category_id: displayData.id,
            category_name: displayData.name,
            element_type: 'card',
            action_type: 'click',
            destination_url: displayData.seo_url
          });
        }}
      >
        <Card 
          className="h-full overflow-hidden border-border/40 bg-card hover:bg-accent/5 transition-all duration-300 hover:shadow-xl hover:border-primary/20 group-hover:-translate-y-1 flex flex-col"
          onMouseEnter={() => {
            setIsHovered(true);
            track('category_card_hover', {
              category_id: displayData.id,
              category_name: displayData.name,
              element_type: 'card',
              action_type: 'hover'
            });
          }}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image Header */}
          <div className="relative aspect-[3/2] overflow-hidden bg-muted">
             {displayData.banner_url ? (
               <Image
                 src={displayData.banner_url}
                 alt={displayData.name}
                 fill
                 className="object-cover transition-transform duration-700 group-hover:scale-110"
                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                 <Building2 className="w-12 h-12 text-gray-300" />
               </div>
             )}
             
             {/* Overlay Gradient */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />

             {/* Badge */}
             <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
               {displayData.featured && (
                 <Badge className="bg-primary text-primary-foreground border-none shadow-md px-2.5 py-0.5">
                   Destaque
                 </Badge>
               )}
               <Badge variant="secondary" className="bg-white/95 text-foreground backdrop-blur-sm border-none shadow-sm flex items-center gap-1 px-2 py-0.5">
                 <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                 <span className="font-bold text-xs">{displayData.rating}</span>
               </Badge>
             </div>

             {/* Title Overlay */}
             <div className="absolute bottom-0 left-0 right-0 p-4">
               <h3 className="text-xl font-bold text-white group-hover:text-primary-light transition-colors drop-shadow-md">
                 {displayData.name}
               </h3>
             </div>
          </div>

          <CardContent className="px-5 pb-4 pt-2 flex-grow space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {displayData.description}
            </p>
            
            {displayData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {displayData.tags.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>

          <Separator className="opacity-40" />

          <CardFooter className="px-5 py-3.5 bg-muted/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1.5" title="Empresas registradas">
                <Building2 className="w-3.5 h-3.5 text-primary/60" />
                <span className="font-semibold text-foreground/80">{displayData.companies_count}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Produtos/Serviços">
                <Package className="w-3.5 h-3.5 text-primary/60" />
                <span className="font-semibold text-foreground/80">{displayData.products_count}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-1 transition-transform">
              Explorar
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}
