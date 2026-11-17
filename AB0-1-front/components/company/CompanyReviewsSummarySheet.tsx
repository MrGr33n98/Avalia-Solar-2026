'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, PenSquare, ShieldCheck, Star, ThumbsUp } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CompanyLogo } from '@/components/CompanyLogo';
import { companiesApi, reviewsApi, type Review } from '@/lib/api';
import { cn } from '@/lib/utils';

type Distribution = Record<string, number>;
type PublishedReview = Pick<Review,
  'id' | 'rating' | 'comment' | 'headline' | 'verified' | 'status' | 'display_reviewer_name' |
  'public_reviewer_name' | 'user' | 'granular_scores' | 'review_criterion_scores'
>;

export interface CompanyReviewsSummarySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  companyId?: number;
  logoUrl?: string;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  sentiment?: { positive: number; neutral: number; negative: number } | null;
  recommendationRate?: number | null;
  reviewsPath: string;
  reviewActionPath?: string;
}

type ReviewDetail = {
  companyId: number;
  aggregate: {
    average_rating: number;
    total_reviews: number;
    scores_distribution: Distribution;
  } | null;
  review: PublishedReview | null;
};

/**
 * Só publica um histograma se a soma de suas contagens corresponder exatamente
 * ao total oficial do agregado. Nunca usa amostra de depoimentos como denominador.
 */
export function normalizeRatingDistribution(
  raw: Distribution | null | undefined,
  totalReviews: number
): Array<{ score: number; count: number; percentage: number }> | null {
  if (!raw || !Number.isSafeInteger(totalReviews) || totalReviews <= 0) return null;
  const values = [5, 4, 3, 2, 1].map((score) => Number(raw[String(score)]));
  if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) return null;
  if (values.reduce((sum, value) => sum + value, 0) !== totalReviews) return null;
  return values.map((count, index) => ({
    score: 5 - index,
    count,
    percentage: Math.round((count / totalReviews) * 100),
  }));
}

const formatRating = (rating: number): string =>
  rating.toFixed(1).replace('.', ',');

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));

function SummaryStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Nota ${formatRating(rating)} de 5 estrelas`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="relative inline-block h-4 w-4">
          <Star aria-hidden="true" className="h-4 w-4 fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700" />
          <span
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${clampPercentage((rating - index) * 100)}%` }}
          >
            <Star aria-hidden="true" className="h-4 w-4 min-w-4 fill-amber-400 text-amber-400" />
          </span>
        </span>
      ))}
    </div>
  );
}

function DistributionChart({
  rows,
}: {
  rows: NonNullable<ReturnType<typeof normalizeRatingDistribution>>;
}) {
  return (
    <section aria-label="Distribuição por estrelas" className="min-w-0 space-y-2" data-testid="review-rating-distribution">
      {rows.map(({ score, count, percentage }) => (
        <div key={score} className="flex min-w-0 items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="flex w-7 shrink-0 items-center gap-0.5 font-semibold tabular-nums" aria-hidden="true">
            {score}<Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </span>
          <div
            role="meter"
            aria-label={`${score} estrelas`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            aria-valuetext={`${count} de ${rows.reduce((sum, item) => sum + item.count, 0)} avaliações`}
            className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          >
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
          </div>
          <span className="w-9 shrink-0 text-right font-semibold tabular-nums">{percentage}%</span>
        </div>
      ))}
    </section>
  );
}

function FeaturedReview({ review }: { review: PublishedReview }) {
  const reviewerName = (
    review.public_reviewer_name || review.display_reviewer_name ||
    review.user?.display_name || review.user?.name || 'Avaliador'
  ).trim() || 'Avaliador';
  const initials = reviewerName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  const reviewRating = Number(review.rating);
  const body = (review.comment || review.headline || '').trim();
  const criteria = (review.granular_scores || review.review_criterion_scores || [])
    .filter((item) => item && typeof item.title === 'string' && Number.isFinite(Number(item.score)))
    .slice(0, 3);

  return (
    <section aria-label="Depoimento recente" className="border-t border-slate-200 pt-3 dark:border-slate-800">
      <div className="flex items-start gap-2.5">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {initials || 'AV'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-50">{reviewerName}</span>
            {reviewRating > 0 && reviewRating <= 5 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <Star aria-hidden="true" className="h-3 w-3 fill-amber-400 text-amber-400" />
                {formatRating(reviewRating)}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {review.verified === true ? 'Cliente verificado' : 'Avaliação publicada'}
          </span>
        </div>
      </div>
      {body && <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{body}</p>}
      {criteria.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Critérios avaliados">
          {criteria.map((item, index) => (
            <span key={`${item.title}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {item.title}: <strong className="tabular-nums">{formatRating(Number(item.score))}</strong>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export function CompanyReviewsSummarySheet({
  isOpen, onOpenChange, companyName, companyId, logoUrl,
  ratingAvg = 0, ratingCount = 0, sentiment, recommendationRate,
  reviewsPath, reviewActionPath,
}: CompanyReviewsSummarySheetProps) {
  const [details, setDetails] = useState<ReviewDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Não dispara busca para cada card no diretório. Busca apenas quando o Sheet abre,
  // cancela atualizações obsoletas e não inventa distribuição quando a API falha.
  useEffect(() => {
    if (!isOpen || !companyId || !Number.isSafeInteger(companyId) || companyId <= 0) {
      setDetails(null);
      setLoadingDetails(false);
      return;
    }

    let cancelled = false;
    setDetails(null);
    setLoadingDetails(true);

    void Promise.allSettled([
      companiesApi.getById(companyId),
      reviewsApi.getAll({ company_id: companyId, status: 'approved', limit: 1 }),
    ]).then(([companyResult, reviewResult]) => {
      if (cancelled) return;
      const company = companyResult.status === 'fulfilled' ? companyResult.value : null;
      const aggregate = company?.review_aggregates?.global ?? null;
      const apiReviews = reviewResult.status === 'fulfilled' ? reviewResult.value : null;
      const reviews = Array.isArray(apiReviews) ? apiReviews : Array.isArray(apiReviews?.data) ? apiReviews.data : [];
      const first = reviews.find((item: Review) => item && item.status === 'approved') ?? null;
      setDetails({
        companyId,
        aggregate: aggregate && aggregate.total_reviews > 0 ? {
          average_rating: aggregate.average_rating,
          total_reviews: aggregate.total_reviews,
          scores_distribution: aggregate.scores_distribution,
        } : null,
        review: first,
      });
      setLoadingDetails(false);
    });
    return () => { cancelled = true; };
  }, [isOpen, companyId]);

  const aggregate = details && details.companyId === companyId ? details.aggregate : null;
  const count = aggregate ? Number(aggregate.total_reviews) : Number(ratingCount || 0);
  const rating = aggregate ? Number(aggregate.average_rating) : Number(ratingAvg);
  const hasReviews = Number.isFinite(count) && count > 0;
  const avg = hasReviews && Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : null;
  const distribution = useMemo(
    () => normalizeRatingDistribution(aggregate?.scores_distribution, count),
    [aggregate?.scores_distribution, count]
  );
  const hasSentiment = hasReviews && Boolean(sentiment) &&
    [sentiment?.positive, sentiment?.neutral, sentiment?.negative]
      .every((part) => typeof part === 'number' && Number.isFinite(part) && part >= 0) &&
    (sentiment!.positive + sentiment!.neutral + sentiment!.negative > 0);
  const hasRecommendation = hasReviews && recommendationRate != null &&
    Number.isFinite(Number(recommendationRate)) &&
    Number(recommendationRate) >= 0 && Number(recommendationRate) <= 100;
  const targetReviewUrl = reviewActionPath || `${reviewsPath.split('#')[0]}#review`;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-testid="reviews-summary-sheet"
        className={cn(
          'flex h-[min(90dvh,780px)] w-full flex-col gap-0 overflow-hidden rounded-t-[20px] border-t border-slate-200 bg-white p-0 shadow-2xl',
          'dark:border-slate-800 dark:bg-slate-950',
          'sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:top-0 sm:bottom-0 sm:h-dvh sm:w-[460px] sm:max-w-[min(460px,100vw)]',
          'sm:rounded-none sm:border-t-0 sm:border-l sm:data-[state=open]:slide-in-from-right sm:data-[state=closed]:slide-out-to-right'
        )}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-slate-300 sm:hidden" />
        <SheetHeader className="shrink-0 space-y-0 border-b border-slate-200 px-4 pb-3 pt-4 pr-12 text-left dark:border-slate-800 sm:px-5 sm:pt-5">
          <SheetTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Avaliações da comunidade
          </SheetTitle>
          <SheetDescription className="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
              <CompanyLogo logoUrl={logoUrl} name={companyName} size="sm" />
            </span>
            <span className="min-w-0 truncate font-medium">{companyName}</span>
          </SheetDescription>
        </SheetHeader>

        <div data-testid="reviews-summary-scroll-region" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {hasReviews ? (
            <>
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-start gap-3">
                  <div className="min-w-[105px] shrink-0">
                    <div className="flex items-center gap-1 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                      <span className="tabular-nums">{avg !== null ? formatRating(avg) : '—'}</span>
                      {avg !== null && <Star aria-hidden="true" className="h-5 w-5 fill-amber-400 text-amber-400" />}
                    </div>
                    {avg !== null && <SummaryStars rating={avg} />}
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {count === 1 ? '1 avaliação registrada' : `${count.toLocaleString('pt-BR')} avaliações registradas`}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    {distribution ? (
                      <DistributionChart rows={distribution} />
                    ) : (
                      <div data-testid="distribution-unavailable" className="rounded-lg border border-dashed border-slate-200 px-2 py-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        {loadingDetails ? 'Carregando distribuição…' : 'Distribuição por estrelas indisponível'}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {details && details.companyId === companyId && details.review && (
                <FeaturedReview review={details.review} />
              )}

              {hasSentiment && sentiment && (
                <section aria-label="Sentimento das avaliações" className="border-t border-slate-200 pt-3 dark:border-slate-800">
                  <h3 className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    Sentimento das avaliações
                  </h3>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[11px]">
                    {([
                      ['Positivo', sentiment.positive, 'text-emerald-700 dark:text-emerald-300'],
                      ['Neutro', sentiment.neutral, 'text-amber-700 dark:text-amber-300'],
                      ['Negativo', sentiment.negative, 'text-rose-700 dark:text-rose-300'],
                    ] as const).map(([label, value, color]) => (
                      <div key={label} className="rounded-md bg-slate-50 px-1 py-2 dark:bg-slate-900">
                        <strong className={cn('block tabular-nums', color)}>{value}%</strong>
                        <span className="text-slate-500 dark:text-slate-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {hasRecommendation && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-800">
                  <ThumbsUp aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Recomendação</h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>{Number(recommendationRate).toLocaleString('pt-BR')}%</strong> dos clientes recomendam
                    </p>
                    <p className="text-[10px] text-slate-500">Com base nas respostas explícitas de recomendação</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-2.5 py-2 text-[11px] leading-relaxed text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                Avaliações moderadas e auditadas para garantir autenticidade.
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 px-3 py-10 text-center">
              <Star aria-hidden="true" className="h-9 w-9 text-amber-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ainda não há avaliações</h3>
              <p className="max-w-[280px] text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Sua experiência pode ajudar outras pessoas a escolher a melhor empresa.
              </p>
              <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-left text-[11px] text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-600" />
                As avaliações são publicadas conforme as regras de moderação da plataforma.
              </div>
            </div>
          )}
        </div>

        <SheetFooter
          className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 dark:border-slate-800 dark:bg-slate-950 sm:px-5"
        >
          <div className="grid w-full grid-cols-1 gap-2">
            {hasReviews && (
              <Button asChild className="h-11 min-h-11 w-full rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700">
                <Link href={reviewsPath} onClick={() => onOpenChange(false)}>
                  Ver todas as avaliações <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant={hasReviews ? 'outline' : 'default'}
              className={cn(
                'h-11 min-h-11 w-full rounded-xl text-xs font-semibold',
                !hasReviews && 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <Link href={targetReviewUrl} onClick={() => onOpenChange(false)}>
                <PenSquare aria-hidden="true" className="mr-1.5 h-4 w-4" />
                Avaliar esta empresa
              </Link>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default CompanyReviewsSummarySheet;
