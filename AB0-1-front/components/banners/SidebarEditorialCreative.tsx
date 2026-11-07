'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { BannerMedia } from './BannerMedia';
import { SponsoredBadge } from './SponsoredBadge';
import { cn } from '@/lib/utils';
import type { BannerData } from '@/components/BannerContainer';

export interface SidebarEditorialCreativeProps {
  banner: BannerData;
  priority?: boolean;
  onMediaError?: () => void;
  onMediaLoad?: () => void;
  onCtaClick?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Ilustração solar vetorial em SVG leve e elegante para o topo do card editorial (#EDF8FC).
 * Utilizada como background de alta qualidade quando o anunciante não fornece foto específica.
 */
function DefaultEditorialIllustration() {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#EDF8FC]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 300 125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full object-cover"
      >
        <circle cx="150" cy="25" r="48" fill="#BAE6FD" fillOpacity="0.45" />
        <circle cx="150" cy="25" r="32" fill="#7DD3FC" fillOpacity="0.55" />
        <circle cx="150" cy="25" r="18" fill="#FDE047" fillOpacity="0.9" />
        <path
          d="M30 110 L150 78 L270 110 L150 125 Z"
          fill="#38BDF8"
          fillOpacity="0.3"
        />
        <path
          d="M60 105 L150 82 L240 105 L150 118 Z"
          fill="#0284C7"
          fillOpacity="0.4"
        />
        <line x1="150" y1="82" x2="150" y2="118" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="105" y1="93" x2="105" y2="111" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="195" y1="93" x2="195" y2="111" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
      </svg>
    </div>
  );
}

export function SidebarEditorialCreative({
  banner,
  priority = false,
  onMediaError,
  onMediaLoad,
  onCtaClick,
  className,
  compact = false,
}: SidebarEditorialCreativeProps) {
  const headline = banner.headline?.trim() || banner.title?.trim() || '';
  const subtitle = banner.subtitle?.trim() || '';
  const ctaLabel = banner.cta_label?.trim() || 'Saiba Mais';
  const ctaHref = banner.cta_href || banner.link_url || banner.link || '#';
  const benefits = Array.isArray(banner.benefits) ? banner.benefits.filter(Boolean).slice(0, 4) : [];

  const isOutline = !banner.cta_variant || banner.cta_variant === 'outline';
  const isYellow = banner.cta_variant === 'solar_yellow';
  const isBlue = banner.cta_variant === 'primary_blue';

  return (
    <article
      className={cn(
        'group relative flex h-full w-full max-w-[300px] flex-col overflow-hidden',
        'rounded-xl border border-[#DDE4EC] bg-white',
        'shadow-[0_3px_12px_rgba(15,23,42,0.06)] transition-all duration-200 hover:shadow-md',
        className
      )}
      style={compact ? { minHeight: '250px', height: '250px' } : { minHeight: '500px' }}
      aria-label={`Anúncio editorial: ${headline}`}
    >
      {/* Top Media Container: 112–130px com fundo suave #EDF8FC */}
      <div className={cn('relative w-full shrink-0 overflow-hidden bg-[#EDF8FC]', compact ? 'h-[72px]' : 'h-[120px]')}>
        {banner.image_url ? (
          <BannerMedia
            src={banner.image_url}
            mobileSrc={banner.image_mobile_url}
            alt={banner.alt_text?.trim() || headline || 'Banner publicitário'}
            fit="cover"
            priority={priority}
            sizes="300px"
            onMediaLoad={onMediaLoad}
            onMediaError={onMediaError}
            className="h-full w-full"
          />
        ) : (
          <DefaultEditorialIllustration />
        )}

        {/* Badge Patrocinado Oficial Top-Right */}
        {banner.sponsored && (
          <SponsoredBadge className="top-2 right-2 md:top-2 md:right-2" />
        )}
      </div>

      {/* Content Area: Padding 18px com tipografia com alto contraste */}
      <div className={cn('flex min-h-0 flex-1 flex-col', compact ? 'p-3' : 'p-[18px]')}>
        {/* Headline: 17–18px, weight 700/750, line-height 1.3, text-[#0B2944] */}
        {headline && (
          <h3 className={cn('font-bold tracking-tight text-[#0B2944]', compact ? 'line-clamp-2 text-sm leading-[1.25]' : 'line-clamp-3 text-[17px] leading-[1.3]')}>
            {headline}
          </h3>
        )}

        {/* Subtitle: 12–13px, line-height 1.5, text-[#475569] */}
        {subtitle && (
          <p className={cn('text-[#475569]', compact ? 'mt-1 line-clamp-2 text-[11px] leading-[1.3]' : 'mt-2 line-clamp-4 text-[12.5px] leading-[1.5]')}>
            {subtitle}
          </p>
        )}

        {/* Lista de benefícios real (apenas se cadastrado formalmente) */}
        {!compact && benefits.length > 0 && (
          <ul className="mt-3.5 space-y-2 text-[12px] leading-[1.45] text-slate-700">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
                </span>
                <span className="line-clamp-2">{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA: Alinhado à base via mt-auto, min-height 40–44px, radius 8px */}
        {banner.cta_enabled !== false && (
          <div className={compact ? 'mt-auto pt-2' : 'mt-auto pt-4'}>
            <Link
              href={banner.id ? `/api/v1/banner_clicks/${banner.id}` : ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onCtaClick}
              className={cn(
                'inline-flex w-full items-center justify-center rounded-[8px] px-4 font-semibold transition-all',
                compact ? 'min-h-[34px] py-1 text-xs' : 'min-h-[42px] py-2 text-[13px]',
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
