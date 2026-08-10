'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, MoreHorizontal, ExternalLink, Info, EyeOff, Flag } from 'lucide-react';
import { useBannersQuery } from '@/hooks/useBannersQuery';
import { analyticsApi } from '@/lib/api-analytics';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const PromotedCompanyCard: React.FC = () => {
  const [hidden, setHidden] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionTrackedRef = useRef<string | null>(null);

  // Busca o banner lateral ativo configurado no Active Admin (slot_key / position: 'sidebar')
  const { data: banners } = useBannersQuery({
    position: 'sidebar',
    limit: 1,
  });

  const banner = banners && banners.length > 0 ? banners[0] : null;
  const bannerImage = banner?.image_url;
  const bannerTitle = banner?.title || 'WEG';
  const bannerLink = banner?.link_url || banner?.link || 'https://www.weg.net';

  useEffect(() => {
    const node = containerRef.current;
    if (
      !node ||
      !banner?.id ||
      impressionTrackedRef.current === `${banner.id}:${banner.delivery_id || ''}`
    )
      return;
    const trackImpression = () => {
      const impressionInstanceId = `${banner.id}:${banner.delivery_id || ''}`;
      if (impressionTrackedRef.current === impressionInstanceId) return;
      impressionTrackedRef.current = impressionInstanceId;
      void analyticsApi.trackBannerEvent({
        banner_id: banner.id,
        event_type: 'impression',
        impression_instance_id: impressionInstanceId,
        delivery_id: banner.delivery_id || undefined,
        metadata: { position: 'sidebar', slot_key: 'promoted_company_card' },
      });
    };
    if (typeof IntersectionObserver === 'undefined') {
      trackImpression();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
          trackImpression();
          observer.disconnect();
        }
      },
      { threshold: [0.5] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [banner?.id, banner?.delivery_id]);

  if (hidden) return null;

  return (
    <div
      ref={containerRef}
      className="bg-white border border-slate-200 p-5 rounded-none shadow-sm space-y-4 font-sans relative"
    >
      {/* Header with PROMOVIDO Label & Menu */}
      <div className="flex items-center justify-between">
        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 tracking-wider uppercase rounded-none">
          PROMOVIDO
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-slate-700 rounded-none"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none text-xs w-48 shadow-md">
            <DropdownMenuItem
              onClick={() =>
                alert('Este anúncio é exibido com base no seu interesse em soluções solares.')
              }
            >
              <Info className="mr-2 h-3.5 w-3.5 text-slate-500" /> Por que estou vendo isto?
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setHidden(true)}>
              <EyeOff className="mr-2 h-3.5 w-3.5 text-slate-500" /> Ocultar este anúncio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert('Obrigado pelo seu feedback.')}>
              <Flag className="mr-2 h-3.5 w-3.5 text-slate-500" /> Reportar anúncio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dynamic Active Admin Banner Image or Styled Card */}
      {bannerImage ? (
        <a
          href={banner?.id ? `/api/v1/banner_clicks/${banner.id}` : bannerLink}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="block group relative overflow-hidden border border-slate-200"
        >
          <Image
            src={bannerImage}
            alt={bannerTitle}
            width={600}
            height={600}
            sizes="(max-width: 1024px) 100vw, 300px"
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </a>
      ) : (
        <>
          {/* Fallback to Styled Card Layout */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center bg-blue-900 text-white font-extrabold text-sm border border-blue-950 shrink-0">
              WEG
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{bannerTitle}</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                Soluções completas em energia solar para residências, comércios e indústrias.
              </p>
            </div>
          </div>

          {/* Differentials Check List */}
          <ul className="space-y-1.5 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Inversores de alta performance</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Tecnologia brasileira</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Suporte técnico especializado</span>
            </li>
          </ul>
        </>
      )}

      {/* Sponsored CTA Link */}
      <a
        href={banner?.id ? `/api/v1/banner_clicks/${banner.id}` : bannerLink}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="inline-flex items-center justify-center w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors uppercase tracking-wider rounded-none gap-1.5"
      >
        Conhecer a empresa
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
};
