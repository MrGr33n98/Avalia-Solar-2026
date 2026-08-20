'use client';

import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { ProfileSummary } from '@/components/review-dashboard/profile/ProfileSummary';
import { MetricCard } from '@/components/review-dashboard/cards/MetricCard';
import { ActionCard } from '@/components/review-dashboard/cards/ActionCard';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { useDashboardContext } from './DashboardLayoutClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  Leaf,
  Star,
  Clock,
  Zap,
  Trophy,
  Activity,
  CheckCircle2,
  CircleDot,
} from 'lucide-react';

export default function MeuPainelPage() {
  const { user } = useAuth();
  const {
    summary,
    reviews,
    error,
    onRefresh,
    solutions,
    summaryLoading,
    reviewsLoading,
    leadsLoading,
  } = useDashboardContext();

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

  const greenScore = summary?.gamification?.green_score ?? null;
  const reviewsCount = reviews.length;

  const inAnalysisCount = reviews.filter(
    (r) => r.status === 'in_analysis' || r.status === 'pending'
  ).length;
  const profileCompletion = summary?.profile?.completion_percent ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <ReviewerPageHeader
        title="Meu painel"
        description="Acompanhe suas contribuições e evolua de nível."
        action={
          <a
            href="/review-dashboard/achievements"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-500 transition-colors"
          >
            <Trophy className="h-4 w-4" />
            Avance de nível
          </a>
        }
      />

      {/* Profile Summary */}
      <ProfileSummary levelName={summary?.gamification?.level?.name} profileCompletion={profileCompletion} />

      {/* KPIs */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <MetricCard
          label="Green Score"
          value={greenScore}
          unavailable={summaryLoading || greenScore === null || greenScore === undefined}
          caption="Calculado por contribuições reais"
          icon={Leaf}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          highlight
        />
        <MetricCard
          label="Avaliações"
          value={reviewsLoading ? null : reviewsCount}
          caption="Total realizadas"
          icon={Star}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          label="Em análise"
          value={inAnalysisCount}
          caption="Aguardando aprovação"
          icon={Clock}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      {/* Ações rápidas */}
      <div>
        <SectionHeader title="Ações rápidas" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Bottom grid: Conquistas + Atividade + Resumo + Dica */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conquistas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader
            title="Conquistas"
            linkLabel="Ver todas as conquistas"
            linkHref="/review-dashboard/achievements"
          />
          <div className="space-y-3">
            {summaryLoading ? (
              <div className="space-y-2">
                <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
                <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
              </div>
            ) : (summary?.gamification?.achievements ?? []).length > 0 ? (
              (summary?.gamification?.achievements ?? [])
                .slice(0, 2)
                .map(
                  (
                    achievement: { title: string; subtitle: string; state: string },
                    index: number
                  ) => (
                    <AchievementItem
                      key={index}
                      title={achievement.title}
                      description={achievement.subtitle}
                      unlocked={achievement.state !== 'bloqueado'}
                    />
                  )
                )
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Nenhuma conquista disponível.</p>
            )}
          </div>
        </div>

        {/* Atividade recente */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader title="Atividade recente" />
          {reviews.length === 0 && solutions.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Activity className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-700">Comece sua contribuição</p>
              <p className="mt-1 text-xs text-slate-400">
                Ainda não há atividades para mostrar. Explore o dashboard e comece agora!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="flex items-start gap-2.5 text-sm">
                  <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-slate-700 truncate">
                      Avaliação:{' '}
                      {typeof review.company === 'string'
                        ? review.company
                        : review.company?.name || 'Empresa'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo do perfil */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionHeader
            title="Resumo do perfil"
            linkLabel="Ver detalhes do perfil"
            linkHref="/review-dashboard/profile"
          />
          <div className="space-y-2.5">
            <ProfileCheckItem
              label="Dados pessoais completos"
              done={!!(user?.name && user?.email)}
            />
            <ProfileCheckItem
              label="Foto de perfil cadastrada"
              done={
                summary?.profile?.items?.find(
                  (i: { key: string; completed: boolean }) => i.key === 'avatar'
                )?.completed ?? false
              }
            />
            <ProfileCheckItem label="Localização definida" done={!!(user?.city && user?.state)} />
            <ProfileCheckItem
              label="Profissão preenchida"
              done={
                summary?.profile?.items?.find(
                  (i: { key: string; completed: boolean }) => i.key === 'profession'
                )?.completed ?? false
              }
            />
            <ProfileCheckItem
              label="Soluções adicionadas"
              done={solutions.length > 0}
              detail={`${solutions.length}/5`}
            />
            <ProfileCheckItem
              label="Primeira avaliação publicada"
              done={reviewsCount > 0}
              detail={`${Math.min(reviewsCount, 1)}/1`}
            />
          </div>
        </div>

        {/* Dica da comunidade */}
        <TipCard title="Dica da Comunidade">
          Perfis completos recebem até 2x mais visualizações e até 3x mais propostas.
        </TipCard>
      </div>
    </div>
  );
}

function AchievementItem({
  title,
  description,
  unlocked,
}: {
  title: string;
  description: string;
  unlocked: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`rounded-xl p-2 shrink-0 ${unlocked ? 'bg-green-50' : 'bg-slate-50'}`}>
        <Trophy className={`h-4 w-4 ${unlocked ? 'text-green-600' : 'text-slate-400'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
        {!unlocked && (
          <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Ainda não conquistado
          </span>
        )}
      </div>
    </div>
  );
}

function ProfileCheckItem({
  label,
  done,
  detail,
}: {
  label: string;
  done: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <CircleDot className="h-4 w-4 text-slate-300 shrink-0" />
      )}
      <span className="text-sm text-slate-600 flex-1 truncate">{label}</span>
      {detail && <span className="text-xs text-slate-400 shrink-0">{detail}</span>}
    </div>
  );
}
