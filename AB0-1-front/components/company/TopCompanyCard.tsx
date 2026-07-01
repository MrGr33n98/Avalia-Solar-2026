'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Building2, Trophy, Info } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { RatingStars } from '@/components/RatingStars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath } from '@/lib/slug';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';
import { isCardFeatureEnabled } from '@/components/CompanyCard';

interface Props {
  company: Company;
  rank: number; // 1, 2, 3...
  className?: string;
}

const RANK_COLORS = {
  1: { border: 'border-[#D4AF37]', bg: 'bg-[#D4AF37]/10', text: 'text-[#D4AF37]', label: 'Ouro' },
  2: { border: 'border-[#C0C0C0]', bg: 'bg-[#C0C0C0]/10', text: 'text-[#C0C0C0]', label: 'Prata' },
  3: { border: 'border-[#CD7F32]', bg: 'bg-[#CD7F32]/10', text: 'text-[#CD7F32]', label: 'Bronze' },
} as const;

export default function TopCompanyCard({ company, rank, className }: Props) {
  const { id, name, city, state, description } = company;
  const sponsored = (company as any).sponsored === true;
  const rating_count = Number((company as any).rating_count ?? (company as any).reviews_count ?? (company as any).total_reviews ?? 0);
  const average_rating = parseFloat((company as any).rating_avg ?? (company as any).average_rating ?? (company as any).rating ?? 0);

  // Feature gate: "Pedir orçamento" é feature paga controlada via ActiveAdmin
  const featureAccessMap = (company as any).feature_access ?? {};
  const hasFeatureAccess = Object.keys(featureAccessMap).length > 0;
  const canRequestQuote  = hasFeatureAccess
    ? isCardFeatureEnabled(featureAccessMap, 'custom_ctas')
    : sponsored; // fallback: só patrocinados têm CTA de orçamento
  
  const rankStyle = RANK_COLORS[rank as keyof typeof RANK_COLORS] || { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-400', label: `#${rank}` };
  const companyPath = buildCompanyPath(company.slug || String(id));
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);

  const handleRankingClick = () => {
    track('ranking_click', {
      company_id: id,
      rank: rank,
      company_name: name,
      source: 'top_ranking_card'
    });
  };

  return (
    <Card
      onClick={handleRankingClick}
      className={cn(
        'group relative flex flex-col h-full bg-white transition-all duration-300 hover:shadow-xl hover:scale-[1.05] border-2 cursor-pointer',
        rankStyle.border,
        className
      )}
    >
      {/* Rank Badge / Trophy */}
      <div className={cn(
        "absolute -top-3 -left-3 z-30 flex items-center justify-center w-10 h-10 rounded-full shadow-lg border-2",
        rankStyle.bg, rankStyle.border, rankStyle.text
      )}>
        <Trophy className="w-5 h-5 fill-current" />
      </div>

      {/* Sponsored Badge with Tooltip */}
      {sponsored && (
        <div className="absolute top-2 right-2 z-30">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-[10px] font-bold py-0 h-5 border-slate-200 text-slate-700 cursor-help shadow-sm">
                  PATROCINADO <Info className="ml-1 w-3 h-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-[11px] bg-slate-900 text-white border-none shadow-xl">
                <p>Destaque Patrocinado – empresa que investe na qualidade e visibilidade no AvaliaSolar.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className="relative overflow-hidden">
        <AspectRatio ratio={16 / 9}>
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt={`Banner ${name}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-slate-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </AspectRatio>
        
        <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
          <CompanyLogo
            logoUrl={company.logo_url}
            name={name}
            size="sm"
            className="border-2 border-white dark:border-slate-800 shadow-md flex-shrink-0 bg-white"
          />
          <div className="mb-0.5">
            <h3 className="text-white font-black text-lg leading-tight line-clamp-1 group-hover:text-amber-200 transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-white/80 text-[10px] font-bold uppercase tracking-wider">
              <MapPin className="w-3 h-3" /> {city}, {state}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-center justify-between gap-2">
          <RatingStars rating={average_rating} count={rating_count} showCount={true} />
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {description || "Especialista em soluções energéticas de alta performance."}
        </p>

        <div className="mt-auto pt-2 flex gap-2">
          {/* Botão "Pedir orçamento" — feature paga, estilo laranja diferenciado */}
          {canRequestQuote ? (
            <Button
              className="flex-1 h-11 rounded-xl bg-[#FFF7ED] hover:bg-[#FFEED5] border border-[#FDBA74] text-[#C2410C] font-bold text-xs shadow-none"
              onClick={(e) => {
                e.stopPropagation();
                openLeadModal({ preferredCompanyId: id, source: 'top-company-card', type: 'quick' });
              }}
            >
              Pedir orçamento
            </Button>
          ) : null}
          <Button
            variant="outline"
            className={cn(
              "h-11 rounded-xl border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50",
              !canRequestQuote && "flex-1"
            )}
            asChild
          >
            <Link href={companyPath} title={`Ver detalhes de ${name}`}>Ver Perfil</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
