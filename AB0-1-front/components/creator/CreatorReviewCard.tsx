'use client';

import { useState } from 'react';
import { Check, ChevronDown, Star, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReviewMediaGallery, type ReviewMediaItem } from '@/components/reviews/ReviewMediaGallery';
import { normalizeReviewList } from '@/lib/reviews/normalizeReviewList';
import { cn } from '@/lib/utils';

export type CreatorReview = {
  id: number;
  title?: string;
  excerpt?: string;
  headline?: string;
  comment?: string;
  rating?: number | string;
  created_at: string;
  verified?: boolean;
  is_legacy?: boolean;
  project_type?: string;
  installation_status?: string;
  estimated_power?: number;
  project_context?: Record<string, unknown>;
  pros?: string[];
  cons?: string[];
  buyer_tip?: string;
  would_recommend?: boolean | string;
  user?: { id?: number; name?: string; avatar_url?: string | null };
  company?: { id: number; name: string; slug?: string; logo_url?: string | null } | null;
  category_id?: number;
  category_name?: string;
  granular_scores?: Array<{ id?: number; title: string; score: number; weight?: number }>;
  media?: ReviewMediaItem[];
};

const labels: Record<string, string> = {
  residential: 'Residencial',
  commercial: 'Comercial',
  industrial: 'Industrial',
  rural: 'Rural',
  completed: 'Instalação concluída',
  in_progress: 'Instalação em andamento',
  waiting: 'Aguardando instalação',
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatLabel(value?: string) {
  return value ? labels[value] || value.replaceAll('_', ' ') : null;
}

export function CreatorReviewCard({ review }: { review: CreatorReview }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const companyName = review.company?.name || 'Empresa não identificada';
  const companyLogo = review.company?.logo_url;
  const headline = review.headline || review.title || 'Avaliação publicada';
  const comment = review.comment || review.excerpt;
  const rating = Number(review.rating || 0);
  const projectType = formatLabel(review.project_type);
  const installationStatus = formatLabel(review.installation_status);
  const pros = normalizeReviewList(review.pros);
  const cons = normalizeReviewList(review.cons);

  const wouldRecommendText =
    review.would_recommend !== undefined
      ? review.would_recommend === true || review.would_recommend === 'true'
        ? 'Sim'
        : 'Não'
      : null;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-blue-300">
      {/* Collapsed Header - Entire area clickable */}
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`creator-review-${review.id}`}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left transition-colors hover:bg-blue-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e5eff] focus-visible:ring-offset-2"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-slate-200 ring-0 shrink-0">
            <AvatarImage src={companyLogo || undefined} alt={companyName} />
            <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
              {companyName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-slate-900 text-sm sm:text-base truncate">
            {companyName}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-slate-500 shrink-0 transition-transform duration-200',
            isExpanded && 'rotate-180 text-blue-600'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Expanded Details Content */}
      {isExpanded && (
        <div
          id={`creator-review-${review.id}`}
          className="border-t border-slate-100 p-4 sm:p-5 space-y-4"
        >
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <div>
              <span className="block text-[10px] uppercase font-semibold text-slate-400">
                Avaliação geral
              </span>
              <div className="flex items-center gap-1 mt-0.5 font-bold text-slate-900">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span>{rating.toFixed(1)} / 5</span>
              </div>
            </div>
            {wouldRecommendText && (
              <div>
                <span className="block text-[10px] uppercase font-semibold text-slate-400">
                  Recomendaria
                </span>
                <span className="block mt-0.5 font-semibold text-slate-800">
                  {wouldRecommendText}
                </span>
              </div>
            )}
            <div>
              <span className="block text-[10px] uppercase font-semibold text-slate-400">
                Avaliado em
              </span>
              <span className="block mt-0.5 font-semibold text-slate-800">
                {formatDate(review.created_at)}
              </span>
            </div>
          </div>

          {/* Headline & Comment */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-950">{headline}</h3>
            {comment && (
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                {comment}
              </p>
            )}
          </div>

          {/* Tags */}
          {(review.category_name || projectType || installationStatus || review.estimated_power) && (
            <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-700">
              {review.category_name && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  {review.category_name}
                </span>
              )}
              {projectType && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{projectType}</span>
              )}
              {installationStatus && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  {installationStatus}
                </span>
              )}
              {review.estimated_power && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  {review.estimated_power} kWp
                </span>
              )}
            </div>
          )}

          {/* Pros and Cons */}
          {pros.length > 0 || cons.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {pros.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="h-3 w-3" />
                    </span>
                    O que foi bom
                  </h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                    {pros.map((pro, index) => (
                      <li key={index}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {cons.length > 0 && (
                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-800">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <X className="h-3 w-3" />
                    </span>
                    O que melhorar
                  </h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                    {cons.map((con, index) => (
                      <li key={index}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {/* Buyer Tip */}
          {review.buyer_tip && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wide text-blue-800">
                Dica do comprador
              </h4>
              <p className="mt-1.5 text-sm leading-6 text-slate-700">{review.buyer_tip}</p>
            </div>
          )}

          {/* Granular Scores */}
          {review.granular_scores?.length ? (
            <div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
              {review.granular_scores.map((score, index) => (
                <div key={score.id || `${score.title}-${index}`}>
                  <div className="flex justify-between gap-3 text-xs text-slate-600">
                    <span>{score.title}</span>
                    <strong>{Number(score.score).toFixed(1)}</strong>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min(100, (Number(score.score) / 5) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Media Gallery */}
          <ReviewMediaGallery media={review.media} companyName={companyName} />
        </div>
      )}
    </article>
  );
}