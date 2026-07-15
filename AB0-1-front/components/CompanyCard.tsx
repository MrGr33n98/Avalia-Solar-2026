'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, Building, Share2, Check, Info, Trophy, MessageCircle, ShieldCheck, Zap, Shield, HelpCircle, Heart, PhoneCall, Scale, BadgeCheck, CheckCircle, ChevronRight } from 'lucide-react';
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
  /** Feature access map — controla features pagas liberadas via ActiveAdmin/planos */
  feature_access?: Record<string, { state: string; value?: any }>;
  /** Top critérios de avaliação reais (ex: ['Equipe qualificada', 'Atendimento']). */
  top_criteria?: string[];
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

/**
 * Extrai os top critérios de avaliação de um objeto bruto de empresa.
 * Usa services_offered, project_types ou criteria_breakdown da API.
 */
const extractTopCriteria = (comp: any): string[] => {
  // Tenta usar top_criteria já resolvido (do CompanyCardSerializer)
  if (Array.isArray(comp?.top_criteria) && comp.top_criteria.length > 0) {
    return comp.top_criteria.slice(0, 4);
  }
  // Usa serviços oferecidos como proxy de critérios visíveis
  if (Array.isArray(comp?.services_offered) && comp.services_offered.length > 0) {
    return comp.services_offered.slice(0, 4);
  }
  if (Array.isArray(comp?.services) && comp.services.length > 0) {
    return comp.services.slice(0, 4);
  }
  // Fallback: critérios genéricos do setor solar
  return ['Equipe qualificada', 'Cumpre prazos', 'Ótimo atendimento', 'Produtos de qualidade'];
};

/**
 * Verifica se uma feature paga está habilitada no feature_access.
 * Fonte primária: feature_access (gerenciado via ActiveAdmin/planos).
 * Fallback retro-compatível: is_claimed || sponsored.
 */
export const isCardFeatureEnabled = (
  featureAccess: Record<string, { state: string; value?: any }> | undefined | null,
  key: string,
  fallback: boolean = false
): boolean => {
  if (!featureAccess) return fallback;
  const entry = featureAccess[key];
  if (!entry) return fallback;
  if (!['enabled', 'limited', 'trial'].includes(entry.state)) return false;
  if (entry.value === false || entry.value === null) return false;
  if (typeof entry.value === 'number') return entry.value > 0;
  return true;
};

const normalizeCompanyData = (comp: any): CompanyCardData => {
  // Se já está no formato estruturado (vindo do CompanyCardSerializer / CompanyListSerializer atualizado)
  if (comp && comp.identity && comp.trust && comp.reputation && comp.operations) {
    return {
      ...(comp as CompanyCardData),
      // Garante top_criteria mesmo no formato estruturado
      top_criteria: comp.top_criteria ?? extractTopCriteria(comp),
      // Garante feature_access mesmo que venha como {} vazio
      feature_access: comp.feature_access ?? {},
    };
  }

  // Formato legado (resposta plana da API antiga)
  const rating  = Number(comp?.rating_avg ?? comp?.average_rating ?? comp?.rating ?? 0);
  const reviews = Number(comp?.rating_count ?? comp?.reviews_count ?? comp?.total_reviews ?? 0);

  // Sentiment: prioriza dados reais da API, nunca fabrica se ambos são zero
  const apiSentiment = comp?.reputation?.sentiment ?? comp?.sentiment ?? null;
  const sentimentData = apiSentiment ?? (reviews > 0 ? undefined : { positive: 100, neutral: 0, negative: 0 });

  // recommendation_rate: prioriza real da API
  const apiRecommendation = comp?.reputation?.recommendation_rate ?? comp?.recommendation_rate ?? null;

  return {
    id:       comp?.id || 0,
    name:     comp?.name || '',
    slug:     comp?.slug || '',
    logo_url: comp?.logo_url,
    featured: comp?.featured === true,
    sponsored: comp?.sponsored === true,
    feature_access: comp?.feature_access ?? {},
    top_criteria: extractTopCriteria(comp),
    identity: {
      name:        comp?.name || '',
      slug:        comp?.slug || '',
      logo_url:    comp?.logo_url,
      description: comp?.description,
      city:        comp?.city,
      state:       comp?.state
    },
    trust: {
      is_claimed:          comp?.active_admin === true,
      verification_status: comp?.verified ? 'verified' : 'unverified',
      verified_at:         comp?.verified_at,
      verification_method: comp?.verification_method
    },
    reputation: {
      rating_avg:          rating,
      rating_count:        reviews,
      nps_score:           comp?.nps_score,
      nps_responses:       comp?.nps_responses || 0,
      recommendation_rate: apiRecommendation,
      sentiment:           sentimentData
    },
    operations: {
      delivered_projects:   comp?.operations?.delivered_projects ??
                            comp?.delivered_projects_count ??
                            comp?.delivered_projects_score ?? 0,
      sla_label:            comp?.operations?.sla_label ?? comp?.response_time_sla ?? '24h',
      sla_minutes:          comp?.operations?.sla_minutes ?? comp?.response_sla_minutes,
      warranty_years:       comp?.operations?.warranty_years ?? comp?.warranty_years ?? comp?.installation_warranty_years,
      engineering_insurance: comp?.operations?.engineering_insurance ?? comp?.engineering_insurance === true,
      updated_at:           comp?.operations?.updated_at ?? comp?.updated_at ?? comp?.operational_data_updated_at ?? ''
    },
    coverage: {
      states: comp?.coverage?.states ??
              (Array.isArray(comp?.coverage_states)
                ? comp.coverage_states
                : String(comp?.coverage_states || '').split(',').map((s: string) => s.trim()).filter(Boolean)),
      cities: comp?.coverage?.cities ??
              (Array.isArray(comp?.coverage_cities)
                ? comp.coverage_cities
                : String(comp?.coverage_cities || '').split(',').map((s: string) => s.trim()).filter(Boolean))
    },
    actions: {
      whatsapp_url:     comp?.actions?.whatsapp_url ?? comp?.whatsapp_url ?? comp?.cta_whatsapp_url,
      whatsapp_enabled: comp?.actions?.whatsapp_enabled ??
                        (comp?.whatsapp_enabled === true || comp?.cta_whatsapp_enabled === true),
      p2p_chat_enabled: comp?.actions?.p2p_chat_enabled ?? comp?.p2p_chat_enabled === true
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

  // ── Feature gates controlados via ActiveAdmin / planos ──
  // feature_access.custom_ctas: controla se o botão "Pedir orçamento" aparece
  // Fallback retro-compatível: is_claimed || sponsored (para empresas sem feature_access ainda)
  const featureAccessMap = company.feature_access ?? {};
  const hasFeatureAccess  = Object.keys(featureAccessMap).length > 0;
  const canRequestQuote   = hasFeatureAccess
    ? isCardFeatureEnabled(featureAccessMap, 'custom_ctas')
    : (company.trust.is_claimed || company.sponsored);

  // Critérios reais de avaliação
  const topCriteria = company.top_criteria ?? ['Equipe qualificada', 'Cumpre prazos', 'Ótimo atendimento', 'Produtos de qualidade'];

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
          <div data-testid="company-logo">
            <CompanyLogo logoUrl={company.logo_url} name={name} size="sm" />
          </div>
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
          {canRequestQuote ? (
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
          ) : (
            <Button
              size="sm"
              asChild
              className="w-full h-8 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-none"
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={companyPath}>Ver perfil</Link>
            </Button>
          )}
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
            data-testid="company-banner"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        </div>

        <div className="relative px-5 pb-5 pt-10 flex-1 flex flex-col">
          <div className="absolute -top-6 left-5 z-20" data-testid="company-logo">
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

              {canRequestQuote ? (
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

  // ── Variante 3: Expanded (layout horizontal compacto — full-width) ──
  // Sentiment: dados reais da API; mostra placeholder se sem reviews
  const sentiment = company.reputation.sentiment ?? (
    company.reputation.rating_count > 0
      ? { positive: 85, neutral: 10, negative: 5 }
      : null
  );

  // Anel de recomendação (dados reais)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const recommendationRate = company.reputation.recommendation_rate ?? null;
  const strokeDashoffset = recommendationRate !== null
    ? circumference - (recommendationRate / 100) * circumference
    : circumference;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:shadow-xl cursor-pointer',
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 1. CABEÇALHO — sempre horizontal */}
      <div className="flex justify-between items-start gap-4">

        {/* Esquerda: Logo + Identidade */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div data-testid="company-logo" className="shrink-0">
            <CompanyLogo
              logoUrl={company.logo_url}
              name={name}
              size="sm"
              className="border border-slate-100 shadow-sm bg-white shrink-0 rounded-xl"
            />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors inline-flex items-center gap-1 truncate">
                {name}
                <BadgeCheck className="h-4 w-4 fill-blue-600 text-white shrink-0" />
              </h3>
              {company.trust.verification_status === 'verified' && (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[9px] font-bold py-0 px-1.5 rounded-full inline-flex items-center gap-0.5 h-4">
                  <Check className="h-2.5 w-2.5" /> Verificada
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-0.5 font-bold text-slate-800">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{company.reputation.rating_avg.toFixed(1)}</span>
                <span className="font-medium text-slate-300">|</span>
                <span className="font-medium text-slate-400">{company.reputation.rating_count} aval.</span>
              </div>
              {company.identity.city && (
                <div className="flex items-center gap-0.5 font-medium text-slate-400">
                  <MapPin className="h-3 w-3 text-blue-500" />
                  <span>{company.identity.city}, {company.identity.state}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Direita: KPIs + CTAs agrupados verticalmente para evitar sobreposição horizontal */}
        <div className="flex flex-col items-end gap-2 shrink-0 w-[140px] sm:w-[160px]">
          {/* Box de KPIs mini */}
          <div className="grid grid-cols-2 gap-0 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50 text-center w-full">
            <div className="border-r border-slate-100 py-1">
              <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Respostas</span>
              <span className="text-[10px] font-black text-slate-900 block">{company.operations.sla_label || '24h'}</span>
            </div>
            <div className="py-1">
              <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Cobertura</span>
              <span className="text-[10px] font-black text-slate-900 block truncate px-1">
                {company.coverage.cities.length > 0 ? `${company.coverage.cities.length} reg.` : 'Consulte'}
              </span>
            </div>
          </div>

          {/* CTAs empilhados verticalmente para economizar espaço e evitar quebras */}
          <div className="flex flex-col gap-1 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCompareClick}
              disabled={!selectedInComparison && !canAddMore}
              className={cn(
                "h-7 font-bold text-[10px] rounded-lg shadow-none w-full justify-center",
                selectedInComparison
                  ? "border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {selectedInComparison ? 'Selecionada' : 'Comparar'}
            </Button>

            {canRequestQuote ? (
              <Button
                className="h-7 font-bold text-[10px] rounded-lg shadow-none bg-[#FFF7ED] hover:bg-[#FFEED5] border border-[#FDBA74] text-[#C2410C] w-full justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  openLeadModal({ preferredCompanyId: id, source: 'company-card-expanded', type: 'quick' });
                }}
              >
                Pedir orçamento
              </Button>
            ) : (
              <Button
                asChild
                className="h-7 font-bold text-[10px] rounded-lg shadow-none bg-blue-600 hover:bg-blue-700 text-white w-full justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={companyPath}>Ver perfil</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. DESCRIÇÃO + CHIPS OPERACIONAIS — em linha */}
      <div className="mt-3 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6">
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium flex-1 min-w-0">
          {(() => {
            const desc = company.identity.description || `A ${name} oferece soluções completas em energia solar com tecnologia de ponta.`;
            return desc.length > 110 ? desc.slice(0, 110) + '...' : desc;
          })()}
        </p>
        <div className="flex items-center gap-3 shrink-0 text-[10px] font-bold text-slate-500">
          <div className="inline-flex items-center gap-1">
            <Shield className="h-3 w-3 text-slate-400" />
            <span>Todo o Brasil</span>
          </div>
          {company.operations.delivered_projects > 0 && (
            <div className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3 text-slate-400" />
              <span>+{company.operations.delivered_projects} projetos</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1">
            <Clock3Icon className="h-3 w-3 text-slate-400" />
            <span>Resp: {company.operations.sla_label || '24h'}</span>
          </div>
        </div>
      </div>

      {/* 3. PAINEL DE REPUTAÇÃO — 3 colunas compactas (só renderiza se tiver avaliações) */}
      {company.reputation.rating_count > 0 && (
        <div className="mt-3 border border-slate-100 rounded-xl bg-white grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">

          {/* Col 1: Avaliação Geral */}
          <div className="p-3 flex items-center gap-3 md:flex-col md:items-center md:text-center">
            <span className="text-2xl font-black text-slate-900 leading-none">
              {company.reputation.rating_avg.toFixed(1)}
            </span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < Math.floor(company.reputation.rating_avg)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200 fill-slate-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-bold">{company.reputation.rating_count} avaliações</span>
            </div>
          </div>

          {/* Col 2: Review Sentiment */}
          <div className="p-3 flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Review Sentiment</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="p-0.5 rounded-full hover:bg-slate-100 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <Info className="h-3 w-3 text-slate-300 cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 text-white border-none p-2.5 rounded-lg max-w-xs shadow-xl text-[10px] space-y-1 leading-relaxed z-50">
                    <p className="font-bold text-slate-200">Review Sentiment</p>
                    <p>Classificação baseada nas notas: 4-5★ positivo, 3★ neutro, 1-2★ negativo.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {sentiment ? (
              <>
                <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-100 mt-2">
                  <div style={{ width: `${sentiment.positive}%` }} className="bg-emerald-500 h-full" />
                  <div style={{ width: `${sentiment.neutral}%` }} className="bg-amber-400 h-full" />
                  <div style={{ width: `${sentiment.negative}%` }} className="bg-rose-500 h-full" />
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1.5 text-center">
                  <div>
                    <span className="text-[10px] font-black text-emerald-600">{sentiment.positive}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-500">{sentiment.neutral}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-rose-500">{sentiment.negative}%</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-2 text-[10px] text-slate-400 font-medium">Dados em processamento</div>
            )}
          </div>

          {/* Col 3: Índice de recomendação */}
          <div className="p-3 flex items-center gap-3">
            <div className="relative shrink-0">
              <svg className="w-11 h-11 transform -rotate-90">
                <circle className="text-slate-100" strokeWidth="3.5" stroke="currentColor" fill="transparent" r={radius} cx="22" cy="22" />
                <circle className="text-emerald-500 transition-all duration-300" strokeWidth="3.5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="22" cy="22" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-slate-800">
                  {recommendationRate !== null ? `${recommendationRate}%` : '–'}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Recomendação</span>
              {recommendationRate !== null ? (
                <p className="text-[10px] text-slate-600 font-bold mt-0.5 leading-snug">
                  <span className="text-emerald-600 font-black">{recommendationRate}%</span> recomendam
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sem dados</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. CHIPS DE CRITÉRIOS — Uma única linha com scroll se necessário */}
      <div className="mt-3 flex flex-row flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {topCriteria.slice(0, 4).map((chip) => (
          <Badge
            key={chip}
            variant="secondary"
            className="bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold py-0.5 px-2 rounded-lg inline-flex items-center gap-1 shadow-none shrink-0"
          >
            <CheckCircle className="h-3 w-3 text-emerald-500 fill-emerald-50" />
            {chip}
          </Badge>
        ))}
        {topCriteria.length > 4 && (
          <span
            className="text-[10px] text-slate-400 font-bold ml-0.5 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
            onClick={(e) => { e.stopPropagation(); router.push(companyPath); }}
          >
            Ver mais
          </span>
        )}
      </div>

      {/* 5. RODAPÉ — tudo em uma linha */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            className="rounded-lg border-slate-200 text-slate-600 font-bold text-[10px] h-7 px-2.5"
            onClick={(e) => { e.stopPropagation(); router.push(companyPath); }}
          >
            <Building className="h-3 w-3 mr-1 text-slate-400" />
            Ver perfil
          </Button>

          {hasWhatsapp && (
            <WhatsappButton
              href={company.actions.whatsapp_url}
              companyId={id}
              label="WhatsApp"
              className="rounded-lg border-[#E2E8F0] font-bold text-[10px] h-7 px-2.5"
              preset="brandSolid"
            />
          )}

          <Button
            variant="outline"
            className="rounded-lg border-slate-200 text-slate-600 font-bold text-[10px] h-7 px-2.5"
            onClick={(e) => {
              e.stopPropagation();
              openLeadModal({ preferredCompanyId: id, source: 'company-card-contact', type: 'quick' });
            }}
          >
            <PhoneCall className="h-3 w-3 mr-1 text-slate-400" />
            Contato
          </Button>
        </div>

        <Button
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] h-7 px-3 inline-flex items-center gap-1"
          onClick={(e) => { e.stopPropagation(); router.push(companyReviewPath); }}
        >
          Ver avaliações
          <Badge className="bg-white/20 hover:bg-white/20 text-white text-[9px] font-bold rounded px-1 shadow-none border-none">
            {company.reputation.rating_count}
          </Badge>
          <ChevronRight className="h-3 w-3" />
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
