'use client';
import { useEffect } from 'react';

import { ProfileSummary } from '@/components/review-dashboard/profile/ProfileSummary';
import { MetricCard } from '@/components/review-dashboard/cards/MetricCard';
import { ActionCard } from '@/components/review-dashboard/cards/ActionCard';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { useDashboardContext } from './DashboardLayoutClient';
import { useAuth } from '@/contexts/AuthContext';
import { buildPrimeDashboardViewModel } from '@/lib/review-dashboard/types';
import { track } from '@/lib/analytics/lazy';
import { Leaf, Star, Clock, Zap, Trophy, Activity, CheckCircle2 } from 'lucide-react';

export default function MeuPainelPage() {
  const { user } = useAuth();
  const {
    summary,
    error,
    onRefresh,
    solutions,
    solutionsLoading,
    solutionsError,
    summaryLoading,
    reviewsLoading,
    leadsLoading,
    reviewsError,
  } = useDashboardContext();

  useEffect(() => {
    if (summaryLoading || !summary) return;
    track('review_dashboard_viewed', {
      profile_completion: summary.profile?.completion_percent ?? null,
      green_score: summary.gamification?.green_score ?? null,
      level: summary.gamification?.level?.name ?? null,
      reviews_total: summary.kpis?.reviews?.total ?? null,
      reviews_pending: summary.kpis?.reviews?.pending ?? null,
      ranking_position: summary.gamification?.regional_ranking ?? null,
    });
  }, [summaryLoading, summary]);
  if (error && !summary && !reviewsLoading && !leadsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-2xl bg-red-50 p-4 mb-4">
          <Activity className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Não foi possível carregar o painel
        </h3>
        <p className="mt-1.5 text-sm text-slate-500">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const inAnalysisCount = summaryLoading ? null : (summary?.kpis?.reviews?.pending ?? null);
  const viewModel = buildPrimeDashboardViewModel({
    user,
    summary,
    reviewsCount: summaryLoading ? null : (summary?.kpis?.reviews?.total ?? null),
    pendingReviews: inAnalysisCount,
    solutionsCount: solutionsLoading || solutionsError ? null : solutions.length,
  });
  const reviewsCount = viewModel.reputation.data?.totalReviews ?? null;
  const greenScore = viewModel.reputation.data?.greenScore ?? null;
  const profileCompletion = viewModel.profile.data?.completionPercent;
  const summaryIsStale = Boolean(summary?.meta?.partial || (summary && error));
  const staleSections = new Set(summary?.meta?.stale_sections ?? []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Meu painel
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Olá, {viewModel.identity.firstName}.
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sua reputação, impacto e próximos passos em um só lugar.
          </p>
          {summaryIsStale && (
            <p className="mt-2 text-xs font-medium text-amber-700" role="status">
              Não foi possível atualizar agora. Exibindo último dado disponível.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Atualizar painel"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <Activity className="h-4 w-4" />
          <span className="sr-only">Atualizar</span>
        </button>
      </div>

      {/* Profile Summary */}
      <ProfileSummary
        levelName={viewModel.identity.levelName}
        profileCompletion={profileCompletion}
        missingFields={viewModel.profile.data?.missingFields ?? []}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section
          className="rounded-2xl bg-[#0B2F7A] p-5 text-white shadow-sm md:p-6"
          aria-labelledby="green-score-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">
                Reputação
              </p>
              <h2 id="green-score-title" className="mt-2 text-lg font-semibold">
                Green Score
              </h2>
            </div>
            <Leaf className="h-5 w-5 text-blue-200" aria-hidden="true" />
          </div>
          <p className="mt-6 text-4xl font-bold tracking-tight">
            {greenScore ?? '—'} <span className="text-base font-medium text-blue-200">pontos</span>
          </p>
          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-label="Progresso do Green Score"
            aria-valuemin={0}
            aria-valuemax={summary?.gamification?.level?.threshold ?? 100}
            aria-valuenow={greenScore ?? 0}
          >
            <div
              className="h-full rounded-full bg-blue-300 transition-all duration-500"
              style={{ width: `${summary?.gamification?.level?.progress ?? 0}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-blue-200">
            <span>{viewModel.identity.levelName ?? 'Nível indisponível'}</span>
            <span>{summary?.gamification?.level?.next ?? 'Próximo nível indisponível'}</span>
          </div>
          <a
            href="/review-dashboard/green-score"
            onClick={() => track('review_dashboard_green_score_opened', {})}
            className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Ver como ganhar pontos →
          </a>
        </section>
        <section
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6"
          aria-labelledby="regional-ranking-title"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Comunidade
          </p>
          <h2 id="regional-ranking-title" className="mt-2 text-lg font-semibold text-slate-900">
            Ranking regional
          </h2>
          <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
            {viewModel.reputation.data?.regionalRanking ?? '—'}{' '}
            <span className="text-base font-medium text-slate-500">posição</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {user?.city && user?.state ? `em ${user.city}, ${user.state}` : 'Região indisponível'}
          </p>
          <a
            href="/review-dashboard/green-score"
            onClick={() => track('review_dashboard_green_score_opened', {})}
            className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            Ver ranking completo →
          </a>
        </section>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <MetricCard
          label="Green Score"
          value={greenScore}
          unavailable={
            summaryLoading ||
            staleSections.has('gamification') ||
            viewModel.reputation.status !== 'ready' ||
            greenScore === null
          }
          unavailableLabel="—"
          caption={summaryLoading ? 'Carregando' : 'Contribuições aprovadas'}
          icon={Leaf}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          highlight
        />
        <MetricCard
          label="Avaliações"
          value={reviewsCount}
          unavailable={Boolean(reviewsError)}
          unavailableLabel="—"
          caption={reviewsError ? 'Indisponível agora' : 'Total realizadas'}
          icon={Star}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          label="Publicadas"
          value={summaryLoading ? null : (summary?.kpis?.reviews_published ?? null)}
          unavailable={
            summaryLoading ||
            summary?.kpis?.reviews_published === null ||
            summary?.kpis?.reviews_published === undefined
          }
          unavailableLabel="—"
          caption="Visíveis na comunidade"
          href="/review-dashboard/reviews?status=published"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <MetricCard
          label="Em análise"
          value={inAnalysisCount}
          unavailable={Boolean(reviewsError)}
          unavailableLabel="—"
          caption="Aguardando aprovação"
          href="/review-dashboard/reviews?status=pending"
          icon={Clock}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Impacto"
          value={viewModel.impact.data?.impactedPeople ?? null}
          unavailable={
            staleSections.has('impact') ||
            viewModel.impact.status !== 'ready' ||
            viewModel.impact.data?.impactedPeople === null
          }
          unavailableLabel="—"
          caption="Pessoas alcançadas"
        />
        <MetricCard
          label="Ranking regional"
          value={viewModel.reputation.data?.regionalRanking ?? null}
          unavailable={
            viewModel.reputation.status !== 'ready' ||
            viewModel.reputation.data?.regionalRanking === null
          }
          unavailableLabel="—"
          caption={
            viewModel.reputation.data?.regionalRanking === null
              ? 'Ainda não disponível'
              : 'Posição atual'
          }
        />
        <MetricCard
          label="Conquistas"
          value={viewModel.reputation.data?.achievementsCount ?? null}
          unavailable={
            viewModel.reputation.status !== 'ready' ||
            viewModel.reputation.data?.achievementsCount === null
          }
          unavailableLabel="—"
          caption="Registradas no perfil"
        />
        <MetricCard
          label="Votos úteis"
          value={viewModel.impact.data?.helpfulVotes ?? null}
          unavailable={
            staleSections.has('impact') ||
            viewModel.impact.status !== 'ready' ||
            viewModel.impact.data?.helpfulVotes === null
          }
          unavailableLabel="—"
          caption="Feedback da comunidade"
          href="/review-dashboard/reviews"
        />
      </div>

      {summary?.gamification?.level && (
        <section
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6"
          aria-labelledby="level-progress-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Seu progresso
              </p>
              <h2 id="level-progress-title" className="mt-2 text-lg font-semibold text-slate-900">
                {summary.gamification.level.name} <span className="text-slate-400">→</span>{' '}
                {summary.gamification.level.next ?? 'Nível máximo'}
              </h2>
            </div>
            <span className="text-sm font-semibold text-blue-700">
              {summary.gamification.level.progress}%
            </span>
          </div>
          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Progresso para próximo nível"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={summary.gamification.level.progress}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${summary.gamification.level.progress}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>{summary.gamification.earned_points ?? '—'} pontos acumulados</span>
            <a
              href="/review-dashboard/green-score"
              onClick={() => track('review_dashboard_green_score_opened', {})}
              className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              Como subir de nível →
            </a>
          </div>
        </section>
      )}
      {/* Ações rápidas */}
      <div>
        <SectionHeader title="Ações rápidas" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            title="Fazer avaliação"
            description="Avalie empresas e soluções"
            icon={Star}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-50"
            href="/companies"
          />
          <ActionCard
            title="Minhas soluções"
            description="Gerencie soluções que você usa"
            icon={Zap}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
            href="/review-dashboard/solutions"
          />
          <ActionCard
            title="Ver conquistas"
            description="Acompanhe suas conquistas"
            icon={Trophy}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-50"
            href="/review-dashboard/achievements"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.25fr_1fr_0.85fr]">
        <NextBestAction action={viewModel.nextAction} />
        <RecentActivity summary={summary} loading={summaryLoading} error={error} />
        <AchievementsPreview summary={summary} loading={summaryLoading} />
      </div>

      {(reviewsError || solutionsError) && (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          Algumas informações não puderam ser atualizadas agora. Os dados disponíveis continuam
          visíveis.
        </p>
      )}

      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
          Dica da comunidade
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-950">
          Perfis completos passam mais confiança para a comunidade e facilitam o contato de
          parceiros.
        </p>
        <a
          href="/review-dashboard/profile"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
        >
          Completar perfil
        </a>
      </section>
    </div>
  );
}

function NextBestAction({
  action,
}: {
  action: ReturnType<typeof buildPrimeDashboardViewModel>['nextAction'];
}) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-[#0B2F7A] p-5 text-white shadow-sm md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">
        Próximo passo
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">{action.title}</h2>
      <p className="mt-2 text-sm leading-6 text-blue-100">{action.description}</p>
      <a
        href={action.href}
        onClick={() => track('review_dashboard_next_action_clicked', { action_type: action.type })}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0B2F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B2F7A]"
      >
        Começar agora
      </a>
    </section>
  );
}

function RecentActivity({
  summary,
  loading,
  error,
}: {
  summary: ReturnType<typeof useDashboardContext>['summary'];
  loading: boolean;
  error: string | null;
}) {
  const activities = summary?.recent_activities ?? [];
  return (
    <section
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] md:p-6"
      aria-labelledby="recent-activity-title"
    >
      <SectionHeader
        title="Atividade recente"
        linkLabel="Ver avaliações"
        linkHref="/review-dashboard/reviews"
      />
      {loading ? (
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ) : error && !summary ? (
        <p className="text-sm text-slate-500">Atividade indisponível agora.</p>
      ) : activities.length === 0 ? (
        <p className="text-sm leading-6 text-slate-500">Nenhuma atividade recente.</p>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 3).map((item, index) => (
            <div key={`${item.title}-${index}`} className="flex gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AchievementsPreview({
  summary,
  loading,
}: {
  summary: ReturnType<typeof useDashboardContext>['summary'];
  loading: boolean;
}) {
  const achievements = summary?.gamification?.achievements ?? [];
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] md:p-6">
      <SectionHeader
        title="Conquistas"
        linkLabel="Ver todas"
        linkHref="/review-dashboard/achievements"
      />
      {loading ? (
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ) : achievements.length === 0 ? (
        <p className="text-sm leading-6 text-slate-500">Sua primeira conquista está próxima.</p>
      ) : (
        <div className="space-y-4">
          {achievements.slice(0, 3).map((item, index) => (
            <div key={`${item.title}-${index}`} className="flex items-start gap-3">
              <div
                className={`rounded-xl p-2 ${item.unlocked === false ? 'bg-slate-100' : 'bg-amber-50'}`}
              >
                <Trophy
                  className={`h-4 w-4 ${item.unlocked === false ? 'text-slate-400' : 'text-amber-600'}`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
