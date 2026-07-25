'use client';

import React from 'react';
import { Company } from '@/lib/api';
import ErrorBoundary from '../ErrorBoundary';
import { ChatCompanyReferenceCard } from './company-reference-card';
import type { ChatCompanyReferenceCardCompany } from './company-reference-card';

const MOBIVOLT_SPONSORED_CARDS_ENABLED = true;
const MOBIVOLT_CARD_WHATSAPP_ENABLED = false;
const MOBIVOLT_COMPARE_BUTTON_ENABLED = true;

const normalizeCompanyRecommendation = (company: any): ChatCompanyReferenceCardCompany => {
  let cid: string | number | null = null;
  if (typeof company?.id === 'number') {
    cid = company.id;
  } else if (typeof company?.id === 'string') {
    cid = parseInt(company.id, 10);
  }

  return {
    id: cid ?? 0,
    name: company?.name || company?.nome || 'Empresa recomendada',
    city: company?.city || company?.cidade || '',
    state: company?.state || company?.estado || '',
    logoUrl: company?.logo_url || company?.image || company?.logo || company?.image_url || company?.avatar || null,
    isSponsored: company?.sponsored ?? company?.patrocinada ?? false,
    isFeatured: company?.sponsored ?? company?.patrocinada ?? false,
    isVerified: company?.verified ?? company?.verificada ?? false,
    rating: company?.rating_avg ?? company?.nota_media,
    ratingCount: company?.rating_count ?? company?.total_avaliacoes ?? 0,
    reviewsCount: company?.rating_count ?? company?.total_avaliacoes ?? 0,
    services: Array.isArray(company?.services) ? company.services : (Array.isArray(company?.servicos) ? company.servicos : []),
    reviewSnippet: company?.review_snippet || company?.reviews_recentes?.[0]?.comentario,
    profileUrl: company?.profile_url || company?.link_perfil,
    slug: company?.slug ?? String(cid ?? ''),
  };
};

export interface ChatCompanyRecommendationsProps {
  metadata: any;
  comparisonList: Company[];
  onCompanyClick: (companyId: number, type: 'profile' | 'whatsapp') => void;
  onRequestQuote: (companyId: number) => void;
  onAddToComparison: (company: Company) => void;
  onRemoveFromComparison: (companyId: number) => void;
  maxComparison: number;
  onRequestPersonalizedSearch: () => void;
}

const RecommendationsContent: React.FC<ChatCompanyRecommendationsProps> = ({
  metadata,
  comparisonList,
  onCompanyClick,
  onRequestQuote,
  onAddToComparison,
  onRemoveFromComparison,
  maxComparison,
  onRequestPersonalizedSearch
}) => {
  // Defensive guard against malformed metadata
  if (!metadata || typeof metadata !== 'object') {
    throw new Error('Metadata inválida ou indefinida');
  }

  const rawCompanies = metadata.companies;
  const hasCompanies = Array.isArray(rawCompanies) && rawCompanies.length > 0;

  if (!hasCompanies) {
    return (
      <div className="mt-3.5 p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 text-center space-y-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Não encontramos empresas cadastradas para esse perfil na sua região no momento. Quer que façamos uma busca personalizada grátis?
        </p>
        <button
          type="button"
          onClick={onRequestPersonalizedSearch}
          className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white text-[11px] font-bold py-2 rounded-lg shadow-sm transition-colors active:scale-95 duration-150"
        >
          Solicitar Busca Personalizada
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3.5 space-y-3 w-full">
      {rawCompanies.map((rawCompany: any, companyIndex: number) => {
        const company = normalizeCompanyRecommendation(rawCompany);
        const trackableCompanyId = typeof company.id === 'number' ? company.id : null;
        const isSelected = trackableCompanyId !== null && comparisonList.some((c) => c.id === trackableCompanyId);
        const selectedPosition = isSelected
          ? comparisonList.findIndex((c) => c.id === trackableCompanyId) + 1
          : null;

        const handleCompareClick = () => {
          if (trackableCompanyId === null) return;

          if (isSelected) {
            onRemoveFromComparison(trackableCompanyId);
            return;
          }

          const companyPayload: Company = {
            id: trackableCompanyId,
            slug: company.slug || String(trackableCompanyId),
            name: company.name,
            city: company.city ?? '',
            state: company.state ?? '',
            status: 'active',
            verified: company.isVerified ?? false,
            category: '',
            description: '',
            website: '',
            phone: '',
            address: '',
            created_at: '',
            updated_at: '',
            logo_url: company.logoUrl,
            rating_avg: company.rating,
            rating_count: company.ratingCount,
            services: company.services ?? [],
            sponsored: company.isSponsored,
          } as Company;

          onAddToComparison(companyPayload);
        };

        const handleReviewsClick = () => {
          if (trackableCompanyId !== null) {
            onCompanyClick(trackableCompanyId, 'profile');
          }
          if (company.profileUrl) {
            window.open(
              company.profileUrl || (company.slug ? `/companies/${company.slug}` : '/companies'),
              '_blank',
              'noopener noreferrer'
            );
          }
        };

        const handleBudgetClick = () => {
          if (trackableCompanyId !== null) {
            onRequestQuote(trackableCompanyId);
          }
        };

        return (
          <ChatCompanyReferenceCard
            key={company.id ?? `${company.name}-${companyIndex}`}
            company={company}
            isSelectedForComparison={isSelected}
            selectedPosition={selectedPosition}
            maxComparison={maxComparison}
            onCompare={MOBIVOLT_COMPARE_BUTTON_ENABLED ? handleCompareClick : undefined}
            onReviews={handleReviewsClick}
            onBudget={handleBudgetClick}
            compareEnabled={MOBIVOLT_COMPARE_BUTTON_ENABLED}
            showServices={false}
          />
        );
      })}
    </div>
  );
};

export default function ChatCompanyRecommendations(props: ChatCompanyRecommendationsProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="mt-3.5 p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-center">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            Não foi possível carregar as recomendações no momento.
          </p>
          <button 
            type="button"
            onClick={props.onRequestPersonalizedSearch}
            className="mt-2 text-[10px] text-red-700 dark:text-red-400 underline hover:text-red-800 transition-colors"
          >
            Tentar busca manual
          </button>
        </div>
      }
    >
      <RecommendationsContent {...props} />
    </ErrorBoundary>
  );
}