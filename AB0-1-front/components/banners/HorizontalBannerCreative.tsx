'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { BannerMedia } from './BannerMedia';
import { SponsoredBadge } from './SponsoredBadge';
import { cn } from '@/lib/utils';
import type { BannerData } from '@/components/BannerContainer';

export interface HorizontalBannerCreativeProps {
  banner: BannerData;
  priority?: boolean;
  onMediaError?: () => void;
  onMediaLoad?: () => void;
  onBannerClick?: () => void;
  sizes?: string;
  ambientBackground?: boolean;
  className?: string;
}

export function HorizontalBannerCreative({
  banner,
  priority = false,
  onMediaError,
  onMediaLoad,
  onBannerClick,
  sizes,
  ambientBackground = false,
  className,
}: HorizontalBannerCreativeProps) {
  const headline = banner.headline?.trim() || banner.title?.trim() || '';
  const subtitle = banner.subtitle?.trim() || '';
  const ctaLabel = banner.cta_label?.trim() || 'Saiba Mais';
  const ctaHref = banner.cta_href || banner.link_url || banner.link || '#';
  const benefits = Array.isArray(banner.benefits) ? banner.benefits.filter(Boolean).slice(0, 2) : [];

  const isOutline = !banner.cta_variant || banner.cta_variant === 'outline';
  const isYellow = banner.cta_variant === 'solar_yellow';
  const isBlue = banner.cta_variant === 'primary_blue';

  const destinationUrl = banner.id ? `/api/v1/banner_clicks/${banner.id}` : ctaHref;

  return (
    <article
      data-testid="horizontal-banner-creative"
      className={cn(
        'group relative flex h-full w-full min-w-0 max-w-none flex-row items-stretch overflow-hidden',
        'rounded-xl border border-[#DDE4EC] bg-white',
        'shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 hover:shadow-md',
        className
      )}
      aria-label={`Anúncio: ${headline}`}
    >
      {/* 1. Mídia / Arte Visual Lateral (apenas se existir imagem cadastrada) */}
      {banner.image_url ? (
        <div className="relative h-full w-[28%] sm:w-[32%] md:w-[35%] lg:w-[36%] shrink-0 overflow-hidden bg-[#EDF8FC]">
          <BannerMedia
            src={banner.image_url}
            mobileSrc={banner.image_mobile_url}
            alt={banner.alt_text?.trim() || headline || 'Banner publicitário'}
            fit="cover"
            priority={priority}
            sizes={sizes || '(max-width: 768px) 35vw, 400px'}
            ambientBackground={ambientBackground}
            onMediaLoad={onMediaLoad}
            onMediaError={onMediaError}
            className="absolute inset-0 h-full w-full"
          />
          {banner.sponsored && (
            <SponsoredBadge className="top-2 left-2 md:top-2 md:left-2" />
          )}
        </div>
      ) : null}

      {/* 2. Área de Conteúdo Tipográfico e Ação (ocupa 100% ou o restante proporcional) */}
      <div
        className={cn(
          'flex flex-1 flex-col justify-center p-3 sm:p-4 md:p-5 lg:p-6 min-w-0',
          !banner.image_url && 'bg-gradient-to-r from-[#F0F9FF] via-[#EBF6FC] to-[#F8FAFC]'
        )}
      >
        {!banner.image_url && banner.sponsored && (
          <div className="mb-2">
            <SponsoredBadge className="relative top-0 left-0" />
          </div>
        )}

        {/* Headline */}
        {headline && (
          <h3 className="line-clamp-2 text-xs sm:text-sm md:text-base lg:text-lg font-bold leading-tight tracking-tight text-[#0B2944]">
            {headline}
          </h3>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-1 line-clamp-2 text-[11px] sm:text-xs md:text-sm leading-relaxed text-[#475569]">
            {subtitle}
          </p>
        )}

        {/* Benefícios cadastrados (exibidos quando houver espaço) */}
        {benefits.length > 0 && (
          <ul className="mt-2 hidden sm:flex flex-wrap items-center gap-3 text-[11px] md:text-xs text-slate-700">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
                </span>
                <span className="truncate max-w-[200px]">{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA Button */}
        {banner.cta_enabled !== false && (
          <div className="mt-2 sm:mt-2.5 md:mt-3">
            <Link
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onBannerClick}
              className={cn(
                'inline-flex min-h-[32px] sm:min-h-[36px] md:min-h-[38px] items-center justify-center rounded-lg px-3 sm:px-4 py-1.5 text-xs md:text-sm font-semibold transition-all w-fit shadow-xs',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2',
                isOutline &&
                  'border border-[#2563EB] bg-transparent text-[#1D4ED8] hover:bg-blue-50 active:bg-blue-100',
                isYellow &&
                  'border border-transparent bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-sm',
                isBlue &&
                  'border border-transparent bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm'
              )}
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
