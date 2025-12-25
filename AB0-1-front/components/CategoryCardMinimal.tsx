'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, Package, Layers, Star } from 'lucide-react';
import Image from 'next/image';

interface CategoryCardMinimalProps {
  category: {
    id: number;
    name: string;
    short_description?: string;
    logo?: { url: string } | null;
    banner_url?: string | null;
    icon_url?: string | null;
    seo_url?: string;
    companies_count?: number;
    products_count?: number;
    reviews_count?: number;
  };
  className?: string;
}

export default function CategoryCardMinimal({ category, className = "" }: CategoryCardMinimalProps) {
  const [imageError, setImageError] = useState(false);

  // Prioridade: icon_url > logo > banner_url > placeholder
  const iconUrl = category?.icon_url;
  const logoUrl = category?.logo?.url;
  const imageUrl = !imageError && (iconUrl || logoUrl || category?.banner_url)
    ? (iconUrl || logoUrl || category.banner_url)
    : null;

  const displayData = {
    name: category?.name || 'Categoria',
    description: category?.short_description || '',
    companies_count: category?.companies_count ?? 0,
    products_count: category?.products_count ?? 0,
    reviews_count: category?.reviews_count ?? 0,
    seo_url: category?.seo_url ? `categories/${category.seo_url}` : `categories/${category.id}`,
  };

  return (
    <motion.div
      className={`group relative bg-white border border-gray-200 rounded-lg p-4 
                  hover:shadow-lg hover:border-gray-300 transition-all duration-200 ${className}`}
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header: Nome e Contadores */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900 flex-1 leading-tight">
          {displayData.name}
        </h3>
        
        {/* Contadores no canto superior direito */}
        <div className="flex flex-col items-end gap-1 ml-2">
          {displayData.companies_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Building2 className="h-3.5 w-3.5" />
              <span className="font-medium">{displayData.companies_count}</span>
            </div>
          )}
          {displayData.products_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Package className="h-3.5 w-3.5" />
              <span className="font-medium">{displayData.products_count}</span>
            </div>
          )}
          {displayData.reviews_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              <span className="font-medium">{displayData.reviews_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* Logo/Ícone Centralizado */}
      <div className="flex items-center justify-center mb-4 h-32">
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={displayData.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 
                          flex items-center justify-center border border-blue-200">
            <Layers className="h-10 w-10 text-blue-600" />
          </div>
        )}
      </div>

      {/* Descrição (se houver) */}
      {displayData.description && (
        <p className="text-sm text-gray-600 text-center line-clamp-2 leading-snug">
          {displayData.description}
        </p>
      )}

      {/* Overlay clicável */}
      <Link
        href={`/${displayData.seo_url}`}
        className="absolute inset-0 z-10"
        aria-label={`Ver categoria ${displayData.name}`}
      />
    </motion.div>
  );
}
