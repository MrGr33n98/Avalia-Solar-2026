'use client';

import Link from 'next/link';
import { ReviewerShell } from '@/components/reviewer/ReviewerShell';
import { ReviewerSkeleton } from '@/components/reviewer/ReviewerSkeleton';
import { ReviewerErrorState } from '@/components/reviewer/ReviewerErrorState';
import { ReviewerEmptyState } from '@/components/reviewer/ReviewerEmptyState';
import { useReviewerReviews } from '@/hooks/reviewer/useReviewerReviews';

const statusLabels: Record<string, string> = { pending: 'Enviada', in_analysis: 'Em análise', approved: 'Publicada', rejected: 'Rejeitada', draft: 'Rascunho' };

export default function ReviewerReviewsPage() {
  const { reviews, loading, error, refetch } = useReviewerReviews();
  return <ReviewerShell><div className="space-y-6"><header><Link href="/review-dashboard" className="text-sm font-semibold text-blue-600">Voltar ao painel</Link><h1 className="mt-2 text-3xl font-bold text-slate-950">Minhas avaliações</h1><p className="mt-2 text-slate-600">Acompanhe status e respostas reais das empresas.</p></header>{loading ? <ReviewerSkeleton /> : error ? <ReviewerErrorState onRetry={() => void refetch()} /> : reviews.length === 0 ? <ReviewerEmptyState /> : <section className="space-y-3" aria-label="Lista de avaliações">{reviews.map((review) => { const company = typeof review.company === 'string' ? review.company : review.company?.name || 'Empresa'; return <article key={review.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-950">{company}</h2><p className="mt-1 text-sm text-slate-500">{new Date(review.created_at).toLocaleDateString('pt-BR')}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{statusLabels[review.status || 'pending'] || review.status}</span></div><p className="mt-3 text-amber-600" aria-label={`Nota ${review.rating} de 5`}>{'★'.repeat(Math.round(review.rating))}{'☆'.repeat(5 - Math.round(review.rating))}</p>{review.comment && <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.comment}</p>}{review.reply && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Resposta da empresa</p><p className="mt-1 text-sm text-slate-700">{review.reply}</p></div>}</article>; })}</section>}</div></ReviewerShell>;
}
