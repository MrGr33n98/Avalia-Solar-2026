'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, MessageSquareText, Plus, ShieldCheck, Star, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardContext } from './DashboardLayoutClient';
import { track } from '@/lib/analytics/lazy';

const statusLabel = (status: string) => {
  if (status === 'approved') return 'Publicada';
  if (status === 'pending' || status === 'in_analysis') return 'Em análise';
  if (status === 'rejected') return 'Rejeitada';
  return 'Registrada';
};

const statusTone = (status: string) =>
  status === 'approved'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status === 'pending' || status === 'in_analysis'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : status === 'rejected'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-slate-200 bg-slate-50 text-slate-600';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Data indisponível'
    : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function ReviewerOverviewPage() {
  const { user } = useAuth();
  const { summary, reviews, summaryLoading, reviewsLoading, error, reviewsError, onRefresh } = useDashboardContext();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Olá';

  const overview = useMemo(() => {
    const local = {
      total: reviews.length,
      published: reviews.filter((r) => r.status === 'approved').length,
      pending: reviews.filter((r) => r.status === 'pending' || r.status === 'in_analysis').length,
      rejected: reviews.filter((r) => r.status === 'rejected').length,
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

  const loading = summaryLoading || reviewsLoading;
  const kpis = [
    { label: 'Total de avaliações', value: overview.total, icon: Star, tone: 'text-blue-700 bg-blue-50' },
    { label: 'Publicadas', value: overview.published, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Em análise', value: overview.pending, icon: Clock3, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Rejeitadas', value: overview.rejected, icon: XCircle, tone: 'text-rose-700 bg-rose-50' },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 pb-10 text-slate-900">
      <header className="relative overflow-hidden rounded-[28px] border border-[#D7E2F2] bg-gradient-to-br from-[#08275F] via-[#10428C] to-[#1166C9] px-6 py-8 text-white shadow-[0_16px_45px_rgba(12,52,114,0.15)] sm:px-9 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full border-[42px] border-white/[0.07]" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
            <ShieldCheck className="h-3.5 w-3.5" /> Central de avaliações
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
            {firstName}, suas experiências fazem a diferença.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
            Acompanhe suas avaliações, veja o andamento da moderação e ajude outras pessoas a escolher empresas com confiança.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/companies" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0A3A82] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Plus className="h-4 w-4" /> Avaliar uma empresa
            </Link>
            <Link href="/review-dashboard/reviews" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Minhas avaliações <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {(error || reviewsError) && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <span>Alguns dados podem estar indisponíveis. Você pode tentar novamente sem perder suas avaliações.</span>
          <button type="button" onClick={onRefresh} className="rounded-lg border border-amber-300 px-3 py-2 font-semibold hover:bg-amber-100">Atualizar</button>
        </div>
      )}

      <section aria-label="Resumo de avaliações" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className="rounded-2xl border border-[#E1E9F4] bg-white p-4 shadow-[0_6px_24px_rgba(17,49,92,0.04)] sm:p-5">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${kpi.tone}`}><Icon className="h-5 w-5" /></div>
              <div className="mt-4 text-2xl font-extrabold tracking-tight text-[#0B2F67] sm:text-3xl" aria-busy={loading}>
                {loading ? '—' : kpi.value}
              </div>
              <div className="mt-1 text-xs font-semibold leading-snug text-slate-500 sm:text-sm">{kpi.label}</div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E1E9F4] bg-white shadow-[0_8px_28px_rgba(17,49,92,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EEF7] px-5 py-5 sm:px-7">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#112D5A]">Avaliações recentes</h2>
            <p className="mt-1 text-sm text-slate-500">Acompanhe o andamento das suas contribuições.</p>
          </div>
          <Link href="/review-dashboard/reviews" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {reviewsLoading ? (
          <div className="space-y-3 p-6" role="status" aria-label="Carregando avaliações">
            {[0,1,2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : recentReviews.length ? (
          <ul className="divide-y divide-slate-100">
            {recentReviews.map((review) => {
              const companyName = typeof review.company === 'string' ? review.company : review.company?.name || 'Empresa avaliada';
              return (
                <li key={review.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:px-7">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[#122E60]">{companyName}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {review.rating ?? '—'} de 5 · {formatDate(review.created_at)}
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(review.status)}`}>
                    {statusLabel(review.status)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><MessageSquareText className="h-7 w-7" /></div>
            <h3 className="text-base font-bold text-[#16356D]">Sua primeira avaliação começa aqui</h3>
            <p className="max-w-sm text-sm leading-6 text-slate-500">Encontre uma empresa com a qual você teve experiência e compartilhe sua opinião.</p>
            <Link href="/companies" className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Avaliar uma empresa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
