'use client';

import { Check, Quote, Share2, Star, ThumbsUp, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ReviewV2 {
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
}

export function EditorialReviewCard({ review }: { review: ReviewV2 }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  const hasPros = review.pros?.length > 0;
  const hasCons = review.cons?.length > 0;

  return (
    <article className="clay-surface clay-convex overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] shadow-[0_18px_50px_-34px_rgba(15,23,42,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-38px_rgba(15,23,42,0.4)]">
      <div className="space-y-5 p-5 sm:p-6 lg:p-7">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 border-[3px] border-white shadow-[0_12px_24px_-18px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/70 sm:h-14 sm:w-14">
              <AvatarImage src={review.user.avatar_url || undefined} />
              <AvatarFallback className="bg-slate-100 font-medium text-slate-900">
                {review.user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1.5 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-medium leading-tight tracking-tight text-slate-950 sm:text-lg">{review.user.name}</span>
                {review.verified && (
                  <span className="rounded-lg border border-slate-200 bg-white/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_18px_-16px_rgba(15,23,42,0.45)]">
                    Verificado
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                <span>{formatDate(review.created_at)}</span>
                <span className="text-slate-300">•</span>
                <span className="rounded-lg border border-slate-200 bg-slate-100/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  {review.category_name || 'Serviço'}
                </span>
              </div>
            </div>
          </div>
          <div
            className="clay-surface clay-convex flex w-fit items-center gap-2.5 rounded-2xl border border-slate-200/70 bg-white px-3.5 py-2.5 text-slate-950 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.5)] sm:px-4"
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
            &ldquo;{review.headline}&rdquo;
          </h3>
          <p className="max-w-4xl cursor-default text-sm font-normal leading-relaxed text-slate-500 line-clamp-4 transition-all hover:line-clamp-none">
            {review.comment}
          </p>
        </div>

        <div className="h-px bg-slate-200/80" />

        {/* Pros & Cons */}
        <div className={cn(
          'grid overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_44px_-36px_rgba(15,23,42,0.35)]',
          hasPros && hasCons ? 'sm:grid-cols-2' : 'sm:grid-cols-1'
        )}>
          {hasPros && (
            <div className="p-4 sm:p-5">
              <h5 className="mb-3 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-800">
                <span className="clay-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-slate-200 bg-white text-slate-950">
                  <Check className="h-4 w-4" />
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
            <div className={cn(
              'p-4 sm:p-5',
              hasPros && 'border-t border-slate-200/80 sm:border-l sm:border-t-0'
            )}>
              <h5 className="mb-3 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-800">
                <span className="clay-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-slate-200 bg-white text-slate-950">
                  <X className="h-4 w-4" />
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
          <div className="clay-surface clay-convex group relative overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.35)] sm:p-5">
            <Quote className="absolute -right-1 bottom-1 h-16 w-16 text-slate-200/70 transition-transform group-hover:rotate-6" />
            <h5 className="relative z-10 mb-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">Dica do Comprador</h5>
            <p className="relative z-10 text-sm font-normal italic leading-relaxed text-slate-700">
              &ldquo;{review.buyer_tip}&rdquo;
            </p>
          </div>
        )}

        {/* Granular Scores Snapshot */}
        {review.granular_scores && review.granular_scores.length > 0 && (
          <div className="rounded-[1.25rem] border border-slate-200/80 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_-30px_rgba(15,23,42,0.35)] sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {review.granular_scores.map((score, i) => (
                <div key={i} className={cn('space-y-2', i > 0 && 'lg:border-l lg:border-slate-200/80 lg:pl-5')}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">{score.title}</span>
                    <span className="text-sm font-medium text-slate-950">{score.score.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]">
                    <div
                      className="h-full rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                      style={{ width: `${(score.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-200/80 bg-white/45 px-5 py-3.5 sm:px-6 lg:px-7">
        <button className="clay-chip group flex h-10 items-center gap-2.5 rounded-xl border-slate-200 bg-white px-3.5 text-slate-500 transition-colors hover:text-slate-950">
          <ThumbsUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          <span className="text-[10px] font-medium uppercase tracking-[0.14em]">Útil</span>
        </button>
        <button className="clay-chip group flex h-10 items-center gap-2.5 rounded-xl border-slate-200 bg-white px-3.5 text-slate-500 transition-colors hover:text-slate-950">
          <Share2 className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] sm:inline">Compartilhar</span>
        </button>
      </div>
    </article>
  );
}
