'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Star, 
  Building2, 
  Package, 
  ChevronRight,
  Eye
} from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/lib/api';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export default function CategoryCard({ category, className = "" }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayData = {
    id: category?.id,
    name: category?.name || 'Nome da Categoria',
    description: category?.short_description || category?.description || 'Categoria de energia solar.',
    banner_url: !imageError && category?.banner_url
      ? category.banner_url
      : "/images/category-placeholder.svg",
    seo_url: category?.seo_url ? `categories/${category.seo_url}` : `categories/${category.id}`,
    featured: category?.featured || false,
    status: category?.status || 'active',
    companies_count: category?.companies_count ?? category?.companies?.length ?? 0,
    products_count: (category as any)?.products_count ?? category?.products?.length ?? 0
  };

  return (
    <motion.div
      className={`group relative flex flex-col h-full overflow-hidden rounded-lg bg-card text-card-foreground
                  border border-border shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)]
                  transition-all duration-300 ease-out ${className}`}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Featured Badge */}
      {displayData.featured && (
        <div className="absolute top-3 left-3 z-30">
          <Badge className="bg-blue-600 text-white px-2 py-1 text-xs font-medium shadow-sm">
            <Star className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-30">
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${displayData.status === 'active' 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' 
            : 'bg-muted text-muted-foreground'
          }
        `}>
          {displayData.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Banner Section */}
      <div className="relative w-full overflow-hidden aspect-[16/9]">
        {displayData.banner_url && !imageError ? (
          <div className="absolute inset-0 transition-opacity duration-200 group-hover:opacity-90">
            <Image
              src={displayData.banner_url}
              alt={`Banner da categoria ${displayData.name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            {displayData.name.charAt(0)}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

        {/* Logo (circular, 1:1, contorno 2px semitransparente) */}
        <div className="absolute left-4 bottom-4 z-20">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 aspect-square rounded-full overflow-hidden bg-background/95
                          ring-2 ring-black/10 dark:ring-white/15 shadow-sm">
            {category?.logo?.url ? (
              <Image
                src={category.logo.url}
                alt={`Logo da categoria ${displayData.name}`}
                fill
                sizes="56px"
                className="object-contain p-1"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-foreground/80">
                {displayData.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {displayData.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {displayData.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-foreground/90">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{displayData.companies_count}</span>
            <span className="text-muted-foreground">empresas</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-foreground/90">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{displayData.products_count}</span>
            <span className="text-muted-foreground">produtos</span>
          </div>
        </div>

        {/* CTA Button menor */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="sm"
            className="w-fit px-4 h-8 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Explorar
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </motion.div>
      </div>

      {/* Clickable Overlay */}
      <Link
        href={`/${displayData.seo_url}`}
        className="absolute inset-0 z-40"
        aria-label={`Ver detalhes da categoria ${displayData.name}`}
      />
    </motion.div>
  );
}
