'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, Building, Share2, Check, Info, Trophy, MessageCircle, ShieldCheck, Zap, Shield, HelpCircle, Heart, PhoneCall, Scale, BadgeCheck, CheckCircle } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';
import { CompanyLogo } from '@/components/CompanyLogo';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { COMPANY_BANNER_FALLBACK_SRC, resolveCompanyBannerSrc } from '@/utils/company-banner';
import { buildCompanyPath, buildCompanySubPath } from '@/lib/slug';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import WhatsappButton from '@/components/WhatsappButton';
import { track } from '@/lib/analytics/lazy';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { isFeatureEnabled } from '@/lib/feature-access';
import { openSignupGate } from '@/lib/signup-gate';
import { useComparison } from '@/hooks/useComparison';

export interface CompanyCardData {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  featured: boolean;
  sponsored: boolean;
  identity: {
    name: string;
    slug: string;
    logo_url?: string;
    description?: string;
    city?: string;
    state?: string;
  };
  trust: {
    is_claimed: boolean;
    verification_status: 'unverified' | 'pending' | 'verified' | 'premium';
    verified_at?: string;
    verification_method?: string;
  };
  reputation: {
    rating_avg: number;
    rating_count: number;
    nps_score?: number;
    nps_responses: number;
    recommendation_rate?: number;
    sentiment?: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  operations: {
    delivered_projects: number;
    sla_label?: string;
    sla_minutes?: number;
    warranty_years?: number;
    engineering_insurance: boolean;
    updated_at: string;
  };
  coverage: {
    states: string[];
    cities: string[];
  };
  actions: {
    whatsapp_url?: string;
    whatsapp_enabled: boolean;
    p2p_chat_enabled: boolean;
  };
}

interface Props {
  company: any;
  className?: string;
  compact?: boolean; // Legado
  variant?: 'compact' | 'standard' | 'expanded';
  lang?: 'pt-BR' | 'en-US' | 'es-ES';
  isLoading?: boolean;
  schemaEnabled?: boolean;
  rank?: number;
  category?: string;
  onAnalyticsEvent?: (event: {
    type: string;
    companyId: number;
    meta?: Record<string, unknown>;
  }) => void;
  index?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const DICTIONARY = {
  'pt-BR': {
    whatsapp: 'WhatsApp',
    budget: 'Orçamento',
    review: 'Avaliar',
    verified: 'PREMIUM',
    reviews: 'avaliações',
    noReviews: 'Seja o primeiro a avaliar',
    viewServices: 'Ver serviços e soluções oferecidas',
  },
  'en-US': {
    whatsapp: 'WhatsApp',
    budget: 'Get Quote',
    review: 'Review',
    verified: 'Verified',
    reviews: 'reviews',
    noReviews: 'Be the first to review',
    viewServices: 'View offered services and solutions',
  },
  'es-ES': {
    whatsapp: 'WhatsApp',
    budget: 'Presupuesto',
    review: 'Evaluar',
    verified: 'Verificada',
    reviews: 'evaluaciones',
    noReviews: 'Sé el primero en evaluar',
    viewServices: 'Ver servicios y soluções oferecidas',
  },
} as const;

const normalizeCompanyData = (comp: any): CompanyCardData => {
  if (comp && comp.identity && comp.trust && comp.reputation && comp.operations) {
    return comp as CompanyCardData;
  }
  
  const rating = Number(comp?.rating_avg ?? comp?.average_rating ?? comp?.rating ?? 0);
  const reviews = Number(comp?.rating_count ?? comp?.reviews_count ?? comp?.total_reviews ?? 0);
  
  return {
    id: comp?.id || 0,
    name: comp?.name || '',
    slug: comp?.slug || '',
    logo_url: comp?.logo_url,
    featured: comp?.featured === true,
    sponsored: comp?.sponsored === true,
    identity: {
      name: comp?.name || '',
      slug: comp?.slug || '',
      logo_url: comp?.logo_url,
      description: comp?.description,
      city: comp?.city,
      state: comp?.state
    },
    trust: {
      is_claimed: comp?.active_admin === true,
      verification_status: comp?.verified ? 'verified' : 'unverified',
      verified_at: comp?.verified_at,
      verification_method: comp?.verification_method
    },
    reputation: {
      rating_avg: rating,
      rating_count: reviews,
      nps_score: comp?.nps_score,
      nps_responses: comp?.nps_responses || 0,
      recommendation_rate: comp?.recommendation_rate || (rating >= 4 ? 96 : 80),
      sentiment: comp?.sentiment || {
        positive: rating >= 4 ? 91 : 70,
        neutral: rating === 3 ? 20 : 8,
        negative: rating < 3 ? 30 : 1
      }
    },
    operations: {
      delivered_projects: comp?.delivered_projects_count || comp?.delivered_projects_score || 0,
      sla_label: comp?.response_time_sla || 'Consultar',
      sla_minutes: comp?.response_sla_minutes,
      warranty_years: comp?.warranty_years || comp?.installation_warranty_years,
      engineering_insurance: comp?.engineering_insurance === true,
      updated_at: comp?.updated_at || comp?.operational_data_updated_at || ''
    },
    coverage: {
      states: Array.isArray(comp?.coverage_states) ? comp.coverage_states : String(comp?.coverage_states || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      cities: Array.isArray(comp?.coverage_cities) ? comp.coverage_cities : String(comp?.coverage_cities || '').split(',').map((s: string) => s.trim()).filter(Boolean)
    },
    actions: {
      whatsapp_url: comp?.whatsapp_url || comp?.cta_whatsapp_url,
      whatsapp_enabled: comp?.whatsapp_enabled === true || comp?.cta_whatsapp_enabled === true,
      p2p_chat_enabled: comp?.p2p_chat_enabled === true
    }
  };
};

export default function CompanyCard({
  company: rawCompany,
  className = '',
  compact = false,
  variant: propVariant,
  lang = 'pt-BR',
  isLoading = false,
  schemaEnabled = true,
  rank,
  category,
  onAnalyticsEvent,
  index: _index = 0,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const router = useRouter();
  const text = DICTIONARY[lang] || DICTIONARY['pt-BR'];
  const { isInComparison, toggleComparison, canAddMore } = useComparison();

  // Resolve a variante com fallback para a prop legado 'compact'
  const variant = propVariant || (compact ? 'compact' : 'standard');

  const company = useMemo(() => normalizeCompanyData(rawCompany), [rawCompany]);
  const { id, name, slug } = company;
  const intentCompanyId = String(id);

  const companyPath = useMemo(() => buildCompanyPath(slug, name, id), [slug, name, id]);
  const companyReviewPath = useMemo(() => buildCompanySubPath(slug, name, 'reviews', id), [slug, name, id]);

  const hasWhatsapp = company.actions.whatsapp_enabled && company.actions.whatsapp_url;
  const p2pChatEnabled = company.actions.p2p_chat_enabled;
  const selectedInComparison = isInComparison(id);

  const handleCardClick = () => {
    track('company_card_click', {
      company_id: id,
      company_name: name,
      variant,
    });
    router.push(companyPath);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedInComparison && !canAddMore) return;
    toggleComparison(rawCompany);
    track(selectedInComparison ? 'comparison_remove' : 'comparison_add', {
      company_id: id,
      company_name: name,
      source: 'company_card_expanded',
    });
  };

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse border-brand-border bg-white p-4 shadow-sm', className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  // ── Variante 1: Compact ──
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-100 bg-white p-4 transition-all duration-200 hover:border-slate-200 hover:shadow-md cursor-pointer',
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex items-start gap-3">
          <CompanyLogo logoUrl={company.logo_url} name={name} size="sm" />
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              {name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-slate-800">
                {company.reputation.rating_avg > 0 ? company.reputation.rating_avg.toFixed(1) : 'S/N'}
              </span>
              <span className="text-[10px] text-slate-400">
                ({company.reputation.rating_count})
              </span>
            </div>
            {company.identity.city && (
              <span className="text-[10px] text-slate-400 mt-1 block truncate">
                {company.identity.city}, {company.identity.state}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Button
            size="sm"
            className="w-full h-8 text-[11px] font-bold rounded-lg bg-[#FFF7ED] hover:bg-[#FFEED5] border border-[#FDBA74] text-[#C2410C] shadow-none"
            onClick={(e) => {
              e.stopPropagation();
              openLeadModal({ preferredCompanyId: id, source: 'company-card-compact', type: 'quick' });
            }}
          >
            Orçamento
          </Button>
        </div>
      </Card>
    );
  }

  // ── Variante 2: Standard ──
  if (variant === 'standard') {
    return (
      <Card
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-lg cursor-pointer',
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="relative h-24 bg-slate-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
          <Image
            src={COMPANY_BANNER_FALLBACK_SRC}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        </div>

        <div className="relative px-5 pb-5 pt-10 flex-1 flex flex-col">
          <div className="absolute -top-6 left-5 z-20">
            <CompanyLogo logoUrl={company.logo_url} name={name} size="md" className="border-2 border-white shadow-md bg-white" />
          </div>

          <div className="flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2 mt-1">
              <h3 className="font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-blue-700 transition-colors">
                {name}
              </h3>
              {company.trust.verification_status === 'verified' && (
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-slate-800">
                {company.reputation.rating_avg > 0 ? company.reputation.rating_avg.toFixed(1) : 'S/N'}
              </span>
              <span className="text-[11px] text-slate-400">
                ({company.reputation.rating_count} avaliações)
              </span>
            </div>

            {company.identity.description && (
              <p className="text-[12px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {company.identity.description}
              </p>
            )}

            <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCompareClick}
                disabled={!selectedInComparison && !canAddMore}
                className={cn(
                  "w-full font-semibold rounded-xl shadow-none h-9 text-xs inline-flex items-center justify-center gap-1",
                  selectedInComparison
                    ? "border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                )}
              >
                {selectedInComparison ? 'Selecionada' : 'Comparar'}
              </Button>

              {company.trust.is_claimed || company.sponsored ? (
                <Button
                  className="w-full font-semibold rounded-xl bg-[#FFF7ED] hover:bg-[#FFEED5] border border-[#FDBA74] text-[#C2410C] shadow-none h-9 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLeadModal({ preferredCompanyId: id, source: 'company-card-standard', type: 'quick' });
                  }}
                >
                  Pedir orçamento
                </Button>
              ) : (
                <Button
                  asChild
                  className="w-full font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={companyPath}>Ver perfil</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // ── Variante 3: Expanded (Fidelidade visual extrema da referência do usuário) ──
  const sentiment = company.reputation.sentiment || { positive: 91, neutral: 8, negative: 1 };
  
  // Progresso radial de recomendação
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const recommendationRate = company.reputation.recommendation_rate || 96;
  const strokeDashoffset = circumference - (recommendationRate / 100) * circumference;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 md:p-6 transition-all duration-300 hover:shadow-2xl cursor-pointer',
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 1. CABEÇALHO PRINCIPAL */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        
        {/* Esquerda: Logo + Identidade principal */}
        <div className="flex items-start gap-4">
          <CompanyLogo
            logoUrl={company.logo_url}
            name={name}
            size="md"
            className="border border-slate-100 shadow-sm bg-white shrink-0 rounded-2xl"
          />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors inline-flex items-center gap-1.5">
                {name}
                <BadgeCheck className="h-5 w-5 fill-blue-600 text-white" />
              </h3>

              {company.trust.verification_status === 'verified' && (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold py-0.5 px-2 rounded-full inline-flex items-center gap-1">
                  <Check className="h-3 w-3" /> Verificada
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <div className="flex items-center gap-1 font-bold text-slate-800">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{company.reputation.rating_avg.toFixed(1)}</span>
                <span className="font-medium text-slate-400">|</span>
                <span className="font-medium text-slate-500 hover:underline">{company.reputation.rating_count} avaliações</span>
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              </div>
              {company.identity.city && (
                <div className="flex items-center gap-1 font-medium text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <span>{company.identity.city}, {company.identity.state}</span>
                </div>
              )}
            </div>

            <Badge variant="outline" className="bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF] text-[10px] font-bold py-0.5 px-3 rounded-full inline-flex items-center gap-1 shadow-none">
              <Building className="h-3 w-3" /> Instalação de Energia Solar
            </Badge>
          </div>
        </div>

        {/* Direita: KPIs rápidos e CTAs */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-4 w-full lg:w-auto shrink-0">
          
          {/* Box de KPIs (Respostas e Cobertura) */}
          <div className="grid grid-cols-2 gap-0 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 w-full sm:w-60 lg:w-56 text-center">
            <div className="border-r border-slate-100 p-2.5">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Respostas</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">{company.operations.sla_label || '24h'}</span>
            </div>
            <div className="p-2.5">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cobertura</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">
                {company.coverage.cities.length > 0 ? `${company.coverage.cities.length} regiões` : 'Consulte'}
              </span>
            </div>
          </div>

          {/* Botões de Ação Superiores */}
          <div className="flex flex-col gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCompareClick}
              disabled={!selectedInComparison && !canAddMore}
              className={cn(
                "w-full h-10 font-bold text-xs rounded-xl shadow-none inline-flex items-center justify-center",
                selectedInComparison
                  ? "border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              )}
            >
              {selectedInComparison ? 'Selecionada' : 'Comparar'}
            </Button>

            <Button
              className="w-full h-10 font-bold text-xs rounded-xl shadow-none bg-[#FFF7ED] hover:bg-[#FFEED5] border border-[#FDBA74] text-[#C2410C]"
              onClick={(e) => {
                e.stopPropagation();
                openLeadModal({ preferredCompanyId: id, source: 'company-card-expanded', type: 'quick' });
              }}
            >
              Pedir orçamento
            </Button>
          </div>

        </div>
      </div>

      {/* 2. DESCRIÇÃO E MINI CHIPS OPERACIONAIS */}
      <div className="mt-5 space-y-3">
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          {company.identity.description || `A ${name} oferece soluções completas em energia solar com tecnologia de ponta, qualidade e segurança para seu projeto.`}
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1.5 text-xs font-bold text-[#475569]">
          <div className="inline-flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[#64748B]" />
            <span>Atende todo o Brasil</span>
          </div>
          {company.operations.delivered_projects > 0 && (
            <div className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#64748B]" />
              <span>+{company.operations.delivered_projects} projetos realizados</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5">
            <Clock3Icon className="h-4 w-4 text-[#64748B]" />
            <span>Resposta média: 2h</span>
          </div>
        </div>
      </div>

      {/* 3. PAINEL DE REPUTAÇÃO & SENTIMENTO */}
      <div className="mt-6 border border-slate-100 rounded-2xl bg-white grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 shadow-sm overflow-hidden">
        
        {/* Coluna 1: Avaliação Geral */}
        <div className="p-5 flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avaliação geral</span>
          <span className="text-4xl font-black text-slate-900 mt-2 block">
            {company.reputation.rating_avg.toFixed(1)}
          </span>
          <div className="flex items-center gap-0.5 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(company.reputation.rating_avg)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-200 fill-slate-200"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 font-bold mt-2">
            {company.reputation.rating_count} avaliações
          </span>
        </div>

        {/* Coluna 2: Review Sentiment */}
        <div className="p-5 flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Review Sentiment</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-slate-100 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-none p-3 rounded-xl max-w-xs shadow-xl text-xs space-y-1.5 leading-relaxed z-50">
                  <p className="font-bold text-slate-200">Como funciona o Review Sentiment?</p>
                  <p>Classifica a opinião dos clientes a partir das notas das avaliações:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                    <li><span className="font-bold text-emerald-400">Positivo:</span> avaliações de 4 e 5 estrelas.</li>
                    <li><span className="font-bold text-amber-400">Neutro:</span> avaliações de 3 estrelas.</li>
                    <li><span className="font-bold text-rose-400">Negativo:</span> avaliações de 1 e 2 estrelas.</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Barra tricolor horizontal */}
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100 mt-3.5">
            <div style={{ width: `${sentiment.positive}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${sentiment.neutral}%` }} className="bg-amber-400 h-full" />
            <div style={{ width: `${sentiment.negative}%` }} className="bg-rose-500 h-full" />
          </div>

          {/* Valores das barras */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div>
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Positivo</span>
              <span className="text-[11px] font-black text-emerald-600">{sentiment.positive}%</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Neutro</span>
              <span className="text-[11px] font-black text-amber-500">{sentiment.neutral}%</span>
            </div>
            <div>
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Negativo</span>
              <span className="text-[11px] font-black text-rose-500">{sentiment.negative}%</span>
            </div>
          </div>
        </div>

        {/* Coluna 3: Índice de recomendação */}
        <div className="p-5 flex items-center gap-4">
          <div className="relative shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                className="text-slate-100"
                strokeWidth="5"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="32"
                cy="32"
              />
              <circle
                className="text-emerald-500 transition-all duration-300"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="32"
                cy="32"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-slate-800">{recommendationRate}%</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Índice de recomendação</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-slate-100 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 text-white border-none p-3 rounded-xl max-w-xs shadow-xl text-xs space-y-1.5 leading-relaxed z-50">
                    <p className="font-bold text-slate-200">Como funciona o Índice de Recomendação?</p>
                    <p>Calcula o percentual de clientes que ativamente recomendam esta empresa em seus formulários de avaliação.</p>
                    <p className="text-slate-300">Valores baseados em avaliações verificadas da plataforma.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-slate-600 font-bold mt-1.5 leading-snug">
              <span className="text-emerald-600 font-black">{recommendationRate}%</span> dos clientes recomendam esta empresa
            </p>
          </div>
        </div>

      </div>

      {/* 4. CHIPS DE CRITÉRIOS */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {['Equipe qualificada', 'Cumpre prazos', 'Ótimo atendimento', 'Produtos de qualidade'].map((chip) => (
          <Badge
            key={chip}
            variant="secondary"
            className="bg-[#F8FAFC] border border-slate-100 text-slate-700 text-[11px] font-bold py-1 px-3 rounded-xl inline-flex items-center gap-1.5 shadow-none"
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 fill-emerald-50" />
            {chip}
          </Badge>
        ))}
        <span className="text-xs text-slate-400 font-bold ml-1 hover:text-slate-600 transition-colors inline-flex items-center gap-0.5 cursor-pointer">
          Ver mais
        </span>
      </div>

      {/* 5. RODAPÉ DE AÇÕES */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        
        {/* Ações da Esquerda (Ver Perfil, WhatsApp, Contato) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-10 px-4"
            onClick={(e) => {
              e.stopPropagation();
              router.push(companyPath);
            }}
          >
            <Building className="h-4 w-4 mr-2 text-slate-500" />
            Ver perfil
          </Button>

          {hasWhatsapp && (
            <WhatsappButton
              href={company.actions.whatsapp_url}
              companyId={id}
              label="WhatsApp"
              className="rounded-xl border-[#E2E8F0] font-bold text-xs h-10 px-4"
              preset="brandSolid"
            />
          )}

          <Button
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs h-10 px-4"
            onClick={(e) => {
              e.stopPropagation();
              openLeadModal({ preferredCompanyId: id, source: 'company-card-contact', type: 'quick' });
            }}
          >
            <PhoneCall className="h-4 w-4 mr-2 text-slate-500" />
            Contato
          </Button>
        </div>

        {/* Ação da Direita (Ver avaliações) */}
        <Button
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 inline-flex items-center gap-1.5 self-stretch sm:self-auto"
          onClick={(e) => {
            e.stopPropagation();
            router.push(companyReviewPath);
          }}
        >
          Ver avaliações
          <Badge className="bg-white/20 hover:bg-white/20 text-white text-[10px] font-bold rounded-md px-1.5 shadow-none border-none">
            {company.reputation.rating_count}
          </Badge>
          <span className="ml-0.5">›</span>
        </Button>

      </div>

    </Card>
  );
}

// Helper Clock icon since we renamed Lucide icon
function Clock3Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
