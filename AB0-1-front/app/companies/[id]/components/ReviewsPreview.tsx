'use client';

import Image from 'next/image';
import { MessageSquare, Star, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Company, Review } from '@/lib/api';
import { RatingStars } from '@/components/RatingStars';
import { getFullImageUrl } from '@/utils/image';

interface ReviewsPreviewProps {
  company: Company;
  reviews: Review[];
  reviewsLoading: boolean;
  onTabChange: (tabId: string) => void;
}

export default function ReviewsPreview({
  company,
  reviews = [],
  reviewsLoading = false,
  onTabChange,
}: ReviewsPreviewProps) {
  const companyStats = company as Company & {
    total_reviews?: number | string | null;
    reviews_count?: number | string | null;
  };
  const averageRating = Number(
    companyStats.average_rating ?? companyStats.rating_avg ?? companyStats.rating ?? 0
  );
  const ratingCount = Number(
    companyStats.rating_count ?? companyStats.total_reviews ?? companyStats.reviews_count ?? 0
  );

  const recentReviews = reviews
    .filter((review) => {
      const content = String(review.comment ?? review.body ?? '').trim();
      return content.length > 0;
    })
    .slice(0, 2);

  return (
    <Card className="relative overflow-hidden rounded-[2px] border border-slate-300 bg-white shadow-none">
      <div className="flex flex-col">
        {/* Cabeçalho de Avaliações */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-300 px-5 py-5 sm:px-6">
          <div className="flex items-center">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[#0B1F4B]">Avaliações</h3>
              <p className="text-xs text-slate-500">
                Depoimentos reais de integradores e clientes.
              </p>
            </div>
          </div>
          {ratingCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTabChange('reviews')}
              className="inline-flex min-h-11 items-center gap-1 rounded-[2px] px-3 text-xs font-bold text-blue-700 hover:bg-slate-50 hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Resumo de Reputação Geral */}
        {ratingCount > 0 && (
          <div className="m-5 flex flex-col gap-4 border border-slate-300 bg-slate-50 p-4 sm:m-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center border border-slate-300 bg-white p-3">
                <span className="text-2xl font-black text-slate-950 leading-none">
                  {averageRating.toFixed(1)}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Nota
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Excelente reputação geral</p>
                <div className="mt-1 flex items-center gap-2">
                  <RatingStars
                    rating={averageRating}
                    showCount={false}
                    starClassName="h-3.5 w-3.5 text-amber-500"
                  />
                  <span className="text-xs text-slate-500 font-semibold">
                    ({ratingCount} {ratingCount === 1 ? 'opinião' : 'opiniões'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Depoimentos Recentes */}
        {reviewsLoading ? (
          <div
            className="border-t border-slate-200 px-5 py-8 text-center text-sm text-slate-600"
            role="status"
            aria-live="polite"
          >
            Carregando depoimentos...
          </div>
        ) : recentReviews.length > 0 ? (
          <div className="grid grid-cols-1 border-t border-slate-300 md:grid-cols-2">
            {recentReviews.map((review) => {
              const authorName = review.user?.name || 'Usuário';
              const avatarRaw = review.user?.avatar_url;
              const avatarUrl = avatarRaw ? getFullImageUrl(avatarRaw) : null;
              const content = String(review.comment ?? review.body ?? '').trim();
              const initials = authorName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((token: string) => token.charAt(0).toUpperCase())
                .join('');

              return (
                <div
                  key={review.id}
                  className="flex flex-col justify-between border-b border-slate-300 bg-white p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-6"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-300 bg-white">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={`Avatar de ${authorName}`}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-600 bg-slate-100">
                              {initials || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 leading-tight">
                            {authorName}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-600">Cliente verificado</p>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1 border border-amber-300 bg-amber-50 px-2 py-1 text-amber-800"
                        aria-label={`Nota ${Number(review.rating || 0).toFixed(1)} de 5`}
                      >
                        <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                        <span className="text-[10px] font-bold leading-none">
                          {Number(review.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-700">{content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Estado Vazio Premium */
          <div className="m-5 border border-slate-300 bg-slate-50 p-8 text-center sm:m-6">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-500" aria-hidden="true" />
            <h4 className="font-bold text-slate-900 text-sm">Seja o primeiro a avaliar!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              Sua opinião ajuda milhares de consumidores a escolherem o integrador ideal para a
              instalação de energia solar.
            </p>
            <Button
              size="sm"
              onClick={() => onTabChange('reviews')}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[2px] bg-[#0B1F4B] text-xs font-bold text-white shadow-none hover:bg-[#102b66] focus-visible:ring-2 focus-visible:ring-[#0B1F4B] focus-visible:ring-offset-2"
            >
              Fazer uma avaliação
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
