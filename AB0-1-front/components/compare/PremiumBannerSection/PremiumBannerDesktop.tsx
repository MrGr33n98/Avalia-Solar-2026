'use client';

import { Tag, Info, X, Star, MapPin, Shield, Clock, ArrowRight, ExternalLink, Zap, Briefcase } from 'lucide-react';
import { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { getFullImageUrl } from '@/utils/image';
import Link from 'next/link';
import { track } from '@/lib/analytics/lazy';
import { openLeadModal } from '@/lib/lead-engine';
import { cn } from '@/lib/utils';
import TrustScoreDial from '../TrustScoreDial';

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

  const score = company.trust_score || 98; // Fallback to 98 as per requested mockup

  const handleQuoteClick = () => {
    track('premium_banner_clicked', {
      company_id: company.id,
      cta_type: 'quote',
      source: 'comparison_page',
    });
    openLeadModal({ preferredCompanyId: company.id, source: 'premium-banner', type: 'quick' });
  };

  return (
    <div className={cn(
      "relative overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] p-4 pr-10 shadow-2xl shadow-slate-200/50 flex items-center gap-8 transition-all hover:shadow-blue-100/50",
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
      <div className="flex items-center gap-6 ml-2">
        <div className="relative group/dial">
          <TrustScoreDial 
            score={score} 
            size="md" 
            showLabel={false}
            className="hover:scale-105 transition-transform cursor-help"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full shadow-md border border-slate-100 text-[10px] font-black text-slate-700">
            {score}%
          </div>
        </div>

        <div className={cn(
          "h-24 w-24 rounded-[2rem] bg-white p-4 flex items-center justify-center overflow-hidden border border-slate-100",
          "clay-surface clay-convex shadow-xl transition-all duration-500 hover:scale-110 hover:-rotate-2 group"
        )}>
          <img
            src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
            alt={`Logo da ${company.name}`}
            className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        </div>
      </div>

      {/* Main Info Section - Center Balanced */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 mb-3">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
            {company.name}
          </h3>
          
          {company.verified && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm shadow-emerald-100">
              <Shield className="h-2.5 w-2.5 fill-current" />
              Verificada
            </div>
          )}
          
          <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-xs font-black">{formatRating(company.rating_avg || company.average_rating)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-2 group/stat">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover/stat:bg-blue-600 group-hover/stat:text-white transition-colors duration-300">
              <Zap className="h-3 w-3 fill-current" />
            </div>
            <span>Power Intent</span>
          </div>
          <div className="flex items-center gap-2 group/stat">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover/stat:bg-indigo-600 group-hover/stat:text-white transition-colors duration-300">
              <Briefcase className="h-3 w-3 fill-current" />
            </div>
            <span>Elite Partner</span>
          </div>
          <div className="flex items-center gap-2 group/stat">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover/stat:bg-emerald-600 group-hover/stat:text-white transition-colors duration-300">
              <Shield className="h-3 w-3 fill-current" />
            </div>
            <span>Verified Pro</span>
          </div>
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
