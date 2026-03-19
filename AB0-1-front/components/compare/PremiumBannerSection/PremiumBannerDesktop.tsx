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
  const signals = getCompanySignals(company).slice(0, 3);
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
      "group relative flex items-center gap-6 overflow-hidden rounded-[2rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.94))] p-4 pr-10 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.45)] transition-all hover:shadow-[0_34px_72px_-36px_rgba(37,99,235,0.22)]",
      "clay-surface clay-convex",
      className
    )}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/10 to-transparent pointer-events-none" />
      
      {/* Patrocinado Badge - Floating Style */}
      <div className="absolute top-0 right-12 z-20">
        <div className="bg-slate-900 px-3 py-1 rounded-b-xl shadow-lg border-x border-b border-slate-800">
          <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Patrocinado</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onDismiss}
          aria-label="Fechar banner de empresa premium"
          className="p-1.5 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Trust Dial & Logo Combined Unit */}
      <div className="ml-1 flex items-center gap-4">
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
          "flex h-[4.75rem] w-[4.75rem] items-center justify-center overflow-hidden rounded-[1.6rem] border border-slate-100 bg-white p-2",
          "clay-surface clay-convex shadow-xl transition-all duration-500 hover:scale-110 hover:-rotate-2 group"
        )}>
          <img
            src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
            alt={`Logo da ${company.name}`}
            className="max-h-full max-w-full object-contain transition-all duration-500"
          />
        </div>
      </div>

      {/* Main Info Section - Center Balanced */}
      <div className="flex-1 min-w-0">
        <div className="mb-2 flex items-center gap-3">
          <h3 className="text-2xl font-black leading-none tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
            {company.name}
          </h3>
          
          {company.verified && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm shadow-emerald-100">
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

        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-500">
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
      <div className="flex flex-col items-end gap-3">
        <Button
          onClick={handleQuoteClick}
          className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-t border-white/20"
        >
          Cotar Agora
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>

        <Link 
          href={`/companies/${company.slug}`}
          className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2 pr-2"
        >
          Explorar Detalhes
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
