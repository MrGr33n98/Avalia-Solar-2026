'use client';

import { Star, ThumbsUp, Quote, Check, X, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <Avatar className="h-12 w-12 border-2 border-slate-50">
              <AvatarImage src={review.user.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                {review.user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{review.user.name}</span>
                {review.verified && (
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <ShieldCheck className="h-3 w-3 text-green-600" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">Verificada</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{formatDate(review.created_at)}</span>
                <span className="text-slate-200">•</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {review.category_name || 'Serviço'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-950 text-white px-3 py-1.5 rounded-xl shadow-lg">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-black text-sm">{Number(review.rating).toFixed(1)}</span>
          </div>
        </div>

        {/* Headline & Comment */}
        <div className="space-y-3">
          <h3 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
            &ldquo;{review.headline}&rdquo;
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-default">
            {review.comment}
          </p>
        </div>

        {/* Pros & Cons */}
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          {review.pros?.length > 0 && (
            <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
              <h5 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Check className="h-3 w-3" /> O que foi bom
              </h5>
              <ul className="space-y-2">
                {review.pros.map((pro, i) => (
                  <li key={i} className="text-xs text-green-900 font-medium leading-tight">
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.cons?.length > 0 && (
            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
              <h5 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                <X className="h-3 w-3" /> O que melhorar
              </h5>
              <ul className="space-y-2">
                {review.cons.map((con, i) => (
                  <li key={i} className="text-xs text-red-900 font-medium leading-tight">
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Buyer Tip */}
        {review.buyer_tip && (
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 relative group overflow-hidden">
            <Quote className="absolute -right-2 -bottom-2 h-12 w-12 text-blue-100 group-hover:rotate-12 transition-transform" />
            <h5 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 relative z-10">Dica do Comprador</h5>
            <p className="text-sm text-blue-900 italic font-medium relative z-10 leading-snug">
              &ldquo;{review.buyer_tip}&rdquo;
            </p>
          </div>
        )}

        {/* Granular Scores Snapshot */}
        {review.granular_scores && review.granular_scores.length > 0 && (
          <div className="pt-6 border-t border-slate-50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8">
              {review.granular_scores.map((score, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{score.title}</span>
                    <span className="text-xs font-black text-slate-900">{score.score.toFixed(1)}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full" 
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
      <div className="bg-slate-50/50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
        <button className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors group">
          <ThumbsUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-tighter">Útil</span>
        </button>
        <div className="flex items-center gap-4">
          <button className="text-xs font-bold text-slate-400 uppercase tracking-tighter hover:text-slate-900 transition-colors">
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}
