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

  const getYearsInMarket = () => {
    return company.founded_year ? new Date().getFullYear() - company.founded_year : null;
  };

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
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-50/30 via-amber-50/20 to-yellow-50/30 border border-orange-100/50 rounded-2xl p-4 shadow-lg">
      {/* Sponsored Badge */}
      <div className="flex items-center justify-between mb-3">
        <div 
          className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold uppercase tracking-wider"
          role="status"
          aria-label="Conteúdo patrocinado"
        >
          <Tag className="h-3 w-3" aria-hidden="true" />
          Patrocinado
        </div>

        <button
          onClick={onDismiss}
          aria-label="Fechar banner de empresa premium"
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Collapsed View */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-white p-2 shadow-md border border-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
              alt={`Logo da ${company.name}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm line-clamp-1 text-slate-900">{company.name}</h3>
            <div 
              className="flex items-center gap-1 text-xs mt-1"
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
        </div>
        
        <button
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Ocultar detalhes' : 'Mostrar detalhes'}
          className="p-2 rounded-full text-slate-600 hover:bg-white/50 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <ChevronDown 
            className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-orange-100 pt-3">
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
                
                {getYearsInMarket() && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
                    <span>{getYearsInMarket()} anos de experiência</span>
                  </div>
                )}
              </div>

              <p className="text-slate-700 text-xs italic leading-relaxed">
                &ldquo;Empresa parceira Avalia Solar com benefícios exclusivos para clientes da plataforma.&rdquo;
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
                <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full">
                  ✓ Suporte Prioritário
                </span>
                <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full">
                  ✓ Resposta 2h
                </span>
                {company.financing_enabled && (
                  <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full">
                    ✓ Financiamento
                  </span>
                )}
              </div>

              {/* CTAs */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleQuoteClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Solicitar Orçamento
                  <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  onClick={handleProfileClick}
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Link href={`/companies/${company.slug}`}>
                    Ver Perfil Completo
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
