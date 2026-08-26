'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Star, Clock3, LayoutGrid, Check, BadgeCheck } from 'lucide-react';
import { Company } from '@/lib/api';
import { hasPaidPlan } from '@/lib/feature-access';
import { buildCompanyPath } from '@/lib/slug';
import { track } from '@/lib/analytics/lazy';
import { useComparison } from '@/hooks/useComparison';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/CompanyLogo';
import { AnimatedCompareIcon } from '@/components/icons/AnimatedCompareIcon';
import ReviewCompanyButton from '@/components/company/ReviewCompanyButton';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { openLeadModal } from '@/lib/lead-engine';
import { Button } from '@/components/ui/button';

interface RelatedCompanyCardProps {
  company: Company;
  className?: string;
}

export default function RelatedCompanyCard({ company, className }: RelatedCompanyCardProps) {
  const router = useRouter();
  const { isInComparison, toggleComparison, canAddMore } = useComparison();

  // 1. Data Normalization
  const id = Number(company.id);
  const name = company.name || '';
  const slug = company.slug || '';
  const isVerified = company.verified === true;
  const logoUrl = company.logo_url;
  
  // Try to find a meaningful category name
  let categoryName = null;
  if (company.categories && company.categories.length > 0) {
    categoryName = company.categories[0].name;
  } else if (company.category_info?.name) {
    categoryName = company.category_info.name;
  } else if (company.primary_category) {
    categoryName = company.primary_category;
  }

  // Fallback to older response format safely
  const rep = (company as any).reputation || {};
  const ops = (company as any).operations || {};

  const ratingAvg = Number(rep.rating_avg ?? (company as any).rating_avg ?? (company as any).rating ?? 0);
  const ratingCount = Number(rep.rating_count ?? (company as any).rating_count ?? (company as any).reviews_count ?? 0);
  
  const slaLabel = ops.sla_label ?? (company as any).response_time_sla ?? (company as any).response_sla_minutes;
  const projects = ops.delivered_projects ?? (company as any).delivered_projects_count ?? (company as any).delivered_projects_score ?? 0;

  // 2. Feature Gating
  const featureAccessMap = (company as any).feature_access ?? {};
  const canRequestQuote = hasPaidPlan(company as { has_paid_plan?: boolean | null });

  // 3. Routing & Analytics
  const companyPath = buildCompanyPath(slug, name, id);
  const selectedInComparison = isInComparison(id);

  const handleCardClick = () => {
    track('company_card_click', {
      company_id: id,
      company_name: name,
      variant: 'related_a_plus',
    });
    router.push(companyPath);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedInComparison && !canAddMore) return;
    toggleComparison(company);
    track(selectedInComparison ? 'comparison_remove' : 'comparison_add', {
      company_id: id,
      company_name: name,
      source: 'related_companies_carousel',
    });
  };

  const decisionContext = {
    source: 'list' as const,
    view_mode: 'list' as const,
    result_position: 0,
    filter_context: {},
  };

  return (
    <div
      className={cn(
        'group flex flex-col justify-between overflow-hidden bg-white',
        'rounded-2xl border border-slate-200 transition-all duration-200',
        'hover:border-slate-300 hover:shadow-sm cursor-pointer shrink-0 snap-start',
        // Desktop: ~300-320px, Mobile PWA: ~86vw max-w 340px
        'w-[86vw] max-w-[340px] sm:w-[320px]',
        className
      )}
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-4 p-4 pb-0">
        {/* HEADER */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            {/* Logo size: desktop 52-56px, PWA 46-48px */}
            <div className="h-[46px] w-[46px] sm:h-[52px] sm:w-[52px]">
              <CompanyLogo logoUrl={logoUrl} name={name} size="sm" />
            </div>
          </div>
          
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate whitespace-nowrap text-[14px] sm:text-[15px] font-bold text-slate-950">
                {name}
              </h3>
              {isVerified && (
                <BadgeCheck className="h-[18px] w-[18px] shrink-0 fill-blue-600 text-white" aria-label="Verificada" />
              )}
            </div>
            {categoryName && (
              <div className="mt-1">
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-600">
                  {categoryName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 px-4">
        {/* DIVIDER */}
        <div className="h-px w-full bg-slate-100" />
        
        {/* REPUTATION / OPERATIONS GRID */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 py-3">
          {/* Rating */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="flex items-center gap-1 text-[13px] font-black text-slate-900">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{ratingAvg > 0 ? ratingAvg.toFixed(1) : 'S/N'}</span>
            </div>
            <span className="mt-0.5 text-[10px] font-bold text-slate-500">
              {ratingCount > 0 ? `${ratingCount} avaliações` : 'Sem avaliações'}
            </span>
          </div>

          {/* SLA */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="flex items-center gap-1 text-[13px] font-black text-slate-900">
              <Clock3 className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate max-w-[60px]">{slaLabel || 'Sem dados'}</span>
            </div>
            <span className="mt-0.5 text-[10px] font-bold text-slate-500">
              Resposta
            </span>
          </div>

          {/* Projects */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="flex items-center gap-1 text-[13px] font-black text-slate-900">
              <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate max-w-[60px]">{projects > 0 ? projects : 'S/N'}</span>
            </div>
            <span className="mt-0.5 text-[10px] font-bold text-slate-500">
              Projetos
            </span>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="h-px w-full bg-slate-100" />
      </div>

      {/* ACTION ROW */}
      <div className="flex flex-col gap-2 p-4 pt-3">
        <div className="flex gap-2">
          {/* Comparar */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleCompareClick}
            disabled={!selectedInComparison && !canAddMore}
            aria-pressed={selectedInComparison}
            className={cn(
              'flex-1 min-h-[38px] sm:min-h-[40px] h-[44px] sm:h-[40px] px-2 rounded-xl text-[13px] font-bold transition-all',
              'hover:bg-transparent active:scale-[0.98]',
              selectedInComparison
                ? 'text-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <div className={cn(
              "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full mr-2",
              selectedInComparison ? "bg-blue-50 text-blue-600" : "bg-transparent text-slate-500"
            )}>
              {selectedInComparison ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <AnimatedCompareIcon
                  size={16}
                  active={false}
                  selected={false}
                  disabled={!canAddMore}
                  className="text-slate-500"
                  aria-hidden="true"
                />
              )}
            </div>
            {selectedInComparison ? 'Selecionada' : 'Comparar'}
          </Button>

          {/* Avaliar */}
          <ReviewCompanyButton
            company={{
              id: id,
              name: name,
              slug: slug
            }}
            label="Avaliar"
            className="flex-1 min-h-[38px] sm:min-h-[40px] h-[44px] sm:h-[40px] rounded-xl px-2 text-[13px] bg-white text-blue-700 border border-blue-200 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm"
            iconClassName="h-3.5 w-3.5"
            stopPropagation
          />
        </div>

        {/* Solicitar Orçamento (Only for Paid Plans) */}
        {canRequestQuote && (
          <QuoteCTA
            context="default"
            source="related_company_card"
            className="w-full min-h-[38px] sm:min-h-[40px] h-[44px] sm:h-[40px] rounded-xl text-[14px] font-bold shadow-sm"
            onRequest={() =>
              openLeadModal({
                preferredCompanyId: id,
                source: 'related_carousel',
                decisionContext,
                type: 'quick',
              })
            }
          />
        )}
      </div>
    </div>
  );
}
