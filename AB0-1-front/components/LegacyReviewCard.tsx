'use client';

import { Star, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ReviewV1 {
  id: number;
  rating: number;
  comment: string;
  user: {
    name: string;
    avatar_url: string | null;
  };
  created_at: string;
}

export function LegacyReviewCard({ review }: { review: ReviewV1 }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex gap-4 opacity-80 hover:opacity-100 transition-opacity">
      <Avatar className="h-10 w-10 grayscale">
        <AvatarImage src={review.user.avatar_url || undefined} />
        <AvatarFallback className="bg-slate-200 text-slate-400 font-bold">
          {review.user.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-bold text-slate-900">{review.user.name}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">{formatDate(review.created_at)}</span>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">Avaliação Geral</span>
            </div>
          </div>
          <div 
            className="flex gap-0.5" 
            role="img" 
            aria-label={`${review.rating} de 5 estrelas`}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={cn(
                  "h-3 w-3",
                  s <= review.rating ? "fill-slate-400 text-slate-400" : "text-slate-200"
                )} 
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed italic">
          &ldquo;{review.comment}&rdquo;
        </p>
      </div>
    </div>
  );
}
