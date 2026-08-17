'use client';

import { Check, Share2, Star, ThumbsUp, X, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ReviewMediaGallery } from '@/components/reviews/ReviewMediaGallery';

export interface ReviewV2 {
  id: number;
  rating: number;
  comment: string;
  headline: string;
  pros: string[];
  cons: string[];
  buyer_tip: string;
  category_id: number;
  category_name?: string;
  user: {
    name: string;
    avatar_url: string | null;
  };
  granular_scores?: Array<{
    title: string;
    score: number;
    weight: number;
  }>;
  created_at: string;
  verified: boolean;
  media?: Array<{ id: number; thumbnail_url: string; display_url: string; sort_order: number }>;
}

export function EditorialReviewCard({ review }: { review: ReviewV2 }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };
  const hasPros = review.pros?.length > 0;
  const hasCons = review.cons?.length > 0;

  return (
    <article className="overflow-hidden rounded-[2px] border border-slate-300 bg-white">
      <div className="space-y-6 p-5 sm:p-7 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-300 sm:h-12 sm:w-12">
              <AvatarImage src={review.user.avatar_url || undefined} />
              <AvatarFallback className="rounded-full bg-slate-100 font-medium text-slate-600">
                {review.user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1.5 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-medium leading-tight tracking-tight text-slate-950 sm:text-lg">
                  {review.user.name}
                </span>
                {review.verified && (
                  <span className="border border-slate-300 bg-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-slate-600">
                    Verificado
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                <span>{formatDate(review.created_at)}</span>
                <span className="text-slate-300">•</span>
                <span className="border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-slate-600">
                  {review.category_name || 'Serviço'}
                </span>
              </div>
            </div>
          </div>
          <div
            className="flex w-fit items-center gap-2.5 rounded-[2px] border border-slate-300 bg-white px-3.5 py-2.5 text-[#0B1F4B] sm:px-4"
            role="img"
            aria-label={`Avaliação: ${Number(review.rating).toFixed(1)} de 5 estrelas`}
          >
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="text-base font-medium">{Number(review.rating).toFixed(1)}</span>
          </div>
        </div>

        {/* Headline & Comment */}
        <div className="space-y-2.5">
          <h3 className="text-xl font-medium leading-tight tracking-tight text-slate-950 sm:text-2xl">
            {review.headline}
          </h3>
          <p className="max-w-4xl cursor-default text-sm font-normal leading-relaxed text-slate-500 line-clamp-4 transition-all hover:line-clamp-none">
            {review.comment}
          </p>
        </div>

        <div className="h-px bg-slate-200/80" />

        {/* Pros & Cons */}
        <div
          className={cn(
            'grid overflow-hidden rounded-[2px] border border-slate-300 bg-white',
            hasPros && hasCons ? 'sm:grid-cols-2' : 'sm:grid-cols-1'
          )}
        >
          {hasPros && (
            <div className="p-4 sm:p-5">
              <h5 className="mb-3 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-800">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-300 bg-white text-[#0B1F4B]">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                O que foi bom
              </h5>
              <ul className="space-y-1.5 pl-[3.25rem]">
                {review.pros.map((pro, i) => (
                  <li key={i} className="text-sm font-normal leading-relaxed text-slate-700">
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasCons && (
            <div
              className={cn(
                'p-4 sm:p-5',
                hasPros && 'border-t border-slate-200/80 sm:border-l sm:border-t-0'
              )}
            >
              <h5 className="mb-3 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-800">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-300 bg-white text-[#0B1F4B]">
                  <X className="h-4 w-4" aria-hidden="true" />
                </span>
                O que melhorar
              </h5>
              <ul className="space-y-1.5 pl-[3.25rem]">
                {review.cons.map((con, i) => (
                  <li key={i} className="text-sm font-normal leading-relaxed text-slate-700">
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Buyer Tip */}
        {review.buyer_tip && (
          <div className="border border-slate-300 bg-slate-50 p-4 sm:p-5">
            <h5 className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
              Dica do comprador
            </h5>
            <p className="text-sm font-normal leading-relaxed text-slate-700">{review.buyer_tip}</p>
          </div>
        )}

        {/* Granular Scores Snapshot */}
        {review.granular_scores && review.granular_scores.length > 0 && (
          <div className="rounded-[2px] border border-slate-300 bg-white p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {review.granular_scores.map((score, i) => (
                <div
                  key={i}
                  className={cn('space-y-2', i > 0 && 'lg:border-l lg:border-slate-200/80 lg:pl-5')}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                      {score.title}
                    </span>
                    <span className="text-sm font-medium text-slate-950">
                      {score.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden bg-slate-200">
                    <div
                      className="h-full bg-[#0B1F4B]"
                      style={{ width: `${(score.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ReviewMediaGallery media={review.media} companyName="empresa" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-300 bg-white px-5 py-3.5 sm:px-7 lg:px-8">
        <button
          type="button"
          className="flex h-11 items-center gap-2.5 rounded-[2px] border border-slate-300 bg-white px-3.5 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F4B]"
        >
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
          <span className="text-[10px] font-medium uppercase tracking-[0.14em]">Útil</span>
        </button>
        <button
          type="button"
          className="flex h-11 items-center gap-2.5 rounded-[2px] border border-slate-300 bg-white px-3.5 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F4B]"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] sm:inline">
            Compartilhar
          </span>
        </button>
      </div>
    </article>
  );
}
