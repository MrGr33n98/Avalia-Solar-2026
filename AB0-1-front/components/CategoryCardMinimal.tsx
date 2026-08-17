'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Package, Layers, Star } from 'lucide-react';
import Image from 'next/image';
import { buildCategoryPath } from '@/lib/slug';
import { getCategoryVisualAsset } from '@/lib/categoryVisualAssets';

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

export default function CategoryCardMinimal({
  category,
  className = '',
}: CategoryCardMinimalProps) {
  const [imageError, setImageError] = useState(false);

  const iconUrl = getCategoryVisualAsset(category?.seo_url, category?.name);
  const logoUrl = category?.logo?.url;
  const imageUrl =
    !imageError && (iconUrl || logoUrl || category?.banner_url)
      ? iconUrl || logoUrl || category.banner_url
      : null;

  const displayData = {
    name: category?.name || 'Categoria',
    description: category?.short_description || '',
    companies_count: category?.companies_count ?? 0,
    products_count: category?.products_count ?? 0,
    reviews_count: category?.reviews_count ?? 0,
    seo_url: buildCategoryPath(category?.seo_url, category?.id),
  };

  return (
    <div
      className={`group relative bg-white border border-gray-200 rounded-lg p-4 
                  hover:shadow-lg hover:border-gray-300 transition-all duration-200 ${className}`}
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
      {/* Área central da imagem: altura fixa com preenchimento sem distorcer em mobile */}
      <div className="mb-4 flex h-32 items-center justify-center">
        {imageUrl ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-gray-200 bg-white p-2 shadow-sm">
            <Image
              src={imageUrl}
              alt={displayData.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-1"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
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
        href={displayData.seo_url}
        className="absolute inset-0 z-10"
        aria-label={`Ver categoria ${displayData.name}`}
      />
    </div>
  );
}
