'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { reviewsApi, type Review } from '@/lib/api';
import { useDashboardContext } from '../DashboardLayoutClient';
import { ReviewCompanyAvatar } from '@/components/review-dashboard/ReviewCompanyAvatar';
import { ReviewMetricStrip, type ReviewMetricKey } from '@/components/review-dashboard/ReviewMetricStrip';
import { ReviewAction } from '@/components/company/ReviewAction';

const reviewStatusLabel = (status?: string) => {
  if (status === 'approved') return 'Publicada';
  if (status === 'pending' || status === 'in_analysis') return 'Em análise';
  if (status === 'rejected') return 'Rejeitada';
  if (status === 'archived') return 'Arquivada';
  return 'Registrada';
};

const reviewStatusTone = (status?: string) => {
  if (status === 'approved') return 'border-[#A7F0BA] bg-[#DEFBE6] text-[#0E6027]';
  if (status === 'pending' || status === 'in_analysis') return 'border-[#F1C21B] bg-[#FCF4D6] text-[#684E00]';
  if (status === 'rejected') return 'border-[#FFB3B8] bg-[#FFF1F1] text-[#A2191F]';
  return 'border-[#DDE5EF] bg-[#F4F7FB] text-[#525252]';
};

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function companyNameOf(review: Review) {
  return typeof review.company === 'string' ? review.company : review.company?.name || 'Empresa avaliada';
}

function companyLogoOf(review: Review) {
  return typeof review.company === 'string' ? null : review.company?.logo_url;
}

function ReviewEditForm({
  review, onCancel, onSaved,
}: {
  review: Review;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(review.rating);
  const [headline, setHeadline] = useState(review.headline || '');
  const [comment, setComment] = useState(review.comment || '');
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      toast.error('Escolha uma nota entre 1 e 5.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Descreva sua experiência antes de reenviar.');
      return;
    }

    setSaving(true);
    try {
      await reviewsApi.update(review.id, {
        rating,
        headline: headline.trim(),
        comment: comment.trim(),
      });
      toast.success('Avaliação enviada novamente para moderação.');
      onSaved();
    } catch (error) {
      const payload = error as { message?: string };
      toast.error(payload.message || 'Não foi possível enviar a avaliação. Verifique os campos.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-3 space-y-3 border-t border-[#E0E0E0] pt-4" aria-label="Corrigir avaliação">
      <div className="grid grid-cols-[105px_1fr] gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-[#525252]">
          Nota
          <select
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            className="h-11 rounded border border-[#8D8D8D] bg-white px-2 text-[#161616] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F62FE]"
            required
          >
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[#525252]">
          Título
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            maxLength={120}
            placeholder="Resuma sua experiência"
            className="h-11 min-w-0 rounded border border-[#8D8D8D] bg-white px-3 text-[#161616] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F62FE]"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium text-[#525252]">
        Sua experiência
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={500}
          minLength={1}
          required
          rows={4}
          className="w-full rounded border border-[#8D8D8D] bg-white p-3 text-sm text-[#161616] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F62FE]"
        />
        <span className="self-end text-[11px] text-[#6F6F6F]">{comment.length} / 500</span>
      </label>
      <p className="text-[11px] leading-5 text-[#6F6F6F]">
        Ao salvar, o status voltará para Em análise. A equipe fará uma nova moderação.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 rounded bg-[#0F62FE] px-4 text-xs font-semibold text-white hover:bg-[#0043CE] disabled:opacity-50"
        >
          {saving ? 'Enviando…' : 'Corrigir e reenviar'}
        </button>
        <button type="button" onClick={onCancel} className="min-h-11 rounded border border-[#C6C6C6] px-3 text-xs font-medium text-[#393939]">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AvaliacoesPage() {
  const { reviews, reviewsLoading, reviewsError, onRefresh } = useDashboardContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewMetricKey>('all');
  const [sortBy, setSortBy] = useState('recent');
  const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get('review');
    if (target && /^\d+$/.test(target)) setExpandedReviewId(Number(target));
  }, []);

  const counts = useMemo(() => ({
    total: reviews.length,
    published: reviews.filter((review) => review.status === 'approved').length,
    pending: reviews.filter((review) => review.status === 'pending' || review.status === 'in_analysis').length,
    rejected: reviews.filter((review) => review.status === 'rejected').length,
  }), [reviews]);

  const visibleReviews = useMemo(() => reviews
    .filter((review) => {
      if (statusFilter === 'approved' && review.status !== 'approved') return false;
      if (statusFilter === 'rejected' && review.status !== 'rejected') return false;
      if (statusFilter === 'in_review' && review.status !== 'pending' && review.status !== 'in_analysis') return false;
      const query = search.trim().toLocaleLowerCase('pt-BR');
      return !query || (companyNameOf(review) + ' ' + (review.headline || '')).toLocaleLowerCase('pt-BR').includes(query);
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'rating_asc') return (a.rating || 0) - (b.rating || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }), [reviews, search, sortBy, statusFilter]);

  async function shareReview(review: Review) {
    const slug = typeof review.company === 'string' ? null : review.company?.slug;
    if (!slug || review.status !== 'approved') return;
    const url = new URL('/companies/' + encodeURIComponent(slug) + '#reviews', window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Minha avaliação no Avalia Solar', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link da empresa copiado.');
      }
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') {
        toast.error('Não foi possível compartilhar.');
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 pb-6 text-[#161616]">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-[#DDE5EF] pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6F6F6F]">Central de avaliações</p>
          <h1 className="mt-1 text-xl font-semibold text-[#0F2F64] sm:text-2xl">Minhas avaliações</h1>
          <p className="mt-1 text-xs text-[#525252]">Gerencie suas experiências e acompanhe a moderação.</p>
        </div>
        <ReviewAction href="/companies" compactLabel="Avaliar" />
      </header>

      <ReviewMetricStrip
        total={counts.total}
        published={counts.published}
        pending={counts.pending}
        rejected={counts.rejected}
        loading={reviewsLoading}
        active={statusFilter}
        onSelect={setStatusFilter}
      />

      <section className="space-y-2" aria-label="Filtros de avaliações">
        <div className="grid grid-cols-[1fr_130px] gap-2 sm:grid-cols-[1fr_180px]">
          <label className="sr-only" htmlFor="reviews-search">Buscar avaliações</label>
          <input
            id="reviews-search"
            type="search"
            value={search}
            placeholder="Buscar empresa ou título"
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 min-w-0 rounded border border-[#C6C6C6] bg-white px-3 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F62FE]"
          />
          <label className="sr-only" htmlFor="reviews-sort">Ordenar avaliações</label>
          <select
            id="reviews-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="h-11 min-w-0 rounded border border-[#C6C6C6] bg-white px-2 text-[11px] font-medium sm:text-xs"
          >
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="rating_desc">Maior nota</option>
            <option value="rating_asc">Menor nota</option>
          </select>
        </div>
      </section>

      {reviewsError && (
        <div role="alert" className="flex items-center justify-between gap-2 border-l-[3px] border-[#DA1E28] bg-[#FFF1F1] p-3 text-xs text-[#A2191F]">
          <span>{reviewsError}</span>
          <button type="button" onClick={onRefresh} className="min-h-9 shrink-0 font-semibold underline">Tentar novamente</button>
        </div>
      )}

      {reviewsLoading ? (
        <div className="space-y-2" role="status" aria-label="Carregando suas avaliações">
          {[0, 1, 2].map((value) => <div key={value} className="h-20 animate-pulse rounded bg-[#E0E0E0]" />)}
        </div>
      ) : visibleReviews.length ? (
        <div className="divide-y divide-[#E0E0E0] overflow-hidden rounded-lg border border-[#DDE5EF] bg-white">
          {visibleReviews.map((review) => {
            const companyName = companyNameOf(review);
            const expanded = expandedReviewId === review.id;
            const editing = editingReviewId === review.id;
            const canEdit = review.status === 'rejected' || review.status === 'pending' || review.status === 'in_analysis';
            return (
              <article key={review.id} className="px-3 py-3 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <ReviewCompanyAvatar name={companyName} logoUrl={companyLogoOf(review)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xs font-semibold text-[#0F2F64] sm:text-sm">{companyName}</h2>
                    <p className="mt-0.5 truncate text-[11px] text-[#6F6F6F]">
                      <span className="font-semibold text-[#B28600]">★</span>{' '}
                      {typeof review.rating === 'number' ? review.rating.toFixed(1).replace('.', ',') : '—'} / 5 · {formatDate(review.created_at)}
                    </p>
                  </div>
                  <span className={'shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ' + reviewStatusTone(review.status)}>
                    {reviewStatusLabel(review.status)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs text-[#525252]">{review.headline || 'Avaliação da experiência'}</p>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={'review-detail-' + review.id}
                    onClick={() => {
                      setExpandedReviewId(expanded ? null : review.id);
                      setEditingReviewId(null);
                    }}
                    className="min-h-9 shrink-0 rounded px-2 text-xs font-semibold text-[#0F62FE] hover:bg-[#EDF5FF]"
                  >
                    {expanded ? 'Fechar' : 'Ver detalhes'}
                  </button>
                </div>

                {expanded && (
                  <div id={'review-detail-' + review.id} className="mt-3 border-t border-[#E0E0E0] pt-3">
                    {review.status === 'rejected' && (
                      <div className="mb-3 border-l-[3px] border-[#DA1E28] bg-[#FFF1F1] px-3 py-2 text-xs leading-5 text-[#A2191F]">
                        <strong className="block">A avaliação precisa de ajustes</strong>
                        {review.moderation_notes || 'Consulte os critérios da plataforma antes de reenviar sua avaliação.'}
                        {review.moderated_at && <span className="mt-1 block">Decisão: {formatDate(review.moderated_at)}</span>}
                      </div>
                    )}
                    {editing ? (
                      <ReviewEditForm
                        key={review.id}
                        review={review}
                        onCancel={() => setEditingReviewId(null)}
                        onSaved={() => {
                          setEditingReviewId(null);
                          onRefresh();
                        }}
                      />
                    ) : (
                      <>
                        <p className="whitespace-pre-line text-sm leading-6 text-[#393939]">
                          {review.comment || 'Sem comentário registrado.'}
                        </p>
                        {review.reply && (
                          <div className="mt-3 border-l-[3px] border-[#0F62FE] bg-[#F4F7FB] px-3 py-2">
                            <strong className="block text-xs text-[#0F2F64]">Resposta da empresa</strong>
                            <p className="mt-1 text-xs leading-5 text-[#525252]">{review.reply}</p>
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setEditingReviewId(review.id)}
                              className="min-h-10 rounded border border-[#0F62FE] px-3 text-xs font-semibold text-[#0F62FE] hover:bg-[#EDF5FF]"
                            >
                              {review.status === 'rejected' ? 'Corrigir e reenviar' : 'Editar avaliação'}
                            </button>
                          )}
                          {review.status === 'approved' && typeof review.company !== 'string' && review.company?.slug && (
                            <button type="button" onClick={() => void shareReview(review)} className="min-h-10 rounded border border-[#C6C6C6] px-3 text-xs font-semibold text-[#393939] hover:bg-[#F4F7FB]">
                              Compartilhar
                            </button>
                          )}
                          {review.status === 'approved' && <p className="self-center text-[11px] text-[#6F6F6F]">Conteúdo publicado e protegido por moderação.</p>}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-[#DDE5EF] bg-white px-5 py-9 text-center">
          <h2 className="text-sm font-semibold text-[#0F2F64]">Nenhuma avaliação encontrada</h2>
          <p className="mt-2 text-xs text-[#6F6F6F]">Ajuste os filtros ou avalie uma empresa.</p>
          <button type="button" onClick={() => { setStatusFilter('all'); setSearch(''); }} className="mt-3 min-h-10 rounded border border-[#0F62FE] px-3 text-xs font-semibold text-[#0F62FE]">Limpar filtros</button>
        </div>
      )}
      <p className="text-[11px] leading-5 text-[#6F6F6F]">
        Avaliações rejeitadas podem ser corrigidas e reenviadas. Alterações de avaliações publicadas exigem um fluxo versionado de moderação.
      </p>
    </main>
  );
}
