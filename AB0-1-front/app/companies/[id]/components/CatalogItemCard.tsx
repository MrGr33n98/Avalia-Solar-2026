'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, Wrench, ArrowRight } from 'lucide-react';
import { getFullImageUrl } from '@/utils/image';

export interface CatalogItem {
  id: string;
  type: 'product' | 'service';
  product_id?: number | null;
  service_id?: number | null;
  name: string;
  short_description?: string | null;
  image_url?: string | null;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  position: number;
  cta: {
    label: string;
    href: string;
  };
}

interface CatalogItemCardProps {
  item: CatalogItem;
}

export default function CatalogItemCard({ item }: CatalogItemCardProps) {
  const imageUrl = item.image_url ? getFullImageUrl(item.image_url) : null;
  const isProduct = item.type === 'product';
  const categoryName = item.category?.name || (isProduct ? 'Equipamento' : 'Serviço');

  return (
    <article
      data-testid={`catalog-item-${item.id}`}
      className="
        group relative flex h-full w-full min-w-0 flex-col
        rounded-[12px] border border-slate-200/90 bg-white p-2.5 sm:p-3
        shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-150
        hover:border-blue-300 hover:shadow-md
      "
    >
      {/* ---------------------------------------------------------------- */}
      {/* IMAGEM DO ITEM                                                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative mb-2.5 aspect-square w-full overflow-hidden rounded-[8px] bg-slate-50 flex items-center justify-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 220px"
            className={
              isProduct
                ? 'object-contain p-1.5 transition-transform duration-200 group-hover:scale-105'
                : 'object-cover transition-transform duration-200 group-hover:scale-105'
            }
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            {isProduct ? (
              <Package className="h-8 w-8 stroke-[1.5]" />
            ) : (
              <Wrench className="h-8 w-8 stroke-[1.5]" />
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* BADGE DA CATEGORIA                                               */}
      {/* ---------------------------------------------------------------- */}
      <span className="mb-1.5 inline-block w-fit max-w-full truncate rounded-[5px] bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-semibold text-[#1E40AF]">
        {categoryName}
      </span>

      {/* ---------------------------------------------------------------- */}
      {/* NOME DO ITEM                                                     */}
      {/* ---------------------------------------------------------------- */}
      <h4
        className="mb-1 line-clamp-2 text-xs font-bold leading-snug text-slate-900 group-hover:text-blue-600 sm:text-[13px]"
        title={item.name}
      >
        {item.name}
      </h4>

      {/* ---------------------------------------------------------------- */}
      {/* ATRIBUTO / MICROCOPY                                             */}
      {/* ---------------------------------------------------------------- */}
      {item.short_description ? (
        <p className="mb-3 line-clamp-1 text-[11px] leading-tight text-slate-500">
          {item.short_description}
        </p>
      ) : (
        <div className="mb-3 h-[14px]" />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* CTA AMARELO TIPADO                                               */}
      {/* ---------------------------------------------------------------- */}
      <div className="mt-auto pt-1">
        <Link
          href={item.cta.href}
          aria-label={`${item.cta.label} ${item.name}`}
          className="
            relative flex h-9 w-full min-h-[36px] items-center justify-center gap-1.5
            rounded-[8px] bg-[#FCD34D] px-2.5 text-center text-xs font-semibold text-[#0F172A]
            shadow-sm transition-all duration-150
            hover:bg-[#FBBF24] hover:shadow
            active:scale-[0.98] active:bg-[#F59E0B]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600
            after:absolute after:-inset-1 after:content-['']
          "
        >
          <span>{item.cta.label}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" />
        </Link>
      </div>
    </article>
  );
}
