'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
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
  featured_reviews: number;
  verified_reviews: number;
  average_rating: number;
  response_rate: number;
  nps_score: number | null;
  rating_distribution: Record<string, number>;
  monthly_evolution: Record<string, number>;
  monthly_rating: Record<string, number>;
  sentiment_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
}

const EMPTY_STATS: SocialProofStats = {
  total_reviews: 0,
  approved_reviews: 0,
  featured_reviews: 0,
  verified_reviews: 0,
  average_rating: 0,
  response_rate: 0,
  nps_score: null,
  rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  monthly_evolution: {},
  monthly_rating: {},
  sentiment_distribution: { positive: 0, neutral: 0, negative: 0, unknown: 0 },
  source_distribution: {},
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<SocialProofStats>(EMPTY_STATS);
  const [permissions, setPermissions] = useState<SocialProofPermissions>({
    can_feature_reviews: false,
    social_proof_enabled: false,
    featured_limit: 5,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      const statsPayload = ((statsResponse as Record<string, unknown>).stats || {}) as Record<
        string,
        unknown
      >;
      setStats({
        total_reviews: asNumber(statsPayload.total_reviews),
        approved_reviews: asNumber(statsPayload.approved_reviews),
        featured_reviews: asNumber(statsPayload.featured_reviews),
        verified_reviews: asNumber(statsPayload.verified_reviews),
        average_rating: asNumber(statsPayload.average_rating),
        response_rate: asNumber(statsPayload.response_rate),
        nps_score:
          statsPayload.nps_score === null || statsPayload.nps_score === undefined
            ? null
            : asNumber(statsPayload.nps_score),
        rating_distribution: normalizeRecord(statsPayload.rating_distribution),
        monthly_evolution: normalizeRecord(statsPayload.monthly_evolution),
        monthly_rating: normalizeRecord(statsPayload.monthly_rating),
        sentiment_distribution: normalizeRecord(statsPayload.sentiment_distribution),
        source_distribution: normalizeRecord(statsPayload.source_distribution),
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

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return reviews.filter((review) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'approved' && review.status === 'approved') ||
        (filter === 'pending' && review.status !== 'approved');
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
        <Button
          asChild
          className="h-10 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-blue/90"
        >
          <Link href="/dashboard?tab=review-forms">
            <QrCode className="mr-2 h-4 w-4" /> Coletar avaliações
          </Link>
        </Button>
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
          detail={`${stats.approved_reviews} publicadas`}
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
          detail="Avaliações respondidas"
          icon={Reply}
        />
        <MetricCard
          label="NPS"
          value={stats.nps_score === null ? '—' : String(stats.nps_score)}
          detail={stats.nps_score === null ? 'Aguardando respostas NPS' : 'Índice de recomendação'}
          icon={Award}
        />
      </div>

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
            {filteredReviews.length ? (
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
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void handleToggleFeatured(review.id)}
                            disabled={updatingId === review.id}
                            className={cn(
                              'h-8 shrink-0 rounded-lg border-slate-200 px-2.5 text-[11px] shadow-none dark:border-white/10',
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
              ) : (
                <div className="flex h-36 items-center justify-center text-center text-xs text-slate-500">
                  O sentimento será exibido após a análise dos comentários.
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
        </div>
      </div>
    </div>
  );
}
