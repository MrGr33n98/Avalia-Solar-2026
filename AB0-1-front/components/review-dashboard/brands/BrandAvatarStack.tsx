'use client';

import React from 'react';
import { BrandAvatar, type BrandAvatarSize } from './BrandAvatar';
import type { BrandCatalogItem } from '@/lib/api/brands';

export interface BrandAvatarStackProps {
  brands: BrandCatalogItem[];
  maxVisible?: number;
  size?: BrandAvatarSize;
  className?: string;
  onSelectBrand?: (brand: BrandCatalogItem) => void;
  onOverflowClick?: () => void;
}

export function BrandAvatarStack({
  brands,
  maxVisible = 6,
  size = 32,
  className = '',
  onSelectBrand,
  onOverflowClick,
}: BrandAvatarStackProps) {
  // Deduplicar marcas por ID
  const uniqueBrands = React.useMemo(() => {
    const seen = new Set<number>();
    return brands.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [brands]);

  if (uniqueBrands.length === 0) {
    return (
      <span className="text-xs text-slate-400 italic">
        Nenhuma marca vinculada
      </span>
    );
  }

  const visible = uniqueBrands.slice(0, maxVisible);
  const overflowCount = uniqueBrands.length - maxVisible;

  const badgeSizeClass =
    size === 24
      ? 'w-6 h-6 text-[10px]'
      : size === 28
      ? 'w-7 h-7 text-[10px]'
      : size === 40
      ? 'w-10 h-10 text-xs'
      : size === 48
      ? 'w-12 h-12 text-sm'
      : 'w-8 h-8 text-[11px]';

  return (
    <div
      className={`inline-flex items-center -space-x-2 overflow-visible ${className}`}
      aria-label={`Pilha de marcas: ${uniqueBrands.map((b) => b.name).join(', ')}`}
    >
      {visible.map((brand, index) => {
        const isClickable = Boolean(onSelectBrand);
        const avatar = (
          <BrandAvatar
            name={brand.name}
            logoUrl={brand.logo_url}
            initials={brand.initials}
            size={size}
            className="ring-2 ring-white hover:z-10 transition-transform hover:scale-105"
          />
        );

        if (isClickable) {
          return (
            <button
              key={brand.id || index}
              type="button"
              onClick={() => onSelectBrand?.(brand)}
              className="focus:outline-none focus:ring-2 focus:ring-[#17468D] rounded-full"
              title={brand.name}
              aria-label={`Ver detalhes da marca ${brand.name}`}
            >
              {avatar}
            </button>
          );
        }

        return (
          <span key={brand.id || index} title={brand.name}>
            {avatar}
          </span>
        );
      })}

      {overflowCount > 0 && (
        <button
          type="button"
          onClick={onOverflowClick}
          className={`relative z-10 inline-flex items-center justify-center rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold ring-2 ring-white hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#17468D] ${badgeSizeClass}`}
          aria-label={`Mais ${overflowCount} marcas. Clique para ver todas.`}
          title={`+${overflowCount} marcas`}
        >
          +{overflowCount}
        </button>
      )}
    </div>
  );
}
