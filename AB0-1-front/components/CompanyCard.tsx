'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star,
  MapPin,
  Building,
  Share2,
  Check,
  Info,
  Trophy,
  MessageCircle,
  ShieldCheck,
  Zap,
  Shield,
  HelpCircle,
  Heart,
  PhoneCall,
  BadgeCheck,
  CheckCircle,
  ChevronRight,
  User,
} from 'lucide-react';
import { AnimatedCompareIcon } from '@/components/icons/AnimatedCompareIcon';
import PremiumBadge from '@/components/PremiumBadge';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CompanyChatButton } from '@/components/company/CompanyChatButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import ReviewCompanyButton from '@/components/company/ReviewCompanyButton';

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
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { isFeatureEnabled, hasPaidPlan } from '@/lib/feature-access';
import { openSignupGate } from '@/lib/signup-gate';
import { useComparison } from '@/hooks/useComparison';

export interface CompanyCardData {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  featured: boolean;
  sponsored: boolean;
  distance_km?: number | null;
  badges?: any[];
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
    recent_reviewer_avatars?: { name: string; url: string | null }[];
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
  // Sem dados reais de critérios/serviços: retorna array vazio (não fabrica tags fictícias)
  return [];
};

/**
 * Verifica se uma feature paga está habilitada no feature_access.
 * Fonte primária: feature_access (gerenciado via ActiveAdmin/planos).
 * O fallback só deve ser usado quando a chamada fornecer uma regra explícita.
 */
export const isCardFeatureEnabled = (
  featureAccess: Record<string, { state: string; value?: unknown }> | undefined | null,
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
      top_criteria: comp.top_criteria ?? [],
      // Garante feature_access mesmo que venha como {} vazio
      feature_access: comp.feature_access ?? {},
    };
  }

  // Formato legado (resposta plana da API antiga)
  const rating = Number(comp?.rating_avg ?? comp?.average_rating ?? comp?.rating ?? 0);
  const reviews = Number(comp?.rating_count ?? comp?.reviews_count ?? comp?.total_reviews ?? 0);

  // Sentiment: prioriza dados reais da API, nunca fabrica se não há avaliações
  const apiSentiment = comp?.reputation?.sentiment ?? comp?.sentiment ?? null;
  const sentimentData = apiSentiment ?? (reviews > 0 ? undefined : null);

  // recommendation_rate: prioriza real da API
  const apiRecommendation =
    comp?.reputation?.recommendation_rate ?? comp?.recommendation_rate ?? null;

  return {
    id: comp?.id || 0,
    name: comp?.name || '',
    slug: comp?.slug || '',
    logo_url: comp?.logo_url,
    featured: comp?.featured === true,
    sponsored: comp?.sponsored === true,
    distance_km: comp?.distance_km == null ? null : Number(comp.distance_km),
    feature_access: comp?.feature_access ?? {},
    badges: comp?.badges || [],
    top_criteria: extractTopCriteria(comp),
    identity: {
      name: comp?.name || '',
      slug: comp?.slug || '',
      logo_url: comp?.logo_url,
      description: comp?.description,
      city: comp?.city,
      state: comp?.state,
    },
    trust: {
      is_claimed: comp?.active_admin === true,
      verification_status: comp?.verified ? 'verified' : 'unverified',
      verified_at: comp?.verified_at,
      verification_method: comp?.verification_method,
    },
    reputation: {
      rating_avg: rating,
      rating_count: reviews,
      nps_score: comp?.nps_score,
      nps_responses: comp?.nps_responses || 0,
      recommendation_rate: apiRecommendation,
      sentiment: sentimentData,
      recent_reviewer_avatars:
        comp?.reputation?.recent_reviewer_avatars || comp?.recent_reviewer_avatars || [],
    },
    operations: {
      delivered_projects:
        comp?.operations?.delivered_projects ??
        comp?.delivered_projects_count ??
        comp?.delivered_projects_score ??
        0,
      sla_label: comp?.operations?.sla_label ?? comp?.response_time_sla,
      sla_minutes: comp?.operations?.sla_minutes ?? comp?.response_sla_minutes,
      warranty_years:
        comp?.operations?.warranty_years ??
        comp?.warranty_years ??
        comp?.installation_warranty_years,
      engineering_insurance:
        comp?.operations?.engineering_insurance ?? comp?.engineering_insurance === true,
      updated_at:
        comp?.operations?.updated_at ?? comp?.updated_at ?? comp?.operational_data_updated_at ?? '',
    },
    coverage: {
      states:
        comp?.coverage?.states ??
        (Array.isArray(comp?.coverage_states)
          ? comp.coverage_states
              .map(String)
              .map((s: string) => s.trim())
              .filter(Boolean)
          : String(comp?.coverage_states || '')
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)),
      cities:
        comp?.coverage?.cities ??
        (Array.isArray(comp?.coverage_cities)
          ? comp.coverage_cities
              .map(String)
              .map((s: string) => s.trim())
              .filter(Boolean)
          : String(comp?.coverage_cities || '')
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)),
    },
    actions: {
      whatsapp_url: comp?.actions?.whatsapp_url ?? comp?.whatsapp_url ?? comp?.cta_whatsapp_url,
      whatsapp_enabled:
        comp?.actions?.whatsapp_enabled ??
        (comp?.whatsapp_enabled === true || comp?.cta_whatsapp_enabled === true),
      p2p_chat_enabled: comp?.actions?.p2p_chat_enabled ?? comp?.p2p_chat_enabled === true,
    },
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
  const companyReviewPath = useMemo(
    () => buildCompanySubPath(slug, name, 'reviews', id),
    [slug, name, id]
  );

  const hasWhatsapp = company.actions.whatsapp_enabled && company.actions.whatsapp_url;
  const p2pChatEnabled =
    company.actions.p2p_chat_enabled === true || (company as any)?.p2p_chat_enabled === true;
  const selectedInComparison = isInComparison(id);

  // ── Feature gates controlados via planos pagos ──
  // hasPaidPlan: única fonte de verdade para verificar se a empresa tem plano pago.
  const featureAccessMap = company.feature_access ?? {};
  const canRequestQuote = hasPaidPlan({ ...rawCompany, feature_access: featureAccessMap });

  // Critérios reais de avaliação
  const topCriteria = company.top_criteria ?? [];

  const handleCardClick = () => {
    track('company_card_click', {
      company_id: id,
      company_name: name,
      variant,
    });
    router.push(companyPath);
  };

  const decisionContext = {
    source: 'list' as const,
    view_mode: 'list' as const,
    result_position: _index + 1,
    filter_context: {},
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

  const renderPrimaryActions = (wrapperClass?: string) => (
    <div className={cn('flex flex-col gap-2 w-full', wrapperClass)}>
      <div className="grid grid-cols-2 gap-2 w-full">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCompareClick}
          disabled={!selectedInComparison && !canAddMore}
          aria-pressed={selectedInComparison}
          aria-label={
            selectedInComparison
              ? `Remover ${name} da comparação`
              : `Adicionar ${name} à comparação`
          }
          className={cn(
            'min-w-0 w-full min-h-11 h-11 @[500px]/card:min-h-8 @[500px]/card:h-8 inline-flex items-center justify-start @[500px]/card:justify-center gap-2.5 px-0 @[500px]/card:px-2 text-sm @[500px]/card:text-[10px] font-semibold transition-colors focus-visible:ring-0',
            'border-0 bg-transparent shadow-none hover:bg-transparent text-slate-800 active:scale-[0.98]',
            selectedInComparison
              ? '@[500px]/card:text-white @[500px]/card:border-blue-600 @[500px]/card:bg-blue-600 hover:@[500px]/card:bg-blue-700 hover:@[500px]/card:border-blue-700 @[500px]/card:shadow-sm @[500px]/card:border'
              : '@[500px]/card:text-slate-700 @[500px]/card:border-slate-200 hover:@[500px]/card:border-blue-300 hover:@[500px]/card:text-blue-700 hover:@[500px]/card:bg-slate-50/50 @[500px]/card:border'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-200',
              selectedInComparison
                ? 'bg-blue-50 border-blue-500 text-blue-600'
                : 'bg-white border-blue-200 text-blue-600',
              '@[500px]/card:w-auto @[500px]/card:h-auto @[500px]/card:border-0 @[500px]/card:bg-transparent @[500px]/card:p-0 @[500px]/card:rounded-none',
              selectedInComparison ? '@[500px]/card:text-white' : '@[500px]/card:text-slate-700'
            )}
          >
            {selectedInComparison ? (
              <Check className="h-4 w-4 @[500px]/card:h-3 @[500px]/card:w-3 shrink-0" />
            ) : (
              <div className="flex items-center justify-center @[500px]/card:scale-[0.85] shrink-0">
                <AnimatedCompareIcon
                  size={20}
                  active={false}
                  selected={false}
                  disabled={!canAddMore}
                  className="text-blue-600 @[500px]/card:text-slate-750"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
          <span className="truncate">{selectedInComparison ? 'Selecionada' : 'Comparar'}</span>
        </Button>

        <ReviewCompanyButton
          company={company}
          label="Avaliar"
          className="min-w-0 w-full min-h-11 h-11 @[500px]/card:min-h-8 @[500px]/card:h-8 rounded-xl @[500px]/card:rounded-lg px-2 text-[11px] @[500px]/card:text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          iconClassName="h-[14px] w-[14px] @[500px]/card:h-3 @[500px]/card:w-3"
          stopPropagation
        />
      </div>

      {canRequestQuote ? (
        <QuoteCTA
          context="compact"
          source="company-card-expanded"
          className="w-full"
          onRequest={() =>
            openLeadModal({
              preferredCompanyId: id,
              source: 'list',
              decisionContext,
              type: 'quick',
            })
          }
        />
      ) : null}
    </div>
  );

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
    // Check if company has badges for layout adjustments
    const hasBadges = company.badges && company.badges.length > 0;

    return (
      <Card
        itemScope
        itemType="https://schema.org/Organization"
        className={cn(
          'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-100 bg-white transition-all duration-200 hover:border-slate-200 hover:shadow-md cursor-pointer',
          // Add extra top padding when badges are present to prevent overlap
          hasBadges ? 'pt-6 pb-4' : 'pt-4 pb-4',
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* TOP SECTION: Logo & Title */}
        <div className="flex items-center gap-3 px-4">
          <div data-testid="company-logo" className="relative shrink-0">
            <CompanyLogo logoUrl={company.logo_url} name={name} size="sm" badges={company.badges} />
          </div>
          <div className="min-w-0 flex-1 flex items-center gap-1.5">
            <h3
              itemProp="name"
              className={cn(
                'text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors',
                // Adjust truncation to account for badge overflow on the right side
                hasBadges ? 'truncate pr-3' : 'truncate'
              )}
            >
              {name}
            </h3>
            {company.trust.verification_status === 'verified' && (
              <BadgeCheck className="h-4 w-4 fill-blue-600 text-white shrink-0" />
            )}
          </div>
        </div>

        {/* MIDDLE SECTION: 3-Column Stats */}
        <div className="mt-4 border-y border-slate-100 grid grid-cols-3 divide-x divide-slate-100 text-center">
          {/* Rating */}
          <div className="py-2.5 px-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>
                {company.reputation.rating_avg > 0
                  ? company.reputation.rating_avg.toFixed(1)
                  : 'S/N'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-2 leading-tight">
              {company.reputation.rating_count > 0
                ? `${company.reputation.rating_count} avaliações`
                : 'Sem avaliações'}
            </span>
          </div>
          {/* Response Time */}
          <div className="py-2.5 px-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
              <Clock3Icon className="h-3 w-3 text-slate-400" />
              <span className="truncate max-w-[50px]">
                {company.operations.sla_label || 'Sem dados'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 truncate w-full px-1">
              Resposta
            </span>
          </div>
          {/* Projects */}
          <div className="py-2.5 px-1 flex flex-col items-center justify-center">
            <div className="font-bold text-slate-800 text-xs">
              {company.operations.delivered_projects > 0
                ? company.operations.delivered_projects
                : 'S/N'}
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 truncate w-full px-1">
              Projetos
            </span>
          </div>
        </div>

        {/* BOTTOM SECTION: Buttons */}
        <div className="px-4 pb-4">{renderPrimaryActions('mt-4')}</div>
      </Card>
    );
  }

  // ── Variante Unificada (Responsiva via Container Queries) ──
  const sentiment =
    company.reputation?.sentiment ??
    (company.reputation?.rating_count > 0 ? { positive: 85, neutral: 10, negative: 5 } : null);

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const recommendationRate = company.reputation?.recommendation_rate ?? null;
  const recentReviewers =
    company.reputation?.recent_reviewer_avatars || (company as any).recent_reviewer_avatars || [];
  const strokeDashoffset =
    recommendationRate !== null
      ? circumference - (recommendationRate / 100) * circumference
      : circumference;

  const hasBadges = company.badges && company.badges.length > 0;

  return (
    <Card
      className={cn(
        '@container/card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl cursor-pointer',
        hasBadges ? 'pt-6 px-4 pb-4' : 'p-4',
        className
      )}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col @[500px]/card:flex-row justify-between items-start gap-4">
        {/* Esquerda: Logo + Identidade */}
        <div className="flex items-start gap-3 min-w-0 w-full @[500px]/card:flex-1">
          <div data-testid="company-logo" className="shrink-0 relative">
            <CompanyLogo logoUrl={company.logo_url} name={name} size="sm" badges={company.badges} />
          </div>
          <div className="min-w-0 space-y-0.5 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3
                className={cn(
                  'text-sm font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors inline-flex items-center gap-1',
                  hasBadges ? 'truncate pr-3' : 'truncate'
                )}
              >
                {name}
                {company.trust.verification_status === 'verified' && (
                  <BadgeCheck className="h-4 w-4 fill-blue-600 text-white shrink-0" />
                )}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-0.5 font-bold text-slate-800">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{company.reputation.rating_avg.toFixed(1)}</span>
                <span className="font-medium text-slate-300">|</span>
                <span className="font-medium text-slate-600">
                  {company.reputation.rating_count} aval.
                </span>
              </div>
              {company.identity.city && (
                <div className="flex items-center gap-0.5 font-medium text-slate-600">
                  <MapPin className="h-3 w-3 text-blue-500" />
                  <span>
                    {company.identity.city}, {company.identity.state}
                  </span>
                </div>
              )}
            </div>
            {/* Em telas muito estreitas, exibimos os KPIs aqui, abaixo do nome */}
            <div className="mt-2 block @[500px]/card:hidden w-full">
              <div className="grid grid-cols-2 gap-0 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50 text-center w-full">
                <div className="border-r border-slate-100 py-1">
                  <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-wider">
                    Respostas
                  </span>
                  <span className="text-[10px] font-black text-slate-900 block">
                    {company.operations.sla_label || 'Sem dados'}
                  </span>
                </div>
                <div className="py-1">
                  <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-wider">
                    Cobertura
                  </span>
                  <span className="text-[10px] font-black text-slate-900 block truncate px-1">
                    {company.coverage.cities.length > 0
                      ? `${company.coverage.cities.length} reg.`
                      : 'Consulte'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Direita: CTAs + KPIs (KPIs apenas no desktop) */}
        <div className="flex flex-col items-end gap-2 shrink-0 w-full @[500px]/card:w-[160px]">
          {/* Box de KPIs mini (escondido em mobile) */}
          <div className="hidden @[500px]/card:grid grid-cols-2 gap-0 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50 text-center w-full">
            <div className="border-r border-slate-100 py-1">
              <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-wider">
                Respostas
              </span>
              <span className="text-[10px] font-black text-slate-900 block">
                {company.operations.sla_label || 'Sem dados'}
              </span>
            </div>
            <div className="py-1">
              <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-wider">
                Cobertura
              </span>
              <span className="text-[10px] font-black text-slate-900 block truncate px-1">
                {company.coverage.cities.length > 0
                  ? `${company.coverage.cities.length} reg.`
                  : 'Consulte'}
              </span>
            </div>
          </div>

          {renderPrimaryActions('mt-2 @[500px]/card:mt-0')}
        </div>
      </div>

      {/* 2. DESCRIÇÃO + CHIPS OPERACIONAIS */}
      <div className="mt-4 @[500px]/card:mt-3 flex flex-col @[500px]/card:flex-row @[500px]/card:items-center gap-2 @[500px]/card:gap-6">
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium flex-1 min-w-0">
          {(() => {
            const desc =
              company.identity.description ||
              `A ${name} oferece soluções completas em energia solar com tecnologia de ponta.`;
            return desc.length > 110 ? desc.slice(0, 110) + '...' : desc;
          })()}
        </p>
        <div className="flex flex-wrap items-center gap-3 shrink-0 text-[10px] font-bold text-slate-500">
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
            <span>Resp: {company.operations.sla_label || 'Sem dados'}</span>
          </div>
        </div>
      </div>

      {/* 3. PAINEL DE REPUTAÇÃO */}
      {company.reputation.rating_count > 0 && (
        <div className="mt-4 @[500px]/card:mt-3 border border-slate-100 rounded-xl bg-white grid grid-cols-1 @[400px]/card:grid-cols-3 divide-y @[400px]/card:divide-y-0 @[400px]/card:divide-x divide-slate-100 overflow-hidden">
          {/* Col 1: Avaliação Geral */}
          <div className="p-3 flex items-center gap-3 @[400px]/card:flex-col @[400px]/card:items-center @[400px]/card:text-center">
            <span className="text-2xl font-black text-slate-900 leading-none">
              {company.reputation.rating_avg.toFixed(1)}
            </span>
            <div className="flex flex-col gap-0.5">
              <div data-testid="rating-stars-container" className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3 w-3',
                      i < Math.floor(company.reputation.rating_avg)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 fill-slate-200'
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-600 font-bold">
                {company.reputation.rating_count} avaliações
              </span>
            </div>
          </div>

          {/* Col 2: Review Sentiment */}
          <div className="p-3 flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                Review Sentiment
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Entender como o sentimento das avaliações é calculado"
                      className="flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="h-4 w-4 cursor-help" aria-hidden="true" />
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
                  <div
                    style={{ width: `${sentiment.positive}%` }}
                    className="bg-emerald-500 h-full"
                  />
                  <div style={{ width: `${sentiment.neutral}%` }} className="bg-amber-400 h-full" />
                  <div style={{ width: `${sentiment.negative}%` }} className="bg-rose-500 h-full" />
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1.5 text-center">
                  <div>
                    <span className="text-[10px] font-black text-emerald-600">
                      {sentiment.positive}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-700">
                      {sentiment.neutral}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-rose-500">
                      {sentiment.negative}%
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-2 text-[10px] text-slate-600 font-medium">
                Dados em processamento
              </div>
            )}
          </div>

          {/* Col 3: Índice de recomendação */}
          <div className="p-3 flex items-center gap-3">
            <div className="relative shrink-0">
              <svg className="w-11 h-11 transform -rotate-90">
                <circle
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="22"
                  cy="22"
                />
                <circle
                  className="text-emerald-500 transition-all duration-300"
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx="22"
                  cy="22"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {recentReviewers.length > 0 ? (
                  <Avatar className="h-7 w-7 border-2 border-white shadow-sm bg-slate-50 text-[10px]">
                    <AvatarImage
                      src={
                        recentReviewers[0]?.url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(recentReviewers[0]?.name || 'Cliente')}&background=0D8ABC&color=fff&size=128`
                      }
                      alt={recentReviewers[0]?.name || 'Reviewer'}
                    />
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold uppercase">
                      {getInitials(recentReviewers[0]?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-7 w-7 border-2 border-white shadow-sm bg-slate-50 text-[10px]">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-extrabold text-[10px]">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider block">
                Recomendação
              </span>
              {recommendationRate !== null ? (
                <p className="text-[10px] text-slate-600 font-bold mt-0.5 leading-snug">
                  <span className="text-emerald-600 font-black">{recommendationRate}%</span>{' '}
                  recomendam
                </p>
              ) : (
                <p className="text-[10px] text-slate-600 font-medium mt-0.5">Sem dados</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. CHIPS DE CRITÉRIOS */}
      <div className="mt-4 @[500px]/card:mt-3 flex flex-row flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
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
            onClick={(e) => {
              e.stopPropagation();
              router.push(companyPath);
            }}
          >
            Ver mais
          </span>
        )}
      </div>

      {/* 5. RODAPÉ */}
      <div className="mt-4 @[500px]/card:mt-3 pt-4 @[500px]/card:pt-3 border-t border-slate-100 flex flex-col @[400px]/card:flex-row items-stretch @[400px]/card:items-center justify-between gap-3 @[400px]/card:gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            className="flex-1 @[400px]/card:flex-none rounded-lg border-slate-200 text-slate-600 font-bold text-[10px] h-9 @[400px]/card:h-7 px-2.5"
            onClick={(e) => {
              e.stopPropagation();
              router.push(companyPath);
            }}
          >
            <Building className="h-3.5 w-3.5 @[400px]/card:h-3 @[400px]/card:w-3 mr-1 text-slate-400" />
            Ver perfil
          </Button>

          {hasWhatsapp && (
            <WhatsappButton
              href={company.actions.whatsapp_url}
              companyId={id}
              label="WhatsApp"
              trackingSource="list"
              className="flex-1 @[400px]/card:flex-none rounded-lg border-[#E2E8F0] font-bold text-[10px] h-9 @[400px]/card:h-7 px-2.5"
              preset="brandSolid"
            />
          )}

          {p2pChatEnabled && (
            <CompanyChatButton companyId={id} companyName={name} variant="compact" />
          )}

          {canRequestQuote && (
            <Button
              variant="outline"
              className="flex-1 @[400px]/card:flex-none rounded-lg border-slate-200 text-slate-600 font-bold text-[10px] h-9 @[400px]/card:h-7 px-2.5"
              onClick={(e) => {
                e.stopPropagation();
                openLeadModal({
                  preferredCompanyId: id,
                  source: 'list',
                  decisionContext,
                  type: 'quick',
                });
              }}
            >
              <PhoneCall className="h-3.5 w-3.5 @[400px]/card:h-3 @[400px]/card:w-3 mr-1 text-slate-400" />
              Contato
            </Button>
          )}
        </div>

        <Button
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs @[400px]/card:text-[10px] h-11 @[400px]/card:h-7 px-4 @[400px]/card:px-3 inline-flex items-center gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`${companyPath}?tab=reviews`);
          }}
        >
          Ver avaliações
          <Badge className="bg-white/20 hover:bg-white/20 text-white text-[10px] @[400px]/card:text-[9px] font-bold rounded px-1.5 @[400px]/card:px-1 shadow-none border-none">
            {company.reputation.rating_count}
          </Badge>
          <ChevronRight className="h-4 w-4 @[400px]/card:h-3 @[400px]/card:w-3" />
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
