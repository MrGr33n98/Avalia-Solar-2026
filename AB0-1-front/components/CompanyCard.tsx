'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star,
  MapPin,
  BadgeCheck,
  MessageCircle,
  BookOpen,
  ArrowRight,
  ArrowLeftRight,
  Building2,
  MoreHorizontal,
  MessageSquare,
  PhoneCall,
  PenSquare,
  Check,
  FileText,
} from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompanyReviewsSummarySheet } from '@/components/company/CompanyReviewsSummarySheet';
import { buildCompanyPath } from '@/lib/slug';
import { openLeadModal } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';
import { hasPaidPlan, canUsePaidConversion, type FeatureAccessMap } from '@/lib/feature-access';
import { useComparison } from '@/hooks/useComparison';

export interface CompanyCardData {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  featured?: boolean;
  sponsored?: boolean;
  verified?: boolean;
  has_paid_plan?: boolean;
  distance_km?: number | null;
  badges?: { image_url?: string | null; name?: string | null }[] | null;
  feature_access?: FeatureAccessMap;
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
    is_claimed?: boolean;
    verification_status?: 'unverified' | 'pending' | 'verified' | 'premium';
    verified_at?: string;
    verification_method?: string;
  };
  reputation: {
    rating_avg: number;
    rating_count: number;
    nps_score?: number;
    nps_responses?: number;
    recommendation_rate?: number | null;
    sentiment?: {
      positive: number;
      neutral: number;
      negative: number;
    } | null;
    recent_reviewer_avatars?: { name: string; url: string | null }[];
  };
  operations?: {
    delivered_projects?: number;
    sla_label?: string;
    sla_minutes?: number;
    warranty_years?: number;
    engineering_insurance?: boolean;
    updated_at?: string;
  };
  coverage: {
    states: string[];
    cities: string[];
  };
  actions?: {
    whatsapp_url?: string;
    whatsapp_enabled?: boolean;
    p2p_chat_enabled?: boolean;
  };
}

export interface CompanyCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  company: any;
  className?: string;
  compact?: boolean;
  variant?: 'compact' | 'standard' | 'expanded';
  lang?: 'pt-BR' | 'en-US' | 'es-ES';
  isLoading?: boolean;
  schemaEnabled?: boolean;
  rank?: number;
  category?: string;
  isSponsored?: boolean;
  onAnalyticsEvent?: (event: {
    type: string;
    companyId: number;
    meta?: Record<string, unknown>;
  }) => void;
  index?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeCompanyData = (raw: any): CompanyCardData => {
  const comp = raw || {};
  const isStructured = Boolean(
    comp && comp.identity && comp.trust && comp.reputation && comp.coverage
  );

  const rating = Number(
    comp?.reputation?.rating_avg ??
      comp?.rating_avg ??
      comp?.average_rating ??
      comp?.rating ??
      0
  );
  const reviewsCount = Number(
    comp?.reputation?.rating_count ??
      comp?.rating_count ??
      comp?.reviews_count ??
      comp?.total_reviews ??
      0
  );

  const rawSentiment = comp?.reputation?.sentiment ?? comp?.sentiment;
  const sentiment =
    rawSentiment && typeof rawSentiment.positive === 'number'
      ? {
          positive: Number(rawSentiment.positive),
          neutral: Number(rawSentiment.neutral || 0),
          negative: Number(rawSentiment.negative || 0),
        }
      : null;

  const rawRecommendation =
    comp?.reputation?.recommendation_rate ?? comp?.recommendation_rate;
  const recommendationRate =
    rawRecommendation != null && !isNaN(Number(rawRecommendation))
      ? Number(rawRecommendation)
      : null;

  const coverageCities =
    comp?.coverage?.cities ??
    (Array.isArray(comp?.coverage_cities)
      ? comp.coverage_cities.map(String).map((s: string) => s.trim()).filter(Boolean)
      : String(comp?.coverage_cities || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean));

  const coverageStates =
    comp?.coverage?.states ??
    (Array.isArray(comp?.coverage_states)
      ? comp.coverage_states.map(String).map((s: string) => s.trim()).filter(Boolean)
      : String(comp?.coverage_states || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean));

  const isVerified =
    comp?.trust?.verification_status === 'verified' ||
    comp?.trust?.verification_status === 'premium' ||
    comp?.verified === true;

  if (isStructured) {
    return {
      id: comp.id,
      name: comp.name || comp.identity.name,
      slug: comp.slug || comp.identity.slug,
      logo_url: comp.logo_url || comp.identity.logo_url,
      featured: comp.featured === true,
      sponsored: comp.sponsored === true,
      verified: isVerified,
      has_paid_plan: hasPaidPlan(comp),
      badges: comp.badges || [],
      feature_access: comp.feature_access || {},
      top_criteria: comp.top_criteria || [],
      identity: {
        name: comp.identity.name || comp.name || '',
        slug: comp.identity.slug || comp.slug || '',
        logo_url: comp.identity.logo_url || comp.logo_url,
        description: comp.identity.description || comp.description,
        city: comp.identity.city || comp.city,
        state: comp.identity.state || comp.state,
      },
      trust: {
        is_claimed: comp.trust.is_claimed,
        verification_status: isVerified ? 'verified' : 'unverified',
        verified_at: comp.trust.verified_at,
        verification_method: comp.trust.verification_method,
      },
      reputation: {
        rating_avg: rating,
        rating_count: reviewsCount,
        nps_score: comp.reputation.nps_score,
        nps_responses: comp.reputation.nps_responses,
        recommendation_rate: recommendationRate,
        sentiment: sentiment,
        recent_reviewer_avatars: comp.reputation.recent_reviewer_avatars || [],
      },
      operations: comp.operations,
      coverage: {
        states: coverageStates,
        cities: coverageCities,
      },
      actions: comp.actions,
    };
  }

  return {
    id: comp?.id || 0,
    name: comp?.name || '',
    slug: comp?.slug || '',
    logo_url: comp?.logo_url,
    featured: comp?.featured === true,
    sponsored: comp?.sponsored === true,
    verified: isVerified,
    has_paid_plan: hasPaidPlan(comp),
    badges: comp?.badges || [],
    feature_access: comp?.feature_access || {},
    top_criteria: Array.isArray(comp?.top_criteria) ? comp.top_criteria : [],
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
      verification_status: isVerified ? 'verified' : 'unverified',
      verified_at: comp?.verified_at,
      verification_method: comp?.verification_method,
    },
    reputation: {
      rating_avg: rating,
      rating_count: reviewsCount,
      recommendation_rate: recommendationRate,
      sentiment: sentiment,
      recent_reviewer_avatars: [],
    },
    coverage: {
      states: coverageStates,
      cities: coverageCities,
    },
    actions: {
      whatsapp_url: comp?.whatsapp_url || comp?.cta_whatsapp_url,
      whatsapp_enabled: comp?.whatsapp_enabled === true || comp?.cta_whatsapp_enabled === true,
      p2p_chat_enabled: comp?.p2p_chat_enabled === true,
    },
  };
};

export default function CompanyCard({
  company: rawCompany,
  className,
  compact = false,
  variant = 'standard',
  isLoading = false,
  schemaEnabled = false,
  rank: _rank,
  category,
  isSponsored = false,
  onAnalyticsEvent,
  index,
  onMouseEnter,
  onMouseLeave,
}: CompanyCardProps) {
  const router = useRouter();
  const [isReviewsSheetOpen, setIsReviewsSheetOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    isInComparison,
    addToComparison,
    removeFromComparison,
    canAddMore,
  } = useComparison();

  const data = normalizeCompanyData(rawCompany || {});
  const { id, name, slug, logo_url } = data;
  const companyPath = buildCompanyPath(slug || String(id));

  // Entitlements estritos — Zero Fake Data
  const isPro = data.has_paid_plan === true;
  const isVerified = data.verified === true;
  const isCompanySponsored = Boolean(isSponsored || data.sponsored);
  const canRequestQuote = isPro && canUsePaidConversion(data, 'quote');

  const p2pChatEnabled = Boolean(data.actions?.p2p_chat_enabled);
  const hasWhatsapp = Boolean(data.actions?.whatsapp_enabled && data.actions?.whatsapp_url);

  // Localização
  const locationText = [data.identity.city, data.identity.state].filter(Boolean).join(', ');

  // Cobertura canônica
  const coverageText = (() => {
    const states = data.coverage.states || [];
    const cities = data.coverage.cities || [];
    if (states.some((s) => s.toLowerCase() === 'todos' || s.toLowerCase() === 'nacional') || states.length >= 27) {
      return 'Cobertura nacional';
    }
    if (cities.length > 0) {
      return `${cities.length} ${cities.length === 1 ? 'cidade' : 'cidades'}`;
    }
    if (states.length > 0) {
      return `${states.length} ${states.length === 1 ? 'estado' : 'estados'}`;
    }
    return 'Cobertura: Consulte';
  })();

  const impressionTrackedRef = useRef(false);

  // Analytics de impressão (DATA-P1-006): Disparar apenas quando >=50% visível por >=200ms
  useEffect(() => {
    if (!id || impressionTrackedRef.current) return;
    const element = cardRef.current;

    if (!element || typeof IntersectionObserver === 'undefined') {
      track('company_card_impression', {
        company_id: id,
        company_name: name,
        verified: isVerified,
        view_mode: compact ? 'list' : 'grid',
        company_slug: slug,
        category,
      });
      track('company_cta_impression', {
        company_id: id,
        company_name: name,
        company_slug: slug,
        category,
      });
      impressionTrackedRef.current = true;
      return;
    }

    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!timer && !impressionTrackedRef.current) {
            timer = setTimeout(() => {
              if (impressionTrackedRef.current) return;
              impressionTrackedRef.current = true;
              track('company_card_impression', {
                company_id: id,
                company_name: name,
                verified: isVerified,
                view_mode: compact ? 'list' : 'grid',
                company_slug: slug,
                category,
              });
              track('company_cta_impression', {
                company_id: id,
                company_name: name,
                company_slug: slug,
                category,
              });
              observer.disconnect();
            }, 200);
          }
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(element);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [id, name, isVerified, compact, slug, category]);

  if (isLoading || !rawCompany) {
    return (
      <Card className={cn('h-[300px] w-full rounded-xl border border-slate-200/80 bg-white p-4 animate-pulse dark:border-slate-800 dark:bg-slate-950', className)}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="mt-6 h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 flex gap-2">
          <div className="h-9 flex-1 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 flex-1 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </Card>
    );
  }

  // Handlers
  const handleCardClick = () => {
    track('company_card_click', {
      company_id: id,
      company_name: name,
      is_pro: isPro,
      is_sponsored: isCompanySponsored,
      source: category || 'list',
      index,
    });
    onAnalyticsEvent?.({
      type: 'company_card_click',
      companyId: id,
      meta: { index, category },
    });
    router.push(companyPath);
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInComparison(id)) {
      removeFromComparison(id);
      track('comparison_remove', { company_id: id, company_name: name, source: 'company_card' });
    } else {
      if (!canAddMore) return;
      addToComparison(data as unknown as Parameters<typeof addToComparison>[0]);
      track('comparison_add', { company_id: id, company_name: name, source: 'company_card' });
    }
  };

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    track('quote_cta_click', { company_id: id, company_name: name, source: 'company_card' });
    openLeadModal({
      preferredCompanyId: id,
      source: 'company_card',
      type: 'quick',
    });
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(companyPath);
  };

  const handleReviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`${companyPath}#review`);
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/chat?company_id=${id}`);
  };

  const handleWhatsappClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.actions?.whatsapp_url) {
      window.open(data.actions.whatsapp_url, '_blank', 'noopener,noreferrer');
    }
  };

  const openReviewsSheet = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsReviewsSheetOpen(true);
  };

  // ─── VARIANTE COMPACTA (LEGADA / CAROUSELS) ──────────────────────────────────
  if (compact || variant === 'compact') {
    return (
      <Card
        ref={cardRef}
        className={cn(
          'group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 transition-all duration-150 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-950 cursor-pointer',
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 p-0.5 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
              <CompanyLogo logoUrl={logo_url} name={name} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {name}
                </h3>
                {isVerified && (
                  <BadgeCheck
                    className="h-3.5 w-3.5 fill-blue-600 text-white shrink-0"
                    aria-label="Empresa verificada"
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                {data.reputation.rating_count > 0 && data.reputation.rating_avg > 0 ? (
                  <span className="flex items-center gap-0.5 font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {data.reputation.rating_avg.toFixed(1)}
                  </span>
                ) : (
                  <span>Sem avaliações</span>
                )}
                {locationText && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="truncate">{locationText}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center gap-2">
          {canRequestQuote ? (
            <Button
              size="sm"
              className="w-full h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              onClick={handleQuoteClick}
            >
              Orçamento
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-semibold"
              onClick={handleProfileClick}
            >
              Ver perfil
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // ─── VARIANTE STANDARD V2 (SWISS SAAS ENTERPRISE DISCOVERY) ──────────────────
  return (
    <>
      <Card
        ref={cardRef}
        className={cn(
          'group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 transition-all duration-150 hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-950 cursor-pointer h-full',
          isCompanySponsored && 'ring-1 ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/10',
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...(schemaEnabled
          ? {
              itemScope: true,
              itemType: 'https://schema.org/Organization',
            }
          : {})}
      >
        <div className="space-y-2.5 sm:space-y-3">
          {/* IDENTIDADE + TRUST + PRO BADGE */}
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div
              data-testid="company-logo"
              className="h-12 w-12 rounded-lg border border-slate-200/80 dark:border-slate-800 p-1 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0"
            >
              <CompanyLogo logoUrl={logo_url} name={name} size="sm" badges={data.badges} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex items-center gap-1.5">
                  <h3
                    itemProp="name"
                    className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors"
                  >
                    {name}
                  </h3>
                  {isVerified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            tabIndex={0}
                            aria-label="Empresa verificada"
                            className="inline-flex shrink-0 focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <BadgeCheck className="h-4 w-4 fill-blue-600 text-white shrink-0" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs bg-slate-900 text-white border-none">
                          Empresa verificada pela equipe Avalia Solar
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {isPro && (
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-none shrink-0"
                  >
                    PRO
                  </Badge>
                )}
              </div>

              {/* RATING + LOCALIZAÇÃO */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                {data.reputation.rating_count > 0 && data.reputation.rating_avg > 0 ? (
                  <button
                    type="button"
                    onClick={openReviewsSheet}
                    className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 transition-colors tabular-nums"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{data.reputation.rating_avg.toFixed(1)}</span>
                    <span className="text-slate-500 font-normal">
                      ({data.reputation.rating_count})
                    </span>
                  </button>
                ) : (
                  <span className="text-slate-400">Sem avaliações</span>
                )}

                {locationText && (
                  <span className="inline-flex items-center gap-1 truncate text-slate-500">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{locationText}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* DESCRIÇÃO OBJETIVA (MÁXIMO 2 LINHAS — ZERO FAKE DATA) */}
          <div className="min-h-[36px] max-h-[40px] overflow-hidden">
            {data.identity.description ? (
              <p
                itemProp="description"
                className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed"
              >
                {data.identity.description}
              </p>
            ) : (
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 italic line-clamp-2 leading-relaxed">
                Informações detalhadas disponíveis no perfil da empresa.
              </p>
            )}
          </div>

          {/* ESSENTIAL PROOF ROW (MÁXIMO 2 CHIPS COMPACTOS COM ÍCONES) */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={openReviewsSheet}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-md px-2 py-1"
            >
              <MessageCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>
                {data.reputation.rating_count > 0 ? (
                  <>
                    <span>{data.reputation.rating_count}</span>{' '}
                    <span className="hidden sm:inline">{data.reputation.rating_count === 1 ? 'avaliação' : 'avaliações'}</span>
                  </>
                ) : (
                  'Sem avaliações'
                )}
              </span>
            </button>

            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-md px-2 py-1 truncate">
              <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{coverageText}</span>
            </div>
          </div>
        </div>

        {/* PARTE INFERIOR: CTA PRINCIPAL + AÇÕES SECUNDÁRIAS (ALTURA EQUALIZADA) */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* CTA PRINCIPAL (SLOT DE 40px) */}
          <div className="h-10">
            {canRequestQuote ? (
              <Button
                className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-none transition-all active:scale-[0.98]"
                onClick={handleQuoteClick}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">Solicitar orçamento</span>
                <ArrowRight className="h-3.5 w-3.5 ml-0.5 shrink-0" />
              </Button>
            ) : (
              <Button
                className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-none transition-all active:scale-[0.98]"
                onClick={handleProfileClick}
              >
                <span className="truncate">Ver perfil</span>
                <ArrowRight className="h-3.5 w-3.5 ml-0.5 shrink-0" />
              </Button>
            )}
          </div>

          {/* AÇÕES SECUNDÁRIAS (GRADE DE 3 COLUNAS, H=36px) */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. COMPARAR */}
            <Button
              variant="outline"
              aria-label={`Comparar ${name}`}
              aria-pressed={isInComparison(id)}
              className={cn(
                'w-full h-9 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors px-1',
                isInComparison(id)
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
              )}
              onClick={handleCompareToggle}
            >
              {isInComparison(id) ? (
                <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              ) : (
                <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              )}
              <span className="truncate">Comparar</span>
            </Button>

            {/* 2. VER PERFIL (SE PRO COM QUOTE) OU AVALIAR (SE FREE) */}
            {canRequestQuote ? (
              <Button
                variant="outline"
                className="w-full h-9 rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-[11px] sm:text-xs font-medium inline-flex items-center justify-center gap-1 px-1"
                onClick={handleProfileClick}
              >
                <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Ver perfil</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full h-9 rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-[11px] sm:text-xs font-medium inline-flex items-center justify-center gap-1 px-1"
                onClick={handleReviewClick}
              >
                <Star className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Avaliar</span>
              </Button>
            )}

            {/* 3. MENU DE MAIS AÇÕES (••• Mais) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  aria-label={`Mais ações para ${name}`}
                  className="w-full h-9 rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-[11px] sm:text-xs font-medium inline-flex items-center justify-center gap-1 px-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">Mais</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 text-xs">
                {p2pChatEnabled && (
                  <DropdownMenuItem onClick={handleChatClick} className="gap-2 cursor-pointer">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                    <span>Conversar no chat</span>
                  </DropdownMenuItem>
                )}
                {hasWhatsapp && (
                  <DropdownMenuItem onClick={handleWhatsappClick} className="gap-2 cursor-pointer">
                    <PhoneCall className="h-3.5 w-3.5 text-slate-500" />
                    <span>Ver contato</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={openReviewsSheet} className="gap-2 cursor-pointer">
                  <Star className="h-3.5 w-3.5 text-slate-500" />
                  <span>Ver avaliações</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReviewClick} className="gap-2 cursor-pointer">
                  <PenSquare className="h-3.5 w-3.5 text-slate-500" />
                  <span>Avaliar empresa</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* REVIEWS SUMMARY SHEET */}
      <CompanyReviewsSummarySheet
        isOpen={isReviewsSheetOpen}
        onOpenChange={setIsReviewsSheetOpen}
        companyName={name}
        logoUrl={logo_url}
        ratingAvg={data.reputation.rating_avg}
        ratingCount={data.reputation.rating_count}
        sentiment={data.reputation.sentiment}
        recommendationRate={data.reputation.recommendation_rate}
        reviewsPath={`${companyPath}#reviews`}
      />
    </>
  );
}
