'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { track } from '@/lib/analytics/lazy';
import { ReviewerEmptyState } from '@/components/reviewer/ReviewerEmptyState';
import { ReviewerErrorState } from '@/components/reviewer/ReviewerErrorState';
import { ReviewerShell } from '@/components/reviewer/ReviewerShell';
import { ReviewerSkeleton } from '@/components/reviewer/ReviewerSkeleton';
import { useReviewerDashboard } from '@/hooks/reviewer/useReviewerDashboard';

export default function ReviewerDashboard() {
  const { data, loading, error, refetch } = useReviewerDashboard();
  useEffect(() => { track('reviewer_dashboard_viewed', {}); }, []);

  if (loading) return <ReviewerShell><ReviewerSkeleton /></ReviewerShell>;
  if (error) return <ReviewerShell><ReviewerErrorState onRetry={() => void refetch()} /></ReviewerShell>;
  if (!data) return <ReviewerShell><ReviewerEmptyState /></ReviewerShell>;

  const { summary, green_score: greenScore, achievements, recent_activity: activities, profile, next_best_action: nextAction } = data;

  return <ReviewerShell>
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-blue-600">Área do reviewer</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Meu painel</h1><p className="mt-2 text-slate-600">Acompanhe suas contribuições reais.</p></div>
        <Link href={nextAction.href} onClick={() => track('reviewer_next_action_clicked', { action_type: nextAction.type })} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700">{nextAction.label}</Link>
      </header>

      <section aria-labelledby="summary-title"><h2 id="summary-title" className="sr-only">Resumo</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><article className="rounded-2xl bg-blue-700 p-5 text-white shadow-sm"><p className="text-sm text-blue-100">Green Score</p><p className="mt-2 text-3xl font-bold">{greenScore.score}</p><p className="mt-2 text-xs text-blue-100">Calculado por contribuições reais</p></article>
        {[['Avaliações', summary.reviews_total], ['Publicadas', summary.reviews_published], ['Em análise', summary.reviews_pending], ['Propostas', summary.proposals_total]].map(([label, value]) => <article key={label} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-blue-700">{value}</p></article>)}
      </div></section>

      <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="achievements-title"><h2 id="achievements-title" className="text-lg font-bold text-slate-950">Conquistas</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{achievements.map((achievement) => <div key={achievement.code} className={`rounded-xl border p-4 ${achievement.unlocked ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}><p className="font-semibold text-slate-900">{achievement.name}</p><p className="mt-1 text-xs text-slate-600">{achievement.description}</p><p className="mt-2 text-xs font-bold text-blue-700">{achievement.unlocked ? 'Desbloqueada' : 'Ainda bloqueada'}</p></div>)}</div></section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="activity-title"><h2 id="activity-title" className="text-lg font-bold text-slate-950">Atividade recente</h2>{activities.length === 0 ? <ReviewerEmptyState /> : <ul className="mt-4 divide-y divide-slate-100">{activities.map((activity) => <li key={`${activity.type}-${activity.review_id}`} className="py-4 text-sm text-slate-700">{activity.title}</li>)}</ul>}</section>
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="profile-title"><h2 id="profile-title" className="text-lg font-bold text-slate-950">Perfil</h2><p className="mt-4 text-sm text-slate-600">Completude: <strong>{profile.completion_percent}%</strong></p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${profile.completion_percent}%` }} /></div>{profile.missing_fields.length > 0 && <p className="mt-3 text-xs text-slate-500">Complete os dados do perfil para melhorar sua experiência.</p>}</section>
      </div>
    </div>
  </ReviewerShell>;
}
