'use client';

import { useState } from 'react';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { MetricCard } from '@/components/review-dashboard/cards/MetricCard';
import { EmptyStateCard } from '@/components/review-dashboard/cards/EmptyStateCard';
import { FilterBar } from '@/components/review-dashboard/FilterBar';
import { StatusBadge } from '@/components/review-dashboard/StatusBadge';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { useDashboardContext } from '../DashboardLayoutClient';
import { cn } from '@/lib/utils';
import { Star, Clock, Building2, ThumbsUp, ArrowRight, Plus, AlertCircle, Loader2 } from 'lucide-react';

const tabs = [{ id: 'all', label: 'Minhas avaliações', icon: Star }] as const;

type TabId = (typeof tabs)[number]['id'];

export default function AvaliacoesPage() {
  const { reviews, reviewsLoading, reviewsError, summary, onRefresh } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null);

  const totalReviews = reviews.length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const inAnalysis = reviews.filter(
    (r) => r.status === 'in_analysis' || r.status === 'pending'
  ).length;
  const helpfulVotes = summary?.impact?.helpful_votes ?? 0;

  const filteredReviews = reviews;

  const searchedReviews = search
    ? filteredReviews.filter(
        (r) =>
          (typeof r.company === 'string' ? r.company : r.company?.name || '')
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (r.headline || '').toLowerCase().includes(search.toLowerCase())
      )
    : filteredReviews;

  return (
    <div className="space-y-6">
      <ReviewerPageHeader
        title="Avaliações"
        description="Gerencie e acompanhe suas avaliações de empresas e soluções."
        breadcrumbs={[{ label: 'Dashboard', href: '/review-dashboard' }, { label: 'Avaliações' }]}
        action={
          <a
            href="/companies"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova avaliação
          </a>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <MetricCard
          label="Total"
          value={totalReviews}
          caption="Avaliações realizadas"
          icon={Star}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          label="Publicadas"
          value={approvedCount}
          caption="Aprovadas e visíveis"
          icon={Star}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <MetricCard
          label="Em análise"
          value={inAnalysis}
          caption="Aguardando revisão"
          icon={Clock}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          label="Votos úteis"
          value={helpfulVotes}
          unavailable={
            summary?.impact?.helpful_votes === null || summary?.impact?.helpful_votes === undefined
          }
          caption="Feedback positivo"
          icon={ThumbsUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === 'all' && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {totalReviews}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter */}
          <FilterBar
            searchPlaceholder="Buscar por empresa ou título..."
            searchValue={search}
            onSearchChange={setSearch}
          />

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50" role="status">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-label="Carregando avaliações" />
            </div>
          ) : reviewsError ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 px-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">Não foi possível carregar suas avaliações.</h3>
              <p className="mt-1 text-sm text-slate-600">{reviewsError}</p>
              <button
                type="button"
                onClick={onRefresh}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : searchedReviews.length === 0 ? (
            <EmptyStateCard
              icon={Star}
              title="Nenhuma avaliação ainda"
              description="Comece avaliando empresas de energia solar que você conhece. Sua opinião ajuda outras pessoas a tomarem melhores decisões."
              ctaLabel="Avaliar empresa"
              ctaHref="/companies"
            />
          ) : (
            <div className="space-y-3">
              {searchedReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {review.headline || 'Avaliação'}
                        </h3>
                        <StatusBadge status={review.status || 'pending'} />
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <Building2 className="h-3 w-3" />
                        <span>
                          {typeof review.company === 'string'
                            ? review.company
                            : review.company?.name || 'Empresa'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {/* Rating */}
                      <div className="mt-2 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-3.5 w-3.5',
                              i < (review.rating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            )}
                          />
                        ))}
                        {review.rating && (
                          <span className="ml-1 text-xs text-slate-500">
                            {review.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedReviewId(expandedReviewId === review.id ? null : review.id)
                      }
                      className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      {expandedReviewId === review.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </button>
                  </div>
                  {expandedReviewId === review.id && (
                    <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      <p>{review.comment || 'Sem comentário registrado.'}</p>
                      {review.reply && (
                        <p className="mt-2 rounded-lg bg-slate-50 p-3">
                          <strong>Resposta da empresa:</strong> {review.reply}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rail lateral */}
        <div className="space-y-6">
          {/* Empresas para avaliar */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader title="Empresas para avaliar" />
            <p className="text-sm text-slate-500 mb-4">
              Conheça empresas próximas e compartilhe sua experiência.
            </p>
            <a
              href="/companies"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Explorar empresas
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Dica */}
          <TipCard title="Como fazer uma boa avaliação?">
            Seja específico, mencione o que funcionou e o que pode melhorar. Avaliações detalhadas
            recebem mais votos úteis e ajudam toda a comunidade.
          </TipCard>

          {/* Categorias populares */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionHeader title="Categorias populares" />
            <div className="flex flex-wrap gap-2">
              {['Energia Solar', 'Inversor', 'Painéis', 'Bateria', 'Instalação', 'Manutenção'].map(
                (cat) => (
                  <span
                    key={cat}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                  >
                    {cat}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
