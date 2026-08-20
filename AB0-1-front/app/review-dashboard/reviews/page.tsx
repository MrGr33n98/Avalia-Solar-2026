'use client';

import { useState } from 'react';
import { ReviewerPageHeader } from '@/components/review-dashboard/layout/ReviewerPageHeader';
import { EmptyStateCard } from '@/components/review-dashboard/cards/EmptyStateCard';
import { StatusBadge } from '@/components/review-dashboard/StatusBadge';
import { SectionHeader } from '@/components/review-dashboard/SectionHeader';
import { TipCard } from '@/components/review-dashboard/cards/TipCard';
import { useDashboardContext } from '../DashboardLayoutClient';
import { cn } from '@/lib/utils';
import {
  Star,
  ThumbsUp,
  ArrowRight,
  Plus,
  AlertCircle,
  Loader2,
  Eye,
  Search,
  SlidersHorizontal,
  ChevronDown,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';

// Local Mini KPI Card
interface MiniKpiCardProps {
  label: string;
  value: string | number;
  caption: string;
  icon: React.ReactNode;
  highlight?: boolean;
  infoTooltip?: string;
}

function MiniKpiCard({
  label,
  value,
  caption,
  icon,
  highlight = false,
  infoTooltip,
}: MiniKpiCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all h-[78px] hover:border-slate-200',
        highlight && 'border-blue-100 bg-blue-50/10'
      )}
    >
      {/* Icon Container: 36x36px */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
            {label}
          </span>
          {infoTooltip && (
            <div className="group relative">
              <span className="cursor-help text-slate-400 hover:text-slate-600 text-[10px]">ⓘ</span>
              <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden w-48 -translate-x-1/2 rounded bg-slate-950 p-2 text-[10px] font-normal text-white shadow-md group-hover:block whitespace-normal leading-normal">
                {infoTooltip}
              </div>
            </div>
          )}
        </div>
        <div
          className={cn(
            'font-semibold text-slate-900 leading-none',
            value === 'Indisponível' ? 'text-sm text-slate-400' : 'text-lg sm:text-xl font-bold'
          )}
        >
          {value}
        </div>
        <span className="text-[10px] text-slate-400 truncate leading-none">{caption}</span>
      </div>
    </div>
  );
}

export default function AvaliacoesPage() {
  const { reviews, reviewsLoading, reviewsError, summary, onRefresh } = useDashboardContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null);

  const totalReviews = reviews.length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const inAnalysis = reviews.filter(
    (r) => r.status === 'in_analysis' || r.status === 'pending'
  ).length;
  const helpfulVotes = summary?.impact?.helpful_votes ?? null;

  // Filter & Sort logic in-memory
  const filteredReviews = reviews
    .filter((r) => {
      if (statusFilter === 'all') return true;
      return r.status === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'rating_desc') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'rating_asc') {
        return (a.rating || 0) - (b.rating || 0);
      }
      return 0;
    });

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
        title={
          <div className="flex items-center gap-2">
            <span className="text-[22px] sm:text-2xl font-bold tracking-tight text-slate-900">
              Minhas avaliações
            </span>
            <span className="inline-flex h-5 items-center justify-center rounded-full bg-blue-50 px-2 text-xs font-semibold text-blue-600">
              {totalReviews}
            </span>
          </div>
        }
        description="Acompanhe e gerencie todas as avaliações que você realizou."
        breadcrumbs={[
          { label: 'Dashboard', href: '/review-dashboard' },
          { label: 'Minhas avaliações' },
        ]}
        action={
          <a
            href="/companies"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nova avaliação
          </a>
        }
      />

      {/* Mini KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MiniKpiCard
          label="Total"
          value={totalReviews}
          caption="Avaliações realizadas"
          icon={<FileText className="h-5 w-5 text-blue-600" />}
        />
        <MiniKpiCard
          label="Publicadas"
          value={approvedCount}
          caption="Aprovadas e visíveis"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />
        <MiniKpiCard
          label="Em análise"
          value={inAnalysis}
          caption="Aguardando revisão"
          icon={<Clock className="h-5 w-5 text-orange-500" />}
        />
        <MiniKpiCard
          label="Votos úteis"
          value={helpfulVotes === null ? 'Indisponível' : helpfulVotes}
          caption="Feedback positivo"
          icon={<ThumbsUp className="h-5 w-5 text-blue-600" />}
          infoTooltip="Quantidade total de votos marcados como úteis por outros usuários em suas avaliações."
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main Content Area */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por empresa ou título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
              >
                <option value="all">Status: Todos</option>
                <option value="approved">Aprovadas</option>
                <option value="pending">Pendentes</option>
                <option value="in_analysis">Em análise</option>
                <option value="rejected">Rejeitadas</option>
                <option value="archived">Arquivadas</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Order */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
              >
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigas</option>
                <option value="rating_desc">Maior nota</option>
                <option value="rating_asc">Menor nota</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
            </button>
          </div>

          {/* List of Reviews */}
          {reviewsLoading ? (
            <div
              className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50"
              role="status"
            >
              <Loader2
                className="h-7 w-7 animate-spin text-blue-600"
                aria-label="Carregando avaliações"
              />
            </div>
          ) : reviewsError ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 px-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                Não foi possível carregar suas avaliações.
              </h3>
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
              title="Nenhuma avaliação encontrada"
              description="Nenhuma avaliação coincide com seus termos de busca ou filtros aplicados."
              ctaLabel="Voltar para todas"
              ctaHref="#"
              onCtaClick={() => {
                setSearch('');
                setStatusFilter('all');
                setSortBy('recent');
              }}
            />
          ) : (
            <div className="space-y-3">
              {searchedReviews.map((review) => {
                const companyName =
                  typeof review.company === 'string'
                    ? review.company
                    : review.company?.name || 'Empresa';
                const companyLogo =
                  typeof review.company === 'string' ? null : review.company?.logo_url;
                const companyInitials = companyName.substring(0, 2).toUpperCase();

                const views = review.views ?? '—';
                const helpfulCount = review.helpful_count ?? '—';

                return (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 hover:border-blue-200 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.04)] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Logo Container */}
                      <div className="w-[72px] h-[72px] sm:w-[82px] sm:h-[82px] shrink-0 border border-slate-100 rounded-xl flex items-center justify-center bg-white overflow-hidden p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                        {companyLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={companyLogo}
                            alt={companyName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                            {companyInitials}
                          </div>
                        )}
                      </div>

                      {/* Info Panel */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                            {review.headline || 'Avaliação'}
                          </h3>
                          <StatusBadge status={review.status || 'pending'} />
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <span>{companyName}</span>
                          <span className="text-slate-300">•</span>
                          <span>{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>

                        {/* Metrics Row */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                          {/* Stars */}
                          <div className="flex items-center gap-1">
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
                              <span className="ml-1 font-semibold text-slate-700">
                                {review.rating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          <span className="text-slate-300">|</span>

                          <div className="flex items-center gap-1 text-[11px] sm:text-xs">
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            <span>{views} visualizações</span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] sm:text-xs">
                            <ThumbsUp className="h-3.5 w-3.5 text-slate-400" />
                            <span>{helpfulCount} votos úteis</span>
                          </div>
                        </div>
                      </div>

                      {/* Expand Action Button */}
                      <div className="self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedReviewId(expandedReviewId === review.id ? null : review.id)
                          }
                          className="h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          {expandedReviewId === review.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                        </button>
                      </div>
                    </div>

                    {/* Extended Review text */}
                    {expandedReviewId === review.id && (
                      <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-650 leading-relaxed">
                        <p className="whitespace-pre-line">
                          {review.comment || 'Sem comentário registrado.'}
                        </p>
                        {review.reply && (
                          <div className="mt-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                            <strong className="text-xs font-semibold text-slate-900 block mb-1">
                              Resposta da empresa:
                            </strong>
                            <p className="text-xs sm:text-sm text-slate-650">{review.reply}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="space-y-4">
          {/* Companies to Review Card */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <SectionHeader title="Empresas para avaliar" />
            <p className="text-xs text-slate-500 mt-2 mb-3 leading-relaxed">
              Conheça novas empresas e compartilhe sua experiência com a rede.
            </p>
            <a
              href="/companies"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>Explorar empresas</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          {/* Tip Card */}
          <TipCard
            title="Dica para uma avaliação completa"
            className="bg-amber-50/20 border-amber-100/60 p-4"
          >
            Avaliações com fotos e relatos detalhados ajudam mais avaliadores e ganham muito mais
            votos úteis da comunidade.
          </TipCard>

          {/* Popular Categories Card */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <SectionHeader title="Categorias populares" />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[
                'Energia Solar',
                'Inversores',
                'Painéis',
                'Baterias',
                'Estruturas',
                'Cabos e Conectores',
              ].map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
