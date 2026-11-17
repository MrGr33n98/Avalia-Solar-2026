'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardContext } from './DashboardLayoutClient';
import { track } from '@/lib/analytics/lazy';
import { ReviewCompanyAvatar } from '@/components/review-dashboard/ReviewCompanyAvatar';
import { ReviewMetricStrip } from '@/components/review-dashboard/ReviewMetricStrip';
import { ReviewAction } from '@/components/company/ReviewAction';

function statusLabel(status?: string) {
  if (status === 'approved') return 'Publicada';
  if (status === 'pending' || status === 'in_analysis') return 'Em análise';
  if (status === 'rejected') return 'Rejeitada';
  if (status === 'archived') return 'Arquivada';
  return 'Registrada';
}

function statusTone(status?: string) {
  if (status === 'approved') return 'border-[#A7F0BA] bg-[#DEFBE6] text-[#0E6027]';
  if (status === 'pending' || status === 'in_analysis') return 'border-[#F1C21B] bg-[#FCF4D6] text-[#684E00]';
  if (status === 'rejected') return 'border-[#FFB3B8] bg-[#FFF1F1] text-[#A2191F]';
  return 'border-[#DDE5EF] bg-[#F4F7FB] text-[#525252]';
}

function formatDate(dateText: string) {
  const value = new Date(dateText);
  return Number.isNaN(value.getTime())
    ? 'Data indisponível'
    : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(value);
}

export default function ReviewerOverviewPage() {
  const { user } = useAuth();
  const { summary, reviews, summaryLoading, reviewsLoading, error, reviewsError, onRefresh } =
    useDashboardContext();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Olá';

  const overview = useMemo(() => {
    const local = {
      total: reviews.length,
      published: reviews.filter((review) => review.status === 'approved').length,
      pending: reviews.filter((review) => ['pending', 'in_analysis'].includes(review.status || '')).length,
      rejected: reviews.filter((review) => review.status === 'rejected').length,
    };
    const counts = summary?.kpis?.reviews;
    return {
      total: counts?.total ?? local.total,
      published: counts?.published ?? local.published,
      pending: counts?.pending ?? local.pending,
      rejected: counts?.rejected ?? local.rejected,
    };
  }, [reviews, summary]);

  const recentReviews = useMemo(
    () => [...reviews]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [reviews]
  );

  useEffect(() => {
    if (!summaryLoading) {
      track('review_dashboard_viewed', {
        experience: 'reviews_only_mvp',
        reviews_total: overview.total,
        reviews_pending: overview.pending,
      });
    }
  }, [summaryLoading, overview.total, overview.pending]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 pb-8 text-[#161616] sm:space-y-5">
      <header className="border-l-[3px] border-[#0F62FE] bg-white px-4 py-4 sm:px-6 sm:py-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#525252]">
          Central de avaliações
        </p>
        <h1 className="mt-2 text-[23px] font-semibold leading-[1.15] tracking-tight text-[#0F2F64] sm:text-3xl">
          {firstName}, acompanhe suas avaliações.
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-[#525252] sm:text-sm">
          Veja o status, acompanhe a moderação e compartilhe experiências reais.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
          <ReviewAction href="/companies" compactLabel="Avaliar" className="w-full sm:w-auto" />
          <Link href="/review-dashboard/reviews" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#C6C6C6] bg-white px-2 text-center text-[11px] font-semibold text-[#0F2F64] transition hover:bg-[#EDF5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F62FE] sm:px-5 sm:text-sm">
            Minhas avaliações
          </Link>
        </div>
      </header>

      {(error || reviewsError) && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-l-[3px] border-[#B28600] bg-[#FCF4D6] px-4 py-3 text-xs text-[#684E00]">
          <span>Parte dos dados não está disponível. Tente atualizar o painel.</span>
          <button type="button" onClick={onRefresh} className="min-h-9 font-semibold underline underline-offset-2">Atualizar</button>
        </div>
      )}

      <ReviewMetricStrip
        total={overview.total}
        published={overview.published}
        pending={overview.pending}
        rejected={overview.rejected}
        loading={summaryLoading || reviewsLoading}
      />

      <section className="overflow-hidden rounded-lg border border-[#DDE5EF] bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-[#E0E0E0] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#0F2F64]">Avaliações recentes</h2>
            <p className="text-[11px] text-[#6F6F6F]">Acompanhe suas contribuições</p>
          </div>
          <Link href="/review-dashboard/reviews" className="shrink-0 rounded px-2 py-2 text-xs font-semibold text-[#0F62FE] hover:bg-[#EDF5FF]">Ver todas →</Link>
        </div>

        {reviewsLoading ? (
          <div className="space-y-2 p-4" role="status" aria-label="Carregando avaliações">
            {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse bg-[#F4F7FB]" />)}
          </div>
        ) : recentReviews.length ? (
          <ul className="divide-y divide-[#E0E0E0]">
            {recentReviews.map((review) => {
              const companyName = typeof review.company === 'string'
                ? review.company : review.company?.name || 'Empresa avaliada';
              const companyLogo = typeof review.company === 'string' ? null : review.company?.logo_url;
              return (
                <li key={review.id}>
                  <Link
                    href={'/review-dashboard/reviews?review=' + review.id}
                    className="flex min-h-[69px] items-center gap-2.5 px-3 py-2.5 transition hover:bg-[#F4F7FB] sm:gap-3 sm:px-5"
                  >
                    <ReviewCompanyAvatar name={companyName} logoUrl={companyLogo} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-[#0F2F64] sm:text-sm">{companyName}</span>
                      <span className="mt-0.5 block text-[11px] text-[#6F6F6F]">
                        <span className="font-semibold text-[#B28600]">★</span>{' '}
                        {typeof review.rating === 'number' ? review.rating.toFixed(1).replace('.', ',') : '—'} / 5 · {formatDate(review.created_at)}
                      </span>
                    </span>
                    <span className={'max-w-[105px] shrink-0 rounded-full border px-2 py-1 text-center text-[10px] font-medium sm:max-w-none sm:text-xs ' + statusTone(review.status)}>
                      {statusLabel(review.status)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-5 py-8 text-center">
            <h3 className="text-sm font-semibold text-[#0F2F64]">Você ainda não avaliou nenhuma empresa</h3>
            <p className="mt-1 text-xs text-[#6F6F6F]">Compartilhe sua experiência para ajudar outras pessoas.</p>
            <Link href="/companies" className="mt-3 inline-flex min-h-10 items-center rounded bg-[#0F62FE] px-4 text-xs font-semibold text-white hover:bg-[#0043CE]">Encontrar empresa</Link>
          </div>
        )}
      </section>
    </main>
  );
}
