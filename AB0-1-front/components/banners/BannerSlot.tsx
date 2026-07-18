'use client';

import React from 'react';
import { useBannersQuery } from '@/hooks/useBannersQuery';
import { BannerContainer } from '@/components/BannerContainer';
import { cn } from '@/lib/utils';

interface BannerSlotProps {
  placement: string;
  className?: string;
  fallback?: React.ReactNode;
  limit?: number;
  priority?: boolean;
  companyId?: number;
  blockCompetitors?: boolean;
}

export function BannerSlot({
  placement,
  className,
  fallback,
  limit = 3,
  priority = false,
  companyId,
  blockCompetitors = false
}: BannerSlotProps) {
  const { data: banners, isLoading, error } = useBannersQuery({
    position: placement,
    limit,
  });

  // Renderiza um skeleton suave de carregamento
  if (isLoading) {
    return (
      <div 
        className={cn(
          "w-full animate-pulse bg-slate-100 rounded-3xl min-h-[160px] sm:min-h-[160px] flex items-center justify-center border border-slate-200/50",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          <span className="text-xs font-bold text-slate-600">Carregando anúncio...</span>
        </div>
      </div>
    );
  }

  let finalBanners = banners || [];

  if (blockCompetitors && companyId) {
    finalBanners = finalBanners.filter(b => b.company_id === null || b.company_id === undefined || b.company_id === companyId);
  }

  // Slice to the actual limit
  finalBanners = finalBanners.slice(0, limit);
  // Se houver erros na API ou não houver banners ativos retornados
  if (error || finalBanners.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  // Adapter seguro para mapear as chaves opcionais e evitar erros TypeScript no build de produção
  const formattedBanners = finalBanners.map(b => ({
    id: b.id,
    alt_text: b.alt_text ?? null,
    banner_type: b.banner_type,
    position: b.position,
    image_url: b.image_url ?? null, // Mapeamento seguro de undefined para null
    title: b.title,
    link: b.link ?? null,
    link_url: b.link_url ?? null,
    sponsored: b.sponsored,
    company_id: b.company_id,
    width: b.width,
    height: b.height,
  }));

  return (
    <BannerContainer
      banners={formattedBanners}
      position={placement}
      priority={priority}
      page={placement.startsWith('compare_') ? 'compare' : undefined}
      className={className}
    />
  );
}
