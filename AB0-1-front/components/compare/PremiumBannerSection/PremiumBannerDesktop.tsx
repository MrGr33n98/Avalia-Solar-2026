'use client';

import { ArrowRight, Briefcase, Clock, ExternalLink, Shield, Star, X, Zap } from 'lucide-react';
import { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { getFullImageUrl } from '@/utils/image';
import Link from 'next/link';
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
    blue: 'border-blue-100 bg-blue-50/90 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50/90 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/90 text-amber-700',
    violet: 'border-violet-100 bg-violet-50/90 text-violet-700',
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

  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-[1.85rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.95))] p-3.5 pr-16 shadow-[0_26px_56px_-34px_rgba(15,23,42,0.45)] transition-all hover:shadow-[0_34px_72px_-40px_rgba(37,99,235,0.24)]",
        "clay-surface clay-convex",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-blue-50/45 to-transparent" />

      <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2">
        <div className="rounded-full border border-slate-200 bg-slate-900 px-2 py-2 text-[9px] font-black uppercase tracking-[0.24em] text-white shadow-lg [text-orientation:mixed] [writing-mode:vertical-rl]">
          Patroc.
        </div>
      </div>

      <div className="absolute right-11 top-3 z-20">
        <button
          onClick={onDismiss}
          aria-label="Fechar banner de empresa premium"
          className="p-1.5 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Trust Dial & Logo Combined Unit */}
      <div className="ml-1 flex items-center gap-3.5">
        <div className="relative">
          {score !== null ? (
            <>
              <TrustScoreDial 
                score={score} 
                size="md" 
                showLabel={false}
                className="cursor-help transition-transform hover:scale-105"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[10px] font-black text-slate-700 shadow-md">
                {scoreLabel}
              </div>
            </>
          ) : (
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-inner clay-surface clay-convex">
              <span className="text-xl font-black text-slate-700">—</span>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Trust</span>
            </div>
          )}
        </div>

        <div className={cn(
          "flex h-[4.3rem] w-[4.3rem] items-center justify-center overflow-hidden rounded-[1.45rem] border border-slate-100 bg-white p-1",
          "clay-surface clay-convex shadow-xl transition-all duration-500 hover:scale-[1.05] hover:-rotate-1"
        )}>
          <img
            src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
            alt={`Logo da ${company.name}`}
            className="h-full w-full scale-[1.14] object-contain transition-all duration-500"
          />
        </div>
      </div>

      {/* Main Info Section - Center Balanced */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <h3 className="text-xl font-black leading-none tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 xl:text-[1.7rem]">
            {company.name}
          </h3>
          
          {company.verified && (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600 shadow-sm shadow-emerald-100">
              <Shield className="h-2.5 w-2.5 fill-current" />
              Verificada
            </div>
          )}
          
          <div className="flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-xs font-black">{formatRating(company.rating_avg || company.average_rating)}</span>
          </div>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          {signals.map((signal) => (
            <span
              key={signal.key}
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] shadow-sm",
                toneClasses[signal.tone]
              )}
            >
              {signal.label}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500">
          {yearsLabel && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>{yearsLabel}</span>
            </div>
          )}

          {company.financing_enabled && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-blue-500" />
              <span>Financiamento disponível</span>
            </div>
          )}

          {company.response_time_sla && (
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-indigo-500" />
              <span>{company.response_time_sla}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section - Right Aligned */}
      <div className="flex shrink-0 flex-col items-end gap-2 pr-1">
        <Button
          onClick={handleQuoteClick}
          className="h-11 rounded-[1.15rem] border-t border-white/20 bg-blue-600 px-7 text-white shadow-xl shadow-blue-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-700"
        >
          Cotar Agora
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Link 
          href={`/companies/${company.slug}`}
          className="flex items-center gap-2 pr-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 transition-colors hover:text-blue-600"
        >
          Explorar Detalhes
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
