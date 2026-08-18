'use client';

import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ReviewMediaGallery } from '@/components/reviews/ReviewMediaGallery';

export interface ReviewV1 {
  id: number;
  rating: number;
  comment: string;
  user: {
    name: string;
    avatar_url: string | null;
  };
  created_at: string;
  media?: Array<{ id: number; thumbnail_url: string; display_url: string; sort_order: number }>;
}

export function LegacyReviewCard({ review }: { review: ReviewV1 }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <article className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <Avatar className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white">
        <AvatarImage src={review.user.avatar_url || undefined} />
        <AvatarFallback className="rounded-full bg-slate-200 text-slate-500 font-bold">
          {review.user.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate">{review.user.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                  {formatDate(review.created_at)}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Avaliação Geral
                </span>
              </div>
            </div>
            <div className="flex gap-0.5 shrink-0" role="img" aria-label={`${review.rating} de 5 estrelas`}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    'h-3 w-3',
                    s <= review.rating ? 'fill-slate-400 text-slate-400' : 'text-slate-200'
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed italic">
          &ldquo;{review.comment}&rdquo;
        </p>
        <ReviewMediaGallery media={review.media} companyName="empresa" />
      </div>
    </article>
  );
}
