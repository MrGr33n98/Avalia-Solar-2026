'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, ChevronDown, X, Star, MapPin, Shield, Clock, ExternalLink, Zap, Briefcase, ArrowRight } from 'lucide-react';
import { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { getFullImageUrl } from '@/utils/image';
import Link from 'next/link';
import Image from 'next/image';
import { track } from '@/lib/analytics/lazy';
import { openLeadModal } from '@/lib/lead-engine';
import { cn } from '@/lib/utils';
import TrustScoreDial from '../TrustScoreDial';
import { 
  formatCompanyYears, 
  getCompanySignals, 
  getCompanyTrustScore 
} from '../compare-company-utils';

interface PremiumBannerMobileProps {
  company: Company;
  onDismiss: () => void;
}

export default function PremiumBannerMobile({ company, onDismiss }: PremiumBannerMobileProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatRating = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
  };

  const score = getCompanyTrustScore(company);
  const yearsLabel = formatCompanyYears(company);
  const signals = getCompanySignals(company).slice(0, 3);
  const highlightText = company.highlights || company.about || company.description;
  const bannerUrl = getFullImageUrl(company.banner_url || undefined);

  const handleQuoteClick = () => {
    track('premium_banner_clicked', {
      company_id: company.id,
      cta_type: 'quote',
      source: 'comparison_page',
    });
    openLeadModal({ preferredCompanyId: company.id, source: 'premium-banner', type: 'quick' });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      track('premium_banner_expanded', { company_id: company.id });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/20 p-4 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.3)] clay-surface clay-convex">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {bannerUrl ? (
          <>
            <Image 
              src={bannerUrl} 
              alt="" 
              fill 
              className="object-cover opacity-30 brightness-110" 
            />
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-white/95" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100/50" />
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
        <div 
          className="inline-flex items-center gap-2 rounded-full border border-amber-200/50 bg-amber-500/10 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 shadow-sm"
          role="status"
        >
          <Tag className="h-3 w-3" aria-hidden="true" />
          Patrocinado
        </div>

        <button
          onClick={onDismiss}
          aria-label="Fechar banner"
          className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-white/50 backdrop-blur-sm transition-all"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Main Content Row */}
      <div className="relative z-10 flex items-start gap-3">
        {/* Score & Logo Hybrid for Mobile */}
        <div className="flex flex-col items-center gap-2">
          {score !== null && (
            <div className="relative p-0.5 rounded-full bg-white/50 backdrop-blur-md shadow-sm border border-white/40">
              <TrustScoreDial score={score} size="sm" showLabel={false} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white/95 px-1.5 py-0.5 rounded-full border border-white text-[8px] font-black shadow-lg">
                {score}%
              </div>
            </div>
          )}
          
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] border border-white/40 bg-white/95 p-1 shadow-xl clay-surface clay-convex">
            <img
              src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
              alt={`Logo da ${company.name}`}
              className="h-full w-full scale-[1.10] object-contain"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="line-clamp-2 text-base font-black text-slate-900 tracking-tight leading-tight uppercase">
                {company.name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div 
                  className="flex items-center gap-1 text-[11px]"
                  role="img"
                >
                  <Star className="h-3 w-3 fill-current text-amber-500" aria-hidden="true" />
                  <span className="font-black text-slate-700">
                    {formatRating(company.rating_avg || company.average_rating)}
                  </span>
                  <span className="text-slate-400 font-bold">
                    ({company.rating_count || 0})
                  </span>
                </div>

                {company.verified && (
                  <span className="rounded-full border border-emerald-100/50 bg-emerald-500/10 backdrop-blur-md px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] text-emerald-700">
                    Verificada
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={toggleExpanded}
              aria-expanded={isExpanded}
              className="rounded-full bg-white/50 p-2 text-slate-500 backdrop-blur-sm border border-white/30 shadow-sm"
            >
              <ChevronDown 
                className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {yearsLabel && (
              <span className="rounded-full border border-blue-100/40 bg-white/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600 shadow-sm">
                {yearsLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="mt-4 space-y-4 border-t border-slate-200/50 pt-4">
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-600">
                <div className="flex items-center gap-2 bg-white/40 p-2 rounded-xl border border-white/30">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                  <span className="truncate">{company.city}, {company.state}</span>
                </div>
                
                {company.response_time_sla && (
                  <div className="flex items-center gap-2 bg-white/40 p-2 rounded-xl border border-white/30">
                    <Zap className="h-3.5 w-3.5 text-indigo-500" />
                    <span>SLA: {company.response_time_sla}</span>
                  </div>
                )}
              </div>

              {highlightText ? (
                <div className="bg-white/40 p-3 rounded-2xl border border-white/30 italic text-[11px] leading-relaxed text-slate-500">
                  "{highlightText}"
                </div>
              ) : null}

              {signals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {signals.map((signal) => (
                    <span
                      key={signal.key}
                      className="rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500"
                    >
                      {signal.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-2xl border-white/60 bg-white/40 backdrop-blur-md px-4 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-white/60"
        >
          <Link href={`/companies/${company.slug}`}>
            Ver Perfil
          </Link>
        </Button>

        <Button
          onClick={handleQuoteClick}
          className="h-11 rounded-2xl bg-blue-600 px-4 text-[11px] font-black uppercase tracking-widest text-white shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] hover:bg-blue-700 clay-btn-primary"
        >
          Cotar Agora
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
