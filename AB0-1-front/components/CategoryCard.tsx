'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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

const MotionDiv = motion.div;

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
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("h-full", className)}
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
             <div className="absolute top-3 left-3 flex flex-col gap-2">
               {displayData.featured && (
                 <Badge variant="secondary" className="bg-white/90 text-primary hover:bg-white shadow-sm backdrop-blur-sm w-fit">
                   <TrendingUp className="w-3 h-3 mr-1" />
                   Destaque
                 </Badge>
               )}
               {displayData.badges.map((badge, idx) => (
                  <Badge key={idx} variant="outline" className="bg-black/50 text-white border-white/20 backdrop-blur-sm w-fit">
                    {badge.image_url && <Image src={badge.image_url} alt={badge.name} width={12} height={12} className="mr-1" />}
                    {badge.name}
                  </Badge>
               ))}
             </div>
          </div>

          <CardHeader className="pb-2 relative -mt-12 z-10 px-5">
             <div className="bg-background/95 backdrop-blur rounded-xl p-4 shadow-sm border border-border/50">
               <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                 {displayData.name}
               </h3>
               <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-foreground">{displayData.rating}</span>
                  </div>
                  <Separator orientation="vertical" className="h-3" />
                  <span>{displayData.companies_count} empresas</span>
                  {displayData.average_price && (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <span className="text-green-600 font-medium">{displayData.average_price}</span>
                    </>
                  )}
               </div>
             </div>
          </CardHeader>

          <CardContent className="px-5 pb-4 pt-2 flex-grow space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {displayData.description}
            </p>
            
            {displayData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {displayData.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                    {tag}
                  </span>
                ))}
                {displayData.tags.length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                    +{displayData.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="px-5 pb-5 pt-0 mt-auto">
            <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              Explorar Categoria
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </MotionDiv>
  );
}
