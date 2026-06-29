'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  CircleCheck,
  Clock3,
  Database,
  Eye,
  Link2,
  Mail,
  MessageSquare,
  Pin,
  QrCode,
  RefreshCw,
  Reply,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Target,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { dashboardApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import ReviewDetailPanel from './ReviewDetailPanel';

interface ReviewsManagementProps {
  companyId: string;
}

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'in_analysis' | 'flagged';
type ReviewFilter = 'all' | 'approved' | 'pending';

interface Review {
  id: string;
  rating: number;
  comment: string;
  headline: string;
  userName: string;
  createdAt: string;
  verified: boolean;
  featured: boolean;
  helpfulCount: number;
  status: ReviewStatus;
  reply?: string;
  repliedAt?: string;
  source?: string;
  sentiment?: string;
  npsScore?: number;
}

interface SocialProofPermissions {
  can_feature_reviews: boolean;
  social_proof_enabled: boolean;
  featured_limit: number;
}

interface SocialProofStats {
  total_reviews: number;
  approved_reviews: number;
  pending_reviews: number;
  rejected_reviews: number;
  in_analysis_reviews: number;
  featured_reviews: number;
  verified_reviews: number;
  average_rating: number;
  response_rate: number;
  unanswered_reviews: number;
  nps_score: number | null;
  nps_responses: number;
  rating_distribution: Record<string, number>;
  monthly_evolution: Record<string, number>;
  monthly_rating: Record<string, number>;
  sentiment_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
  criteria_averages: Array<{
    title: string;
    average: number;
    responses: number;
  }>;
  first_review_at: string | null;
  last_review_at: string | null;
}

const EMPTY_STATS: SocialProofStats = {
  total_reviews: 0,
  approved_reviews: 0,
  pending_reviews: 0,
  rejected_reviews: 0,
  in_analysis_reviews: 0,
  featured_reviews: 0,
  verified_reviews: 0,
  average_rating: 0,
  response_rate: 0,
  unanswered_reviews: 0,
  nps_score: null,
  nps_responses: 0,
  rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  monthly_evolution: {},
  monthly_rating: {},
  sentiment_distribution: { positive: 0, neutral: 0, negative: 0, unknown: 0 },
  source_distribution: {},
  criteria_averages: [],
  first_review_at: null,
  last_review_at: null,
};

const SOURCE_LABELS: Record<string, string> = {
  custom_review_form: 'Formulário',
  qr_code_form: 'QR Code',
  profile: 'Perfil público',
  lead: 'Lead',
  chat: 'Chat',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  unknown: 'Outros',
};

const SOURCE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#64748b'];
const SENTIMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, asNumber(entry)])
  );
}

function formatMonth(value: string): string {
  const date = new Date(`${value}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(date)
    .replace('.', '');
}

function sourceLabel(source?: string): string {
  return SOURCE_LABELS[source || 'unknown'] || source?.replaceAll('_', ' ') || 'Outros';
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const label = {
    approved: 'Publicada',
    pending: 'Pendente',
    rejected: 'Rejeitada',
    in_analysis: 'Em análise',
    flagged: 'Sinalizada',
  }[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-6 rounded-md px-2 text-[10px] font-semibold',
        status === 'approved' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        status === 'pending' && 'border-amber-200 bg-amber-50 text-amber-700',
        status === 'rejected' && 'border-red-200 bg-red-50 text-red-700',
        (status === 'in_analysis' || status === 'flagged') &&
          'border-slate-200 bg-slate-50 text-slate-600'
      )}
    >
      {label}
    </Badge>
  );
}

function Stars({ rating, compact = false }: { rating: number; compact?: boolean }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-slate-200 dark:text-slate-700'
          )}
        />
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Star;
  children?: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-brand-blue dark:border-white/10 dark:bg-white/5">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-950 tabular-nums dark:text-white">
              {value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando avaliações">
      <div className="flex justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Skeleton className="h-80 rounded-xl xl:col-span-8" />
        <Skeleton className="h-80 rounded-xl xl:col-span-4" />
      </div>
    </div>
  );
}

export default function ReviewsManagement({ companyId }: ReviewsManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedReviewId = searchParams.get('review_id');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<SocialProofStats>(EMPTY_STATS);
  const [permissions, setPermissions] = useState<SocialProofPermissions>({
    can_feature_reviews: false,
    social_proof_enabled: false,
    featured_limit: 5,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listUnavailable, setListUnavailable] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [reviewsResponse, statsResponse] = await Promise.all([
        dashboardApi.getSocialProofReviews({ company_id: Number(companyId) }),
        dashboardApi.getSocialProofStats({ company_id: Number(companyId) }),
      ]);

      const response = reviewsResponse as Record<string, unknown>;
      setListUnavailable(response.data_status === 'degraded');
      const rawReviews = Array.isArray(response.reviews) ? response.reviews : [];
      const mappedReviews = rawReviews.map((entry) => {
        const review = entry as Record<string, unknown>;
        return {
          id: String(review.id),
          rating: asNumber(review.rating),
          comment: String(review.comment || ''),
          headline: String(review.headline || ''),
          userName: String(review.user_name || 'Cliente'),
          createdAt: String(review.created_at || ''),
          verified: Boolean(review.verified),
          featured: Boolean(review.featured),
          helpfulCount: asNumber(review.helpful_count),
          status: String(review.status || 'pending') as ReviewStatus,
          reply: review.reply ? String(review.reply) : undefined,
          repliedAt: review.replied_at ? String(review.replied_at) : undefined,
          source: review.capture_flow_source ? String(review.capture_flow_source) : undefined,
          sentiment: review.sentiment ? String(review.sentiment) : undefined,
          npsScore:
            review.nps_score === null || review.nps_score === undefined
              ? undefined
              : asNumber(review.nps_score),
        } satisfies Review;
      });

      const permissionPayload = response.permissions as Partial<SocialProofPermissions> | undefined;
      if (permissionPayload) {
        setPermissions((current) => ({ ...current, ...permissionPayload }));
      }

      const statsEnvelope = statsResponse as Record<string, unknown>;
      if (statsEnvelope.data_status === 'degraded') {
        throw new Error('Review statistics endpoint returned degraded data');
      }
      const statsPayload = (statsEnvelope.stats || {}) as Record<string, unknown>;
      const criteriaPayload = Array.isArray(statsPayload.criteria_averages)
        ? statsPayload.criteria_averages
        : [];
      setStats({
        total_reviews: asNumber(statsPayload.total_reviews),
        approved_reviews: asNumber(statsPayload.approved_reviews),
        pending_reviews: asNumber(statsPayload.pending_reviews),
        rejected_reviews: asNumber(statsPayload.rejected_reviews),
        in_analysis_reviews: asNumber(statsPayload.in_analysis_reviews),
        featured_reviews: asNumber(statsPayload.featured_reviews),
        verified_reviews: asNumber(statsPayload.verified_reviews),
        average_rating: asNumber(statsPayload.average_rating),
        response_rate: asNumber(statsPayload.response_rate),
        unanswered_reviews: asNumber(statsPayload.unanswered_reviews),
        nps_score:
          statsPayload.nps_score === null || statsPayload.nps_score === undefined
            ? null
            : asNumber(statsPayload.nps_score),
        nps_responses: asNumber(statsPayload.nps_responses),
        rating_distribution: normalizeRecord(statsPayload.rating_distribution),
        monthly_evolution: normalizeRecord(statsPayload.monthly_evolution),
        monthly_rating: normalizeRecord(statsPayload.monthly_rating),
        sentiment_distribution: normalizeRecord(statsPayload.sentiment_distribution),
        source_distribution: normalizeRecord(statsPayload.source_distribution),
        criteria_averages: criteriaPayload.map((entry) => {
          const criterion = entry as Record<string, unknown>;
          return {
            title: String(criterion.title || 'Critério'),
            average: asNumber(criterion.average),
            responses: asNumber(criterion.responses),
          };
        }),
        first_review_at: statsPayload.first_review_at ? String(statsPayload.first_review_at) : null,
        last_review_at: statsPayload.last_review_at ? String(statsPayload.last_review_at) : null,
      });
      setReviews(mappedReviews);
    } catch (requestError) {
      console.error('Failed to load review dashboard:', requestError);
      setError('Não foi possível carregar os dados de reputação.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const monthlyData = useMemo(() => {
    const months = new Set([
      ...Object.keys(stats.monthly_evolution),
      ...Object.keys(stats.monthly_rating),
    ]);
    return Array.from(months)
      .sort()
      .map((month) => ({
        month,
        label: formatMonth(month),
        reviews: stats.monthly_evolution[month] || 0,
        rating: stats.monthly_rating[month] || 0,
      }));
  }, [stats.monthly_evolution, stats.monthly_rating]);

  const distribution = useMemo(() => {
    const total = Object.values(stats.rating_distribution).reduce((sum, count) => sum + count, 0);
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = stats.rating_distribution[String(rating)] || 0;
      return { rating, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 };
    });
  }, [stats.rating_distribution]);

  const sentimentData = useMemo(
    () => [
      { key: 'positive', name: 'Positivo', value: stats.sentiment_distribution.positive || 0 },
      { key: 'neutral', name: 'Neutro', value: stats.sentiment_distribution.neutral || 0 },
      { key: 'negative', name: 'Negativo', value: stats.sentiment_distribution.negative || 0 },
    ],
    [stats.sentiment_distribution]
  );
  const analyzedSentiments = sentimentData.reduce((sum, item) => sum + item.value, 0);
  const positiveRate = analyzedSentiments
    ? Math.round(((stats.sentiment_distribution.positive || 0) / analyzedSentiments) * 100)
    : 0;

  const sourceData = useMemo(
    () =>
      Object.entries(stats.source_distribution)
        .map(([source, value]) => ({ source, name: sourceLabel(source), value }))
        .sort((a, b) => b.value - a.value),
    [stats.source_distribution]
  );
  const sourceTotal = sourceData.reduce((sum, item) => sum + item.value, 0);

  const verifiedRate = stats.approved_reviews
    ? Math.round((stats.verified_reviews / stats.approved_reviews) * 100)
    : 0;
  const unknownSentiments = stats.sentiment_distribution.unknown || 0;
  const sentimentCoverage = stats.approved_reviews
    ? Math.round((analyzedSentiments / stats.approved_reviews) * 100)
    : 0;
  const diagnosticSignals = [
    {
      label: 'Rating',
      available: stats.approved_reviews > 0,
      detail:
        stats.approved_reviews > 0 ? `${stats.approved_reviews} publicadas` : 'Sem base publicada',
    },
    {
      label: 'Verificação',
      available: stats.verified_reviews > 0,
      detail: stats.verified_reviews > 0 ? `${verifiedRate}% verificadas` : 'Sem verificação',
    },
    {
      label: 'Sentimento',
      available: analyzedSentiments > 0,
      detail: analyzedSentiments > 0 ? `${sentimentCoverage}% analisadas` : 'Sem análise',
    },
    {
      label: 'NPS',
      available: stats.nps_responses > 0,
      detail: stats.nps_responses > 0 ? `${stats.nps_responses} respostas` : 'Sem respostas',
    },
  ];
  const availableSignals = diagnosticSignals.filter((signal) => signal.available).length;
  const diagnosisActions = [
    stats.approved_reviews < 5
      ? 'Amplie a base para pelo menos 5 avaliações antes de interpretar tendências.'
      : null,
    stats.verified_reviews === 0
      ? 'Priorize convites por QR Code ou formulário rastreável para gerar avaliações verificadas.'
      : null,
    stats.unanswered_reviews > 0
      ? `Responda ${stats.unanswered_reviews} ${
          stats.unanswered_reviews === 1 ? 'avaliação publicada' : 'avaliações publicadas'
        } para fechar o ciclo com o cliente.`
      : null,
    unknownSentiments > 0
      ? `${unknownSentiments} ${
          unknownSentiments === 1
            ? 'comentário ainda não foi analisado'
            : 'comentários ainda não foram analisados'
        } por sentimento.`
      : null,
    stats.nps_responses === 0
      ? 'Inclua a pergunta de recomendação nos próximos formulários para habilitar o NPS.'
      : null,
  ].filter((action): action is string => Boolean(action));

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return reviews.filter((review) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'approved' && review.status === 'approved') ||
        (filter === 'pending' && ['pending', 'in_analysis', 'flagged'].includes(review.status));
      const matchesQuery =
        !query ||
        review.userName.toLocaleLowerCase('pt-BR').includes(query) ||
        review.comment.toLocaleLowerCase('pt-BR').includes(query) ||
        review.headline.toLocaleLowerCase('pt-BR').includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [filter, reviews, search]);

  const handleToggleFeatured = async (reviewId: string) => {
    if (!permissions.can_feature_reviews) {
      toast({
        title: 'Destaque indisponível',
        description: 'Seu plano atual não inclui avaliações em destaque.',
      });
      return;
    }

    const review = reviews.find((item) => item.id === reviewId);
    if (!review) return;
    const enabling = !review.featured;
    if (enabling && stats.featured_reviews >= permissions.featured_limit) {
      toast({
        title: 'Limite de destaques atingido',
        description: `Remova um destaque antes de adicionar outro. O limite é ${permissions.featured_limit}.`,
      });
      return;
    }

    try {
      setUpdatingId(reviewId);
      await dashboardApi.updateSocialProofReview(reviewId, { featured: enabling }, companyId);
      await fetchReviews();
      toast({
        title: enabling ? 'Avaliação destacada' : 'Destaque removido',
        description: 'A vitrine pública foi atualizada.',
      });
    } catch (requestError) {
      console.error('Failed to update featured review:', requestError);
      toast({ title: 'Não foi possível atualizar o destaque', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const openReview = (reviewId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'reviews');
    params.set('review_id', reviewId);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const closeReview = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('review_id');
    params.set('tab', 'reviews');
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  if (selectedReviewId) {
    return (
      <ReviewDetailPanel
        companyId={companyId}
        reviewId={selectedReviewId}
        onBack={closeReview}
        onChanged={() => void fetchReviews()}
      />
    );
  }

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 shadow-none">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-red-900">{error}</p>
            <p className="mt-1 text-sm text-red-700">Verifique sua conexão e tente novamente.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => void fetchReviews()}
            className="border-red-200 bg-white text-red-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-brand-blue">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              Central de reputação
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            O que seus clientes estão dizendo
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe qualidade, volume e origem das avaliações em um único lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-slate-950">
            <Database className="h-3.5 w-3.5" />
            Todo o histórico
            {stats.last_review_at ? ` · até ${formatDate(stats.last_review_at)}` : ''}
          </span>
          <Button
            asChild
            className="h-10 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-blue/90"
          >
            <Link href="/dashboard?tab=review-forms">
              <QrCode className="mr-2 h-4 w-4" /> Coletar avaliações
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Rating consolidado"
          value={stats.average_rating ? stats.average_rating.toFixed(1) : '—'}
          detail={
            stats.approved_reviews
              ? `${stats.approved_reviews} avaliações publicadas`
              : 'Sem avaliações publicadas'
          }
          icon={Star}
        >
          <Stars rating={stats.average_rating} compact />
        </MetricCard>
        <MetricCard
          label="Total de avaliações"
          value={stats.total_reviews.toLocaleString('pt-BR')}
          detail={
            stats.pending_reviews || stats.in_analysis_reviews
              ? `${stats.approved_reviews} publicadas · ${
                  stats.pending_reviews + stats.in_analysis_reviews
                } em moderação`
              : `${stats.approved_reviews} publicadas`
          }
          icon={MessageSquare}
        />
        <MetricCard
          label="Reviews verificadas"
          value={`${verifiedRate}%`}
          detail={`${stats.verified_reviews} com verificação`}
          icon={CheckCircle2}
        >
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full bg-emerald-500" style={{ width: `${verifiedRate}%` }} />
          </div>
        </MetricCard>
        <MetricCard
          label="Taxa de resposta"
          value={`${stats.response_rate}%`}
          detail={
            stats.unanswered_reviews
              ? `${stats.unanswered_reviews} sem resposta`
              : 'Todas as publicadas respondidas'
          }
          icon={Reply}
        />
        <MetricCard
          label="NPS"
          value={stats.nps_score === null ? '—' : String(stats.nps_score)}
          detail={
            stats.nps_score === null
              ? 'Aguardando respostas NPS'
              : `${stats.nps_responses} respostas de recomendação`
          }
          icon={Award}
        />
      </div>

      <Card className="overflow-hidden border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
        <CardContent className="grid gap-6 p-5 lg:grid-cols-[1.1fr_1fr]">
          <section>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-brand-blue" />
                  <h4 className="text-sm font-semibold text-slate-950 dark:text-white">
                    Cobertura do diagnóstico
                  </h4>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Mostra quais sinais possuem dados suficientes para análise. Não é uma nota de
                  reputação.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <strong className="text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
                  {availableSignals}/4
                </strong>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">sinais ativos</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {diagnosticSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  {signal.available ? (
                    <CircleCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Clock3 className="h-4 w-4 shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {signal.label}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{signal.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="border-t border-slate-100 pt-5 dark:border-white/10 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-slate-950 dark:text-white">
                Próximas ações recomendadas
              </h4>
            </div>
            <div className="mt-3 space-y-2">
              {diagnosisActions.length ? (
                diagnosisActions.slice(0, 3).map((action, index) => (
                  <div
                    key={action}
                    className="flex gap-3 text-xs leading-5 text-slate-600 dark:text-slate-300"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-50 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      {index + 1}
                    </span>
                    <p>{action}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <CircleCheck className="h-4 w-4 shrink-0" />
                  Todos os sinais essenciais possuem cobertura.
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950 xl:col-span-8">
          <CardHeader className="flex-row items-start justify-between space-y-0 p-5 pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
                Evolução das avaliações
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">Volume recebido e nota média por mês</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-sm bg-brand-blue" /> Volume
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-emerald-500" /> Nota
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3">
            {monthlyData.length ? (
              <div className="h-64 w-full" aria-label="Gráfico de evolução das avaliações">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={monthlyData}
                    margin={{ top: 12, right: 4, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="reviews"
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="rating"
                      orientation="right"
                      domain={[0, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        boxShadow: 'none',
                      }}
                      labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                    />
                    <Bar
                      yAxisId="reviews"
                      dataKey="reviews"
                      name="Avaliações"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Line
                      yAxisId="rating"
                      dataKey="rating"
                      name="Nota média"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center dark:border-white/10 dark:bg-white/[0.02]">
                <MessageSquare className="mb-3 h-6 w-6 text-slate-300" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  A evolução aparecerá após a primeira avaliação publicada.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950 xl:col-span-4">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
              Distribuição das notas
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">Participação por quantidade de estrelas</p>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-4">
            {distribution.map((item) => (
              <div key={item.rating} className="grid grid-cols-[36px_1fr_74px] items-center gap-3">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {item.rating} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand-blue"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-right text-xs tabular-nums text-slate-500">
                  {item.percentage}% <span className="text-slate-400">({item.count})</span>
                </span>
              </div>
            ))}
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm dark:border-white/10">
              <span className="text-slate-500">Nota média</span>
              <span className="font-semibold tabular-nums text-slate-950 dark:text-white">
                {stats.average_rating ? stats.average_rating.toFixed(1) : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950 xl:col-span-8">
          <CardHeader className="gap-4 p-5 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
                Avaliações recebidas
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Feedbacks mais recentes e status de publicação
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar feedback"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 dark:border-white/10 dark:bg-white/5 dark:text-white sm:w-44"
                />
              </label>
              <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-white/10">
                {(
                  [
                    ['all', 'Todas'],
                    ['approved', 'Publicadas'],
                    ['pending', 'Pendentes'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={cn(
                      'h-8 rounded-md px-2.5 text-[11px] font-medium transition-colors',
                      filter === value
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {listUnavailable || (stats.total_reviews > 0 && reviews.length === 0) ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
                <AlertTriangle className="mb-3 h-7 w-7 text-amber-500" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  A contagem existe, mas a listagem não pôde ser carregada.
                </p>
                <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                  Os indicadores acima foram preservados. A tela não tratará uma falha de leitura
                  como ausência de avaliações.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchReviews()}
                  className="mt-4 rounded-lg border-slate-200 bg-white shadow-none"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" /> Recarregar listagem
                </Button>
              </div>
            ) : filteredReviews.length ? (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {filteredReviews.map((review) => (
                  <article
                    key={review.id}
                    className="p-5 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold text-slate-950 dark:text-white">
                                {review.userName}
                              </h4>
                              {review.verified && (
                                <span title="Avaliação verificada">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                </span>
                              )}
                              <StatusBadge status={review.status} />
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <Stars rating={review.rating} compact />
                              <span className="text-[11px] text-slate-400">
                                {formatDate(review.createdAt)}
                              </span>
                              <span className="text-[11px] text-slate-400">•</span>
                              <span className="text-[11px] text-slate-500">
                                {sourceLabel(review.source)}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openReview(review.id)}
                              className="h-8 rounded-lg border-slate-200 px-2.5 text-[11px] shadow-none dark:border-white/10"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              {review.reply ? 'Gerenciar' : 'Responder'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void handleToggleFeatured(review.id)}
                              disabled={updatingId === review.id}
                              className={cn(
                                'h-8 rounded-lg border-slate-200 px-2.5 text-[11px] shadow-none dark:border-white/10',
                                review.featured && 'border-amber-200 bg-amber-50 text-amber-700'
                              )}
                            >
                              <Pin
                                className={cn(
                                  'mr-1.5 h-3.5 w-3.5',
                                  review.featured && 'fill-current'
                                )}
                              />
                              {review.featured ? 'Em destaque' : 'Destacar'}
                            </Button>
                          </div>
                        </div>
                        {review.headline && (
                          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {review.headline}
                          </p>
                        )}
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {review.comment || 'Avaliação enviada sem comentário.'}
                        </p>
                        {review.reply && (
                          <div className="mt-3 rounded-lg border-l-2 border-brand-blue bg-slate-50 px-3 py-2.5 dark:bg-white/5">
                            <p className="text-[11px] font-semibold text-brand-blue">
                              Resposta da empresa
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                              {review.reply}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
                <MessageSquare className="mb-3 h-7 w-7 text-slate-300" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {reviews.length
                    ? 'Nenhuma avaliação corresponde aos filtros.'
                    : 'Nenhuma avaliação recebida ainda.'}
                </p>
                {!reviews.length && (
                  <Link
                    href="/dashboard?tab=review-forms"
                    className="mt-2 text-sm font-medium text-brand-blue hover:underline"
                  >
                    Criar um canal de coleta
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-4">
          <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
            <CardHeader className="p-5 pb-1">
              <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
                Análise de sentimento
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">Tom predominante nos comentários</p>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              {analyzedSentiments ? (
                <div>
                  <div className="grid grid-cols-[150px_1fr] items-center gap-3">
                    <div className="relative h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            dataKey="value"
                            innerRadius={46}
                            outerRadius={63}
                            strokeWidth={0}
                          >
                            {sentimentData.map((item, index) => (
                              <Cell key={item.key} fill={SENTIMENT_COLORS[index]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
                          {positiveRate}%
                        </span>
                        <span className="text-[10px] text-slate-500">positivo</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {sentimentData.map((item, index) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <i
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: SENTIMENT_COLORS[index] }}
                            />
                            {item.name}
                          </span>
                          <strong className="font-semibold tabular-nums text-slate-900 dark:text-white">
                            {item.value}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  {unknownSentiments > 0 && (
                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-amber-700 dark:border-white/10 dark:text-amber-300">
                      <Clock3 className="h-3.5 w-3.5" />
                      {unknownSentiments}{' '}
                      {unknownSentiments === 1
                        ? 'comentário aguarda análise'
                        : 'comentários aguardam análise'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-slate-500">
                  <Clock3 className="mb-2 h-5 w-5 text-slate-300" />
                  {unknownSentiments > 0
                    ? `${unknownSentiments} ${
                        unknownSentiments === 1 ? 'comentário aguarda' : 'comentários aguardam'
                      } análise de sentimento.`
                    : 'O sentimento será exibido após a análise dos comentários.'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
                Fontes das avaliações
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">Canais que mais geram feedback</p>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-1">
              {sourceData.length ? (
                sourceData.slice(0, 5).map((item, index) => {
                  const percentage = sourceTotal ? Math.round((item.value / sourceTotal) * 100) : 0;
                  const SourceIcon = item.source.includes('qr')
                    ? QrCode
                    : item.source.includes('email')
                      ? Mail
                      : item.source.includes('chat') || item.source.includes('whatsapp')
                        ? Smartphone
                        : Link2;
                  return (
                    <div
                      key={item.source}
                      className="grid grid-cols-[20px_88px_1fr_42px] items-center gap-2 text-xs"
                    >
                      <SourceIcon className="h-4 w-4 text-slate-400" />
                      <span className="truncate text-slate-600 dark:text-slate-300">
                        {item.name}
                      </span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length],
                          }}
                        />
                      </div>
                      <span className="text-right tabular-nums text-slate-500">{percentage}%</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-24 items-center justify-center text-center text-xs text-slate-500">
                  As fontes aparecerão quando houver avaliações publicadas.
                </div>
              )}
            </CardContent>
          </Card>

          {stats.criteria_averages.length > 0 && (
            <Card className="border-slate-200/80 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-semibold text-slate-950 dark:text-white">
                  Critérios avaliados
                </CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  Médias calculadas somente com respostas válidas
                </p>
              </CardHeader>
              <CardContent className="space-y-3 p-5 pt-1">
                {stats.criteria_averages.map((criterion) => (
                  <div key={criterion.title}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-slate-600 dark:text-slate-300">
                        {criterion.title}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-white">
                        {criterion.average.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-brand-blue"
                          style={{ width: `${(criterion.average / 5) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-[10px] tabular-nums text-slate-400">
                        {criterion.responses} resp.
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
