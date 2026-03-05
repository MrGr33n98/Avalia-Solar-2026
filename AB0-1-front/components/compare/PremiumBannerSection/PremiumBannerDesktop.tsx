'use client';

import { Tag, Info, X, Star, MapPin, Shield, Clock, ArrowRight, ExternalLink } from 'lucide-react';
import { Company } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { getFullImageUrl } from '@/utils/image';
import Link from 'next/link';
import { track } from '@/lib/analytics/lazy';
import { openLeadModal } from '@/lib/lead-engine';

interface PremiumBannerDesktopProps {
  company: Company;
  onDismiss: () => void;
}

export default function PremiumBannerDesktop({ company, onDismiss }: PremiumBannerDesktopProps) {
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

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-50/30 via-amber-50/20 to-yellow-50/30 border border-orange-100/50 rounded-2xl p-6 shadow-lg">
      {/* Sponsored Badge */}
      <div className="flex items-center justify-between mb-4">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold uppercase tracking-wider"
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

      <div className="flex items-start gap-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          <div className="h-20 w-20 rounded-2xl bg-white p-3 shadow-md border border-orange-100 flex items-center justify-center overflow-hidden">
            <img
              src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
              alt={`Logo da ${company.name}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          
          {company.verified && (
            <div className="mt-2 flex items-center justify-center">
              <Shield className="h-4 w-4 text-emerald-500 fill-current" aria-hidden="true" />
              <span className="sr-only">Empresa verificada</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight line-clamp-1">
              {company.name}
            </h3>
            
            <div 
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700"
              role="img"
              aria-label={`Avaliação ${formatRating(company.rating_avg || company.average_rating)} de 5 estrelas, baseado em ${company.rating_count || 0} avaliações`}
            >
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span className="text-sm font-black">
                {formatRating(company.rating_avg || company.average_rating)}
              </span>
              <span className="text-xs">
                ({company.rating_count || 0})
              </span>
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-3 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
              {company.city}, {company.state}
            </span>
            {company.verified && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Verificada
              </span>
            )}
            {getYearsInMarket() && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
                {getYearsInMarket()} anos de experiência
              </span>
            )}
          </p>

          <p className="text-slate-700 text-sm mb-4 italic">
            &ldquo;Empresa parceira Avalia Solar com benefícios exclusivos para clientes da plataforma.&rdquo;
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-slate-600">
            <span className="flex items-center gap-1">✓ Suporte Prioritário</span>
            <span className="flex items-center gap-1">✓ Resposta em 2h</span>
            {company.financing_enabled && (
              <span className="flex items-center gap-1">✓ Financiamento</span>
            )}
            <span className="flex items-center gap-1">✓ Empresa Destacada</span>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleQuoteClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Solicitar Orçamento
              <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              onClick={handleProfileClick}
              className="border-orange-200 text-orange-700 hover:bg-orange-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Link href={`/companies/${company.slug}`}>
                Ver Perfil Completo
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Info button */}
      <button
        className="absolute top-4 right-12 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Informações sobre empresas premium"
        title="Empresas premium são parceiras verificadas com benefícios exclusivos"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
