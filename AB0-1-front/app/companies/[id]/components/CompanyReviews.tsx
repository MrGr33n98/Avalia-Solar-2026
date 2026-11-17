'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Review, type CompanyReviewWhatsAppChannel } from '@/lib/api';
import ReviewWhatsAppButton from '@/components/company/ReviewWhatsAppButton';
import { ReviewAction } from '@/components/company/ReviewAction';
import ReviewCard from '@/components/ReviewCard';
import { buildCompanySubPath } from '@/lib/slug';
import { EditorialReviewCard, ReviewV2 } from '@/components/EditorialReviewCard';
import { LegacyReviewCard, ReviewV1 } from '@/components/LegacyReviewCard';
import { CompanyReputationSwitcher } from './CompanyReputationSwitcher';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CompanyReviewsProps {
  reviews?: Review[];
  loading?: boolean;
  companyId: number;
  companySlug?: string;
  companyName?: string | null;
  reviewWhatsapp?: CompanyReviewWhatsAppChannel | null;
  aggregates?: {
    global: ReviewAggregate | null;
    by_category: ReviewAggregate[];
  };
}

interface ReviewAggregate {
  category_id: number | null;
  category_name: string | null;
  average_rating: number;
  total_reviews: number;
}

export default function CompanyReviews({
  reviews = [],
  loading = false,
  companyId,
  companySlug,
  companyName,
  reviewWhatsapp,
  aggregates = { global: null, by_category: [] },
}: CompanyReviewsProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const reviewPath = buildCompanySubPath(companySlug, companyName, 'review', companyId);

  const filteredReviews = useMemo(() => {
    // 'Geral' (null) mostra TODAS as reviews da empresa (Autoridade de Marca)
    if (activeCategoryId === null) return reviews;
    // Filtro por categoria específica
    return reviews.filter((r) => r.category_id === activeCategoryId);
  }, [reviews, activeCategoryId]);

  const reconciledAggregates = useMemo(() => {
    const rawGlobal = aggregates?.global;
    const rawByCategory = aggregates?.by_category || [];

    if (reviews.length > 0) {
      const avg = Number((reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1));
      const isStale =
        !rawGlobal ||
        reviews.length !== (rawGlobal.total_reviews || 0) ||
        Math.abs(avg - (Number(rawGlobal.average_rating) || 0)) > 0.05;

      if (isStale) {
        const catMap = new Map<number, { name: string; sum: number; count: number }>();
        reviews.forEach((r) => {
          if (r.category_id != null) {
            const catName =
              rawByCategory.find((c) => c.category_id === r.category_id)?.category_name ||
              (r as any).category?.name ||
              (r as any).category_name ||
              'Categoria';
            const entry = catMap.get(r.category_id) || { name: catName, sum: 0, count: 0 };
            entry.sum += Number(r.rating) || 0;
            entry.count += 1;
            catMap.set(r.category_id, entry);
          }
        });

        const reconciledCategories = Array.from(catMap.entries()).map(([catId, val]) => ({
          category_id: catId,
          category_name: val.name,
          average_rating: Number((val.sum / val.count).toFixed(1)),
          total_reviews: val.count,
        }));

        return {
          global: {
            category_id: null,
            category_name: null,
            average_rating: avg,
            total_reviews: reviews.length,
          },
          by_category: reconciledCategories.length > 0 ? reconciledCategories : rawByCategory,
        };
      }
    }

    return aggregates;
  }, [aggregates, reviews]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <LoadingSpinner />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
          Sincronizando avaliações...
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-8" aria-labelledby="social-proof-title">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 id="social-proof-title" className="text-2xl font-bold tracking-tight text-[#0B1F4B]">
            O que dizem sobre a empresa?
          </h3>
          <p className="text-sm text-slate-600 font-medium">
            {companyName
              ? `Veja as opiniões e experiências de quem já contratou os serviços da ${companyName}.`
              : 'Veja as opiniões e experiências de quem já contratou os serviços desta empresa.'}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <ReviewAction href={reviewPath} ariaLabel={`Deixe sua avaliação de ${companyName || 'esta empresa'}`} />
          <ReviewWhatsAppButton
            companyId={companyId}
            companyName={companyName || 'esta empresa'}
            channel={reviewWhatsapp}
            placement="reviews_tab"
          />
        </div>
      </div>

      {/* Switcher */}
      <div className="flex items-center gap-4">
        <CompanyReputationSwitcher
          aggregates={reconciledAggregates}
          activeCategoryId={activeCategoryId}
          onSwitch={setActiveCategoryId}
        />
      </div>

      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="grid gap-6">
          {filteredReviews.map((review) => {
            // Se tiver headline ou pros/cons ou granular_scores, é V2
            const isV2 =
              review.headline ||
              (review.pros && review.pros.length > 0) ||
              (review.granular_scores && review.granular_scores.length > 0);

            return isV2 ? (
              <EditorialReviewCard key={review.id} review={review as ReviewV2} />
            ) : (
              <ReviewCard key={review.id} review={review} />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-20 text-center shadow-sm">
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <Filter className="h-12 w-12 text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {activeCategoryId === null
              ? 'Nenhuma avaliação encontrada'
              : 'Nenhuma avaliação nesta categoria'}
          </h3>
          <p className="text-slate-600 max-w-sm mb-8 text-sm">
            {activeCategoryId === null
              ? 'Esta empresa ainda não recebeu avaliações de clientes.'
              : 'Esta empresa ainda não recebeu avaliações específicas para este serviço.'}
            Seja o primeiro a compartilhar sua experiência!
          </p>
          <ReviewAction href={reviewPath} ariaLabel={`Deixe sua avaliação de ${companyName || 'esta empresa'}`} />
        </div>
      )}
    </section>
  );
}
