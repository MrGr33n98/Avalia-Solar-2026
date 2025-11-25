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
      className={`group relative flex flex-col h-full overflow-hidden rounded-xl bg-white
                  border border-gray-200 shadow-sm hover:shadow-md
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
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
          }
        `}>
          {displayData.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Banner Section */}
      <div className="relative h-24 w-full overflow-hidden">
        {displayData.banner_url && !imageError ? (
          <Image
            src={displayData.banner_url}
            alt={`Banner da categoria ${displayData.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            {displayData.name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {displayData.name}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {displayData.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{displayData.companies_count}</span>
            <span className="text-gray-500">empresas</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{displayData.products_count}</span>
            <span className="text-gray-500">produtos</span>
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
