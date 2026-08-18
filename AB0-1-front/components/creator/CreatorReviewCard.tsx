'use client';

import { Check, Star, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReviewMediaGallery, type ReviewMediaItem } from '@/components/reviews/ReviewMediaGallery';

export type CreatorReview = {
  id: number;
  title?: string;
  excerpt?: string;
  headline?: string;
  comment?: string;
  rating?: number;
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
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatLabel(value?: string) {
  return value ? labels[value] || value.replaceAll('_', ' ') : null;
}

export function CreatorReviewCard({ review }: { review: CreatorReview }) {
  const authorName = review.user?.name || 'Avaliador Avalia Solar';
  const headline = review.headline || review.title || 'Avaliação publicada';
  const comment = review.comment || review.excerpt;
  const rating = Number(review.rating || 0);
  const projectType = formatLabel(review.project_type);
  const installationStatus = formatLabel(review.installation_status);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-5 p-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-12 w-12 border border-slate-200 ring-0">
              <AvatarImage src={review.user?.avatar_url || undefined} alt={authorName} />
              <AvatarFallback className="bg-blue-50 font-semibold text-blue-700">
                {authorName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-950">{authorName}</p>
                {review.verified && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                    Verificado
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Publicado em {formatDate(review.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg bg-amber-50 px-3 py-2 text-amber-700" aria-label={`Nota ${rating} de 5`}>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-bold">{rating.toFixed(1)}</span>
            <span className="text-xs text-amber-700">/ 5</span>
          </div>
        </header>

        {review.company && (
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Avatar className="h-9 w-9 border border-slate-200 ring-0">
              <AvatarImage src={review.company.logo_url || undefined} alt="" />
              <AvatarFallback className="bg-white text-xs font-semibold text-slate-600">
                {review.company.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Empresa avaliada</p>
              <p className="font-semibold text-slate-800">{review.company.name}</p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-xl font-bold text-slate-950">{headline}</h3>
          {comment && <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{comment}</p>}
        </div>

        {(review.category_name || projectType || installationStatus || review.estimated_power) && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {review.category_name && <span className="rounded-full bg-slate-100 px-3 py-1">{review.category_name}</span>}
            {projectType && <span className="rounded-full bg-slate-100 px-3 py-1">{projectType}</span>}
            {installationStatus && <span className="rounded-full bg-slate-100 px-3 py-1">{installationStatus}</span>}
            {review.estimated_power && <span className="rounded-full bg-slate-100 px-3 py-1">{review.estimated_power} kWp</span>}
          </div>
        )}

        {(review.pros?.length || review.cons?.length) ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {!!review.pros?.length && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800"><Check className="h-4 w-4" /> O que foi bom</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">{review.pros.map((pro, index) => <li key={index}>{pro}</li>)}</ul>
              </div>
            )}
            {!!review.cons?.length && (
              <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-800"><X className="h-4 w-4" /> O que melhorar</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">{review.cons.map((con, index) => <li key={index}>{con}</li>)}</ul>
              </div>
            )}
          </div>
        ) : null}

        {review.buyer_tip && <div className="rounded-lg border border-blue-100 bg-blue-50 p-4"><h4 className="text-xs font-bold uppercase tracking-wide text-blue-800">Dica do comprador</h4><p className="mt-2 text-sm leading-6 text-slate-700">{review.buyer_tip}</p></div>}

        {review.granular_scores?.length ? (
          <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            {review.granular_scores.map((score, index) => (
              <div key={score.id || `${score.title}-${index}`}>
                <div className="flex justify-between gap-3 text-xs text-slate-600"><span>{score.title}</span><strong>{Number(score.score).toFixed(1)}</strong></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, (Number(score.score) / 5) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        ) : null}

        {review.would_recommend !== undefined && (
          <p className="text-sm font-semibold text-slate-700">{review.would_recommend === true || review.would_recommend === 'true' ? '✓ Recomenda esta empresa' : 'Não recomendaria esta empresa'}</p>
        )}

        <ReviewMediaGallery media={review.media} companyName={review.company?.name} />
      </div>
    </article>
  );
}