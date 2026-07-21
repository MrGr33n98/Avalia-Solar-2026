'use client';

import { ArrowRight, Briefcase, Clock, ExternalLink, Shield, Star, X, Zap } from 'lucide-react';
import { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { getFullImageUrl } from '@/utils/image';
import Link from 'next/link';
import Image from 'next/image';
import { track } from '@/lib/analytics/lazy';
import { openLeadModal } from '@/lib/lead-engine';
import { cn } from '@/lib/utils';
import TrustScoreDial from '../TrustScoreDial';
import { useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';
import {
  formatCompanyYears,
  getCompanySignals,
  getCompanyTrustScore,
} from '../compare-company-utils';

interface PremiumBannerDesktopProps {
  company: Company;
  onDismiss: () => void;
  className?: string;
}

export default function PremiumBannerDesktop({ company, onDismiss, className }: PremiumBannerDesktopProps) {
  const formatRating = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
  };

  const score = getCompanyTrustScore(company);
  const signals = getCompanySignals(company).slice(0, 2);
  const scoreLabel = score !== null ? `${score}%` : 'Sem score';
  const yearsLabel = formatCompanyYears(company);
  const toneClasses = {
    blue: 'border-blue-100/50 bg-blue-50/40 text-blue-700 backdrop-blur-md',
    emerald: 'border-emerald-100/50 bg-emerald-50/40 text-emerald-700 backdrop-blur-md',
    amber: 'border-amber-100/50 bg-amber-50/40 text-amber-700 backdrop-blur-md',
    violet: 'border-violet-100/50 bg-violet-50/40 text-violet-700 backdrop-blur-md',
  } as const;

  const handleQuoteClick = () => {
    track('premium_banner_clicked', {
      company_id: company.id,
      cta_type: 'quote',
      source: 'comparison_page',
    });
    openLeadModal({ preferredCompanyId: company.id, source: 'premium-banner', type: 'quick' });
  };

  const { onMouseEnter, onMouseLeave } = useHoverIntent(
    company.id,
    'premium_banner_detail',
    1500, // 1.5s reading time
    { 
      elementSelector: `premium-banner-${company.slug}`,
      metadata: { context: 'comparison_premium_banner' }
    }
  );

  const bannerUrl = getFullImageUrl(company.banner_url || undefined);

  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-[2.2rem] border border-white/20 p-4 pr-16 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.2)] transition-all hover:shadow-[0_45px_85px_-30px_rgba(37,99,235,0.25)]",
        "clay-surface clay-convex",
        className
      )}
    >
      {/* Dynamic Background Layer (Active Admin Media) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {bannerUrl ? (
          <>
            <Image 
              src={bannerUrl} 
              alt="" 
              fill 
              className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 brightness-110" 
            />
            {/* Glassmorphism Overlays */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] transition-all duration-300 group-hover:backdrop-blur-none group-hover:bg-white/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/60" />
        )}
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-blue-50/45 to-transparent z-10" />

      <div className="absolute right-3 top-1/2 z-30 -translate-y-1/2">
        <div className="rounded-full border border-white/20 bg-slate-900/90 backdrop-blur-md px-2 py-3 text-[9px] font-black uppercase tracking-[0.24em] text-white shadow-xl [text-orientation:mixed] [writing-mode:vertical-rl]">
          Patrocinado
        </div>
      </div>

      <div className="absolute right-11 top-4 z-30">
        <button
          onClick={onDismiss}
          aria-label="Fechar banner"
          className="p-1.5 rounded-full text-slate-400/60 hover:text-red-500 hover:bg-red-50/50 backdrop-blur-sm transition-all focus:outline-none"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Trust Dial & Logo Unit */}
      <div className="relative z-20 ml-1 flex items-center gap-4">
        <div className="relative">
          {score !== null ? (
            <>
              <div className="relative p-1 rounded-full bg-white/40 backdrop-blur-xl shadow-inner border border-white/30">
                <TrustScoreDial 
                  score={score} 
                  size="md" 
                  showLabel={false}
                  className="cursor-help transition-transform hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/50 bg-white/95 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-tight text-slate-700 shadow-xl backdrop-blur-md whitespace-nowrap text-center">
                {scoreLabel} <span className="text-[7px] opacity-40 block -mt-1 uppercase font-bold">Confiança</span>
              </div>
            </>
          ) : (
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/30 bg-white/40 backdrop-blur-xl text-slate-400 shadow-inner clay-surface clay-convex">
              <span className="text-xl font-black text-slate-700">—</span>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Score</span>
            </div>
          )}
        </div>

        <div className={cn(
          "flex h-[4.8rem] w-[4.8rem] items-center justify-center overflow-hidden rounded-[1.65rem] border border-white/40 bg-white/95 p-0",
          "clay-surface clay-convex shadow-2xl transition-all duration-500 hover:scale-[1.08] hover:-rotate-2"
        )}>
          <img
            src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
            alt={`Logo da ${company.name}`}
            className="h-full w-full object-contain transition-all duration-500"
          />
        </div>
      </div>

      {/* Main Info Section */}
      <div className="relative z-20 min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h3 className="text-2xl font-black leading-none tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 xl:text-[2rem]">
            {company.name}
          </h3>
          
          {company.verified && (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-100/50 bg-emerald-500/10 backdrop-blur-md px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600 shadow-sm">
              <Shield className="h-3 w-3 fill-current" />
              Verificada
            </div>
          )}
          
          <div className="flex items-center gap-1 rounded-full border border-amber-100/50 bg-amber-500/10 backdrop-blur-md px-3 py-1 text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-xs font-black">{formatRating(company.rating_avg || company.average_rating)}</span>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          {signals.map((signal) => (
            <span
              key={signal.key}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] shadow-sm transition-all hover:scale-105",
                toneClasses[signal.tone]
              )}
            >
              {signal.label}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-500/70">
          {yearsLabel && (
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/20">
              <Clock className="h-3.5 w-3.5 text-amber-500/70" />
              <span>{yearsLabel}</span>
            </div>
          )}

          {company.financing_enabled && (
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/20">
              <Briefcase className="h-3.5 w-3.5 text-blue-500/70" />
              <span>Financiamento disponível</span>
            </div>
          )}

          {company.response_time_sla && (
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/20">
              <Zap className="h-3.5 w-3.5 text-indigo-500/70" />
              <span>SLA: {company.response_time_sla}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-20 flex shrink-0 flex-col items-end gap-2 pr-1">
        <Button
          onClick={handleQuoteClick}
          className={cn(
            "h-12 rounded-[1.3rem] border-t border-white/30 bg-blue-600 px-8 text-white font-black uppercase tracking-widest text-[11px]",
            "shadow-[0_15px_30_rgba(37,99,235,0.4)] transition-all active:scale-95 hover:bg-blue-700 hover:-translate-y-0.5",
            "clay-btn-primary"
          )}
        >
          Cotar Agora
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Link 
          href={`/companies/${company.slug}`}
          className="flex items-center gap-2 pr-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-blue-600"
        >
          Explorar Detalhes
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
