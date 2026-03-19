'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, ChevronDown, X, Star, MapPin, Shield, Clock, ExternalLink } from 'lucide-react';
import { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { getFullImageUrl } from '@/utils/image';
import Link from 'next/link';
import { track } from '@/lib/analytics/lazy';
import { openLeadModal } from '@/lib/lead-engine';
import { formatCompanyYears, getCompanySignals } from '../compare-company-utils';

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

  const yearsLabel = formatCompanyYears(company);
  const signals = getCompanySignals(company).slice(0, 3);
  const highlightText = company.highlights || company.about || company.description;

  const handleQuoteClick = () => {
    track('premium_banner_clicked', {
      company_id: company.id,
      cta_type: 'quote',
      source: 'comparison_page',
    });
    openLeadModal({ preferredCompanyId: company.id, source: 'premium-banner', type: 'quick' });
  };

  const handleProfileClick = () => {
    track('premium_banner_clicked', {
      company_id: company.id,
      cta_type: 'profile',
      source: 'comparison_page',
    });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      track('premium_banner_expanded', { company_id: company.id });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-blue-100/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.95))] p-4 shadow-[0_24px_40px_-28px_rgba(15,23,42,0.38)] clay-surface clay-convex">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div 
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700"
          role="status"
          aria-label="Conteúdo patrocinado"
        >
          <Tag className="h-3 w-3" aria-hidden="true" />
          Patroc.
        </div>

        <button
          onClick={onDismiss}
          aria-label="Fechar banner de empresa premium"
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-blue-100 bg-white p-1 shadow-md clay-surface clay-convex">
          <img
            src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
            alt={`Logo da ${company.name}`}
            className="h-full w-full scale-[1.14] object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-sm font-black text-slate-900">{company.name}</h3>
              <div 
                className="mt-1 flex items-center gap-1 text-xs"
                role="img"
                aria-label={`Avaliação ${formatRating(company.rating_avg || company.average_rating)} de 5 estrelas, baseado em ${company.rating_count || 0} avaliações`}
              >
                <Star className="h-3 w-3 fill-current text-amber-500" aria-hidden="true" />
                <span className="font-bold text-slate-700">
                  {formatRating(company.rating_avg || company.average_rating)}
                </span>
                <span className="text-slate-500">
                  ({company.rating_count || 0})
                </span>
              </div>
            </div>

            <button
              onClick={toggleExpanded}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Ocultar detalhes' : 'Mostrar detalhes'}
              className="rounded-full p-2 text-slate-600 transition-colors hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {company.verified && (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                Verificada
              </span>
            )}

            {yearsLabel && (
              <span className="rounded-full border border-blue-100 bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                {yearsLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr,auto] gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          onClick={handleProfileClick}
          className="h-10 rounded-[0.95rem] border-blue-200 bg-white/90 font-bold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Link href={`/companies/${company.slug}`}>
            Ver Perfil
          </Link>
        </Button>

        <Button
          onClick={handleQuoteClick}
          className="h-10 rounded-[0.95rem] bg-blue-600 px-4 font-black text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-700"
        >
          Cotar
          <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-blue-100 pt-3">
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                  <span>{company.city}, {company.state}</span>
                </div>
                
                {company.verified && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Verificada</span>
                  </div>
                )}
                
                {yearsLabel && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
                    <span>{yearsLabel}</span>
                  </div>
                )}
              </div>

              {highlightText ? (
                <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
                  {highlightText}
                </p>
              ) : null}

              {signals.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
                  {signals.map((signal) => (
                    <span
                      key={signal.key}
                      className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 font-bold uppercase tracking-[0.14em] text-slate-600"
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
    </div>
  );
}
