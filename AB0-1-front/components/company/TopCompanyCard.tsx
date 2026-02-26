'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Building2, Trophy, Info } from 'lucide-react';
import { RatingStars } from '@/components/RatingStars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/ui/tooltip';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { buildCompanyPath } from '@/lib/slug';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { cn } from '@/lib/utils';

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
  const { id, name, city, state, description, sponsored } = company;
  const rating_count = Number((company as any).rating_count || 0);
  const average_rating = parseFloat((company as any).rating_avg || 0);
  
  const rankStyle = RANK_COLORS[rank as keyof typeof RANK_COLORS] || { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-400', label: `#${rank}` };
  const companyPath = buildCompanyPath(company.slug, name, id);
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  return (
    <Card
      className={cn(
        'group relative flex flex-col h-full bg-white transition-all duration-300 hover:shadow-xl hover:scale-[1.05] border-2',
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
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-[10px] font-bold py-0 h-5 border-gray-100 text-gray-500 cursor-help">
                  PATROCINADO <Info className="ml-1 w-3 h-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-[11px] bg-slate-900 text-white border-none">
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
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border-2 border-white shadow-md flex-shrink-0">
            {logoUrl ? (
              <Image src={logoUrl} alt={`Logo ${name}`} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <Building2 className="text-gray-200 w-6 h-6" />
              </div>
            )}
          </div>
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
          <RatingStars rating={average_rating} count={rating_count} showCount={true} size="lg" />
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {description || "Especialista em soluções energéticas de alta performance."}
        </p>

        <div className="mt-auto pt-2 flex gap-2">
          <CTAPrimaryButton
            label="Orçamento"
            companyId={id.toString()}
            companySlug={company.slug}
            className="flex-1 h-10 rounded-xl bg-[#004791] hover:bg-[#00356b] font-bold text-xs"
          />
          <Button variant="outline" className="h-10 rounded-xl border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50" asChild>
            <Link href={companyPath}>Ver Perfil</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
