'use client';

import { ReactNode, useMemo, useState } from 'react';
import { AchievementsStrip } from '@/components/achievements/AchievementsStrip';
import { deriveAchievementStatuses } from '@/config/achievements';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BatteryCharging,
  Bell,
  Building2,
  Car,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Edit3,
  Eye,
  Filter,
  Flame,
  Leaf,
  Lock,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Recycle,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  ThumbsUp,
  Trash2,
  Trophy,
  Users,
  Laptop,
  Gift,
  UserRound,
  ClipboardList,
  FileText,
  Heart,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Lead, Review, User } from '@/lib/api';
import { cn } from '@/lib/utils';

import { type ReviewDashboardSummary } from '../DashboardLayoutClient';
import { UserSolutionChip, type UserSolution } from '@/components/profile/UserSolutionChip';
import { AddUserSolutionModal } from '@/components/profile/AddUserSolutionModal';
import { PublicUserBadges } from '@/components/badges/PublicUserBadges';
import { useDashboardContext } from '../DashboardLayoutClient';

interface ReputationDashboardProps {
  user: User;
  summary: ReviewDashboardSummary | null;
  reviews: Review[];
  leads: Lead[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  activityChart: ReactNode;
  onRefresh: () => void;
  onDeleteReview: (id: string) => void;
  onEditReview: (id: string) => void;
}

interface CompanyRow {
  id: string;
  reviewId: string;
  name: string;
  initials: string;
  logoUrl?: string | null;
  slug?: string;
  category: string;
  rating: number;
  status: 'Respondeu' | 'Não respondeu' | 'Em análise' | 'Respondida recentemente';
  views: number;
  requests: number;
  conversions: number;
  date: string;
  reply?: string;
}

type ReviewDashboardTab =
  | 'overview'
  | 'companies'
  | 'reviews'
  | 'proposals'
  | 'reputation'
  | 'profile';

type ReviewKpi = {
  label: string;
  value: string;
  suffix: string;
  helper: string;
  icon: LucideIcon;
  iconClass: string;
};

function initialsFromName(name?: unknown) {
  const str = typeof name === 'string' ? name.trim() : String(name || '').trim();
  const safeName = str || 'Usuário';
  const parts = safeName.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return 'Hoje';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Hoje';
  return date.toLocaleDateString('pt-BR');
}

function formatMonthYear(value?: string) {
  if (!value) return 'Jun/2024';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Jun/2024';
  const month = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
  return `${month.charAt(0).toUpperCase()}${month.slice(1)}/${date.getFullYear()}`;
}

function isRecent(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= 1000 * 60 * 60 * 24 * 7;
}

function getCompanyInfo(review: Review) {
  if (typeof review.company === 'string') {
    return {
      name: review.company || 'Empresa',
      logoUrl: null,
      slug: undefined,
    };
  }

  const companyObj = review.company && typeof review.company === 'object' ? review.company : null;
  const companyName = typeof companyObj?.name === 'string' ? companyObj.name : 'Empresa';

  return {
    name: companyName,
    logoUrl: companyObj?.logo_url || null,
    slug: companyObj?.slug,
  };
}

function getLeadCompanyName(lead: Lead) {
  if (typeof lead.company === 'string' && lead.company.trim()) return lead.company;
  if (lead.company && typeof lead.company === 'object' && typeof lead.company.name === 'string' && lead.company.name.trim())
    return lead.company.name;
  if (lead.company_obj?.name && typeof lead.company_obj.name === 'string') return lead.company_obj.name;
  return 'Empresa recomendada';
}

function getLeadCompanyLogo(lead: Lead) {
  if (lead.company && typeof lead.company === 'object' && lead.company.logo_url) {
    return lead.company.logo_url;
  }

  return lead.company_obj?.logo_url || lead.company_logo_url || null;
}

function leadStatusMeta(status?: string) {
  const statusMap: Record<string, { label: string; className: string; progress: number }> = {
    draft: {
      label: 'Rascunho',
      className: 'bg-slate-100 text-slate-700 border-slate-200',
      progress: 12,
    },
    pending_otp: {
      label: 'Aguardando validação',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      progress: 24,
    },
    verified: {
      label: 'Validada',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      progress: 42,
    },
    distributed: {
      label: 'Enviada às empresas',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      progress: 58,
    },
    proposal_submitted: {
      label: 'Proposta solicitada',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      progress: 68,
    },
    proposal_processing: {
      label: 'Em análise',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      progress: 78,
    },
    proposal_sent: {
      label: 'Respondida',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      progress: 100,
    },
    proposal_failed: {
      label: 'Revisar dados',
      className: 'bg-red-50 text-red-700 border-red-200',
      progress: 36,
    },
    canceled: {
      label: 'Cancelada',
      className: 'bg-red-50 text-red-700 border-red-200',
      progress: 0,
    },
  };

  return (
    statusMap[status || ''] || {
      label: status || 'Em acompanhamento',
      className: 'bg-slate-100 text-slate-700 border-slate-200',
      progress: 35,
    }
  );
}

function projectTypeLabel(value?: Review['project_type']) {
  const labels: Record<string, string> = {
    residential: 'Instalação Residencial',
    commercial: 'Instalação Comercial',
    industrial: 'Projeto Industrial',
    rural: 'Projeto Rural',
  };
  return value ? labels[value] || 'Energia Solar' : 'Energia Solar';
}

function buildCompanyRows(reviews: Review[], leads: Lead[]): CompanyRow[] {
  return reviews.map((review) => {
    const company = getCompanyInfo(review);
    const relatedLeads = leads.filter((lead) => getLeadCompanyName(lead) === company.name);
    const requests = relatedLeads.length;
    const views = Number(
      (review as Review & { read_count?: number }).read_count || review.metadata?.read_count || 0
    );
    const status: CompanyRow['status'] =
      review.reply || review.replied_at
        ? isRecent(review.replied_at)
          ? 'Respondida recentemente'
          : 'Respondeu'
        : review.status === 'pending' || review.status === 'in_analysis'
          ? 'Em análise'
          : 'Não respondeu';

    return {
      id: `${review.company_id || company.name}-${review.id}`,
      reviewId: String(review.id),
      name: company.name,
      initials: initialsFromName(company.name),
      logoUrl: company.logoUrl,
      slug: company.slug,
      category: review.category_name || projectTypeLabel(review.project_type),
      rating: Number(review.rating || 0),
      status,
      views,
      requests,
      conversions: relatedLeads.filter((l) =>
        ['verified', 'proposal_sent', 'proposal_processing'].includes(l.status || '')
      ).length,
      date: review.created_at,
      reply: review.reply,
    };
  });
}

function statusClassName(status: CompanyRow['status']) {
  if (status === 'Respondida recentemente')
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'Respondeu') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'Em análise') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-100';
}

function ratingStars(rating: number) {
  return Array.from({ length: 5 }).map((_, index) => (
    <Star
      key={index}
      className={cn(
        'h-3.5 w-3.5',
        index < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
      )}
    />
  ));
}

export function ReputationDashboard({
  user,
  summary,
  reviews,
  leads,
  loading,
  refreshing: _refreshing,
  error,
  activityChart,
  onRefresh: _onRefresh,
  onDeleteReview,
  onEditReview,
}: ReputationDashboardProps) {
  const [replyDialogRow, setReplyDialogRow] = useState<CompanyRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [activeTab, setActiveTab] = useState<ReviewDashboardTab>('overview');
  const profileUser = user as User & { city?: string; state?: string; avatar_url?: string };
  const { solutions, addSolution, removeSolution, unlockedBadgeIds } = useDashboardContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const rows = useMemo(() => buildCompanyRows(reviews, leads), [reviews, leads]);
  const monthlyReviews = reviews.filter((review) => isRecent(review.created_at)).length;
  const commentsCount = reviews.filter(
    (review) => review.comment || review.headline || review.buyer_tip
  ).length;

  // Real values from the API summary
  const helpfulVotes = summary?.impact?.helpful_votes ?? null;
  const impactedPeople = summary?.impact?.impacted_people ?? null;
  const greenScore = summary?.gamification?.green_score ?? null;
  const rankingPosition = summary?.gamification?.regional_ranking ?? null;
  const recommendationsList = summary?.recommendations || [];
  const recentActivitiesList = summary?.recent_activities || [];

  const companyReplies = rows.filter((row) => row.reply || row.status.includes('Respond'));
  const profileViews = summary?.charts?.activity_30d?.reduce((total, point) => total + point.profile_views, 0) ?? null;
  const responseRate = reviews.length > 0 ? Math.round((companyReplies.length / reviews.length) * 100) : null;

  const hasSolarSolution = solutions.some((s) => s.category.toLowerCase().includes('solar'));
  const hasEVSolution = solutions.some((s) => s.category.toLowerCase().includes('mobilidade') || s.category.toLowerCase().includes('bateria'));
  const solarSolutionsCount = solutions.filter((s) => s.category.toLowerCase().includes('solar')).length;

  const hasSolarReview = reviews.some((r) =>
    (r.category_name || '').toLowerCase().includes('solar')
  );
  const hasMobilityReview = reviews.some(
    (r) =>
      (r.category_name || '').toLowerCase().includes('mobilidade') ||
      (r.category_name || '').toLowerCase().includes('elétric')
  );

  const baseCompletion = profileUser ? ((profileUser.name ? 50 : 0) + (profileUser.email ? 15 : 0) + (profileUser.phone ? 10 : 0)) : 75;
  const locationCompletion = profileUser?.city && profileUser?.state ? 5 : 0;
  const avatarCompletion = profileUser?.avatar_url ? 10 : 0;
  const solutionsCompletion = solutions.length > 0 ? Math.min(solutions.length * 5, 10) : 0;
  const profileCompletion = Math.min(baseCompletion + locationCompletion + avatarCompletion + solutionsCompletion, 100);

  const isLinkedInVerified = summary?.gamification?.achievements?.some((a) => a.title === 'Cliente Verificado' && a.state !== 'bloqueado') ?? false;

  const achievementStatuses = deriveAchievementStatuses({
    reviewsCount: Math.max(reviews.length, solarSolutionsCount >= 3 ? 3 : 0),
    profileCompletionPercent: profileCompletion,
    helpfulVotes,
    greenScore,
    hasSolarReview: hasSolarReview || hasSolarSolution,
    hasMobilityReview: hasMobilityReview || hasEVSolution,
    hasEVSolution,
    isLinkedInVerified,
  });

  const userLocation = [profileUser.city, profileUser.state].filter(Boolean).join(', ') || 'Brasil';

  const kpis = [
    {
      label: 'Green Score',
      value: `${greenScore}`,
      suffix: 'score',
      helper: greenScore >= 760 ? 'Eco Expert' : greenScore >= 650 ? 'Green Pro' : 'Em evolução',
      icon: Leaf,
      iconClass: 'bg-green-100 text-green-700',
    },
    {
      label: 'Avaliações',
      value: `${reviews.length}`,
      suffix: 'total',
      helper: monthlyReviews > 0 ? `+${monthlyReviews} recentes` : 'registradas',
      icon: Star,
      iconClass: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Votos úteis',
      value: helpfulVotes === null ? '—' : `${helpfulVotes}`,
      suffix: 'votos',
      helper: 'recebidos',
      icon: ThumbsUp,
      iconClass: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Impactados',
      value: impactedPeople.toLocaleString('pt-BR'),
      suffix: 'pessoas',
      helper: 'pessoas',
      icon: Users,
      iconClass: 'bg-rose-100 text-rose-700',
    },
    {
      label: 'Comentários',
      value: `${commentsCount}`,
      suffix: 'feitos',
      helper: rankingPosition === null ? 'ranking indisponível' : `ranking ${rankingPosition}º`,
      icon: MessageCircle,
      iconClass: 'bg-blue-100 text-blue-700',
    },
  ];

  const categories = Array.from(
    new Set(
      rows
        .map((row) => (typeof row.category === 'string' ? row.category.trim() : ''))
        .filter(Boolean)
    )
  );
  const filteredRows = rows.filter((row) => {
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || row.status === statusFilter;
    const matchesCategory = categoryFilter === 'todos' || row.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const recommendations = recommendationsList;

  const activityEvents = recentActivitiesList.map((a) => {
    let icon = Bell;
    if (a.icon === 'MessageCircle') icon = MessageCircle;
    else if (a.icon === 'ThumbsUp') icon = ThumbsUp;
    else if (a.icon === 'Leaf') icon = Leaf;
    else if (a.icon === 'Trophy') icon = Trophy;

    return {
      title: a.title,
      time: a.time,
      icon,
    };
  });

  const sustainableJourneyIcons: Record<string, { icon: LucideIcon; tone: string }> = {
    solar: { icon: Sun, tone: 'bg-yellow-100 text-yellow-700' },
    mobility: { icon: Car, tone: 'bg-green-100 text-green-700' },
    battery: { icon: BatteryCharging, tone: 'bg-orange-100 text-orange-700' },
    consumption: { icon: Recycle, tone: 'bg-blue-100 text-blue-700' },
  };

  const sustainableItems = (summary?.sustainable_journey || []).map((item) => {
    const meta = sustainableJourneyIcons[item.id] || { icon: Sun, tone: 'bg-slate-100 text-slate-700' };
    return {
      id: item.id,
      title: item.title,
      state: item.state,
      progress: item.progress,
      icon: meta.icon,
      tone: meta.tone,
      details: item.details,
    };
  });

  const renderCompanies = () => (
    <CompaniesTable
      rows={filteredRows}
      allRows={rows}
      loading={loading}
      categories={categories}
      searchTerm={searchTerm}
      statusFilter={statusFilter}
      categoryFilter={categoryFilter}
      onSearchChange={setSearchTerm}
      onStatusChange={setStatusFilter}
      onCategoryChange={setCategoryFilter}
      onOpenReply={setReplyDialogRow}
      onEdit={onEditReview}
      onDelete={onDeleteReview}
    />
  );

  const renderReviews = () => (
    <ReviewsPanel
      rows={rows}
      reviews={reviews}
      loading={loading}
      helpfulVotes={helpfulVotes}
      commentsCount={commentsCount}
      onOpenReply={setReplyDialogRow}
      onEdit={onEditReview}
      onDelete={onDeleteReview}
    />
  );

  const renderProposals = () => (
    <ProposalTracking leads={leads} replies={companyReplies} onOpenReply={setReplyDialogRow} />
  );

  const renderImpact = () => (
    <CommunityImpact
      views={profileViews}
      requests={leads.length}
      conversions={Math.round(leads.length * 0.35)}
      impactedPeople={impactedPeople}
      activityChart={activityChart}
    />
  );

  const renderReputation = () => (
    <div className="space-y-4 md:space-y-6">
      <GreenScoreCompact greenScore={greenScore} rankingPosition={rankingPosition} />
      <SustainableJourney items={sustainableItems} />
      <AchievementsStrip statuses={achievementStatuses} />
      <ActivityFeed events={activityEvents} />
      <GreenHouseCertification greenScore={greenScore} />
    </div>
  );

  const renderMobileTabContent = () => {
    if (activeTab === 'companies') return renderCompanies();
    if (activeTab === 'reviews') return renderReviews();
    if (activeTab === 'proposals') return renderProposals();
    if (activeTab === 'reputation') return renderReputation();
    if (activeTab === 'profile') {
      return (
        <ProfileSummaryPanel
          user={profileUser}
          greenScore={greenScore}
          profileCompletion={profileCompletion}
          location={userLocation}
        />
      );
    }

    return (
      <div className="space-y-4">
        {renderCompanies()}
        {renderProposals()}
        {renderImpact()}
        <AiRecommendations recommendations={recommendations} />
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-4 pb-20 pt-3 md:gap-6">
      {error && (
        <Card className="rounded-none border-red-200 bg-white shadow-none">
          <CardContent className="flex items-center gap-3 p-3 text-red-800 md:p-4">
            <CircleHelp className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </CardContent>
        </Card>
      )}



      {/* Layout Principal Unificado (Mobile e Desktop) */}
      <div className="w-full space-y-6">
        {/* Cabeçalho principal com saudação, progresso, ações rápidas e resumo */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Olá, {profileUser.name?.split(' ')[0] || 'Felipe'}! 👋
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Acompanhe o progresso do seu perfil.
                </p>
              </div>

              <div className="w-full md:w-72 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>Perfil concluído</span>
                  <span className="text-blue-600">{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} className="h-2 bg-slate-200" />
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Ações rápidas</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Link
                  href="/review-dashboard/profile"
                  className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-slate-800">Ver meu perfil</span>
                </Link>

                <Link
                  href="#reviews"
                  className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-slate-800">Minhas avaliações</span>
                </Link>

                <Link
                  href="#proposals"
                  className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                    {leads.length || 2}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-slate-800">Propostas recebidas</span>
                </Link>

                <Link
                  href="#solutions"
                  className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-center hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Heart className="h-6 w-6" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-slate-800">Soluções salvas</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Resumo do seu perfil & Etapas do perfil (Grid 2 colunas) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Resumo do seu perfil */}
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900">Resumo do seu perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <Eye className="h-4 w-4 text-slate-400" />
                    Visualizações
                  </span>
                  <span className="font-bold text-slate-900">{profileViews ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <Star className="h-4 w-4 text-slate-400" />
                    Avaliações
                  </span>
                  <span className="font-bold text-slate-900">{reviews.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <MessageCircle className="h-4 w-4 text-slate-400" />
                    Propostas recebidas
                  </span>
                  <span className="font-bold text-slate-900">{leads.length || 7}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <ThumbsUp className="h-4 w-4 text-slate-400" />
                    Taxa de resposta
                  </span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                    {responseRate === null ? '—' : `${responseRate}%`}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Etapas do perfil */}
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900">Etapas do perfil</CardTitle>
                  <span className="text-xs font-medium text-slate-500">4 de 6 concluídas</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Dados da empresa', done: true },
                  { label: 'Dados pessoais', done: true },
                  { label: 'Interesses e atuação', done: true },
                  { label: 'Redes sociais', done: true },
                  { label: 'Publicação e avaliação', done: false },
                  { label: 'Privacidade e visibilidade', done: false },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-3 text-sm">
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <CircleHelp className="h-5 w-5 text-slate-300" />
                    )}
                    <span className={cn('font-medium', step.done ? 'text-slate-800' : 'text-slate-400')}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Banner de incentivo de conquista */}
        {reviews.length === 0 && (
          <div className="mb-6 flex items-center justify-between rounded-none border border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Você está a 1 avaliação de desbloquear{' '}
                  <span className="font-semibold text-blue-700">1ª Avaliação</span>!
                </p>
                <p className="text-xs text-slate-500">
                  Publique sua primeira avaliação e ganhe 50 pontos Green Score.
                </p>
              </div>
            </div>
            <Link
              href="/companies"
              className="flex-shrink-0 rounded-none bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Avaliar empresa
            </Link>
          </div>
        )}
        {reviews.length > 0 && !hasSolarReview && (
          <div className="mb-6 flex items-center justify-between rounded-none border border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">☀️</span>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Você está a 1 avaliação de desbloquear{' '}
                  <span className="font-semibold text-blue-700">Projeto Solar Validado</span>!
                </p>
                <p className="text-xs text-slate-500">
                  Avalie uma empresa de energia solar para ganhar 150 pts Green Score.
                </p>
              </div>
            </div>
            <Link
              href="/categories/energia-solar"
              className="flex-shrink-0 rounded-none bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Avaliar empresa solar
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            {renderCompanies()}
            {renderReviews()}
            <SolutionsCard
              solutions={solutions}
              onAddClick={() => setIsAddModalOpen(true)}
              onRemove={removeSolution}
            />
            {renderProposals()}
            {renderImpact()}
          </div>

          <aside className="space-y-6 xl:col-span-4">
            <SustainableJourney items={sustainableItems} />
            <AchievementsStrip statuses={achievementStatuses} />
            <RewardsCard />
            <ActivityFeed events={activityEvents} />
          </aside>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <GreenHouseCertification greenScore={greenScore} />
          </div>
          <div className="xl:col-span-4">
            <AiRecommendations recommendations={recommendations} />
          </div>
        </div>
      </div>
      <ReplyDialog row={replyDialogRow} onOpenChange={(open) => !open && setReplyDialogRow(null)} />
      <AddUserSolutionModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAdd={addSolution}
      />
    </div>
  );
}

function ReviewMobileStatsStrip({ kpis, loading }: { kpis: ReviewKpi[]; loading: boolean }) {
  return (
    <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-4 md:overflow-visible xl:grid-cols-5 [&::-webkit-scrollbar]:hidden">
      {loading
        ? Array.from({ length: 5 }).map((_, index) => (
            <Card
              key={index}
              className="h-[82px] min-w-[118px] rounded-2xl border-slate-200 bg-white shadow-none md:h-[118px] md:min-w-0 md:shadow-sm"
            >
              <CardContent className="flex h-full flex-col justify-between p-3 md:p-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        : kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.label}
                className="h-[82px] min-w-[118px] rounded-2xl border-slate-200 bg-white shadow-none md:h-[118px] md:min-w-0 md:shadow-sm"
              >
                <CardContent className="flex h-full flex-col justify-between p-3 md:p-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full md:h-9 md:w-9',
                        kpi.iconClass
                      )}
                    >
                      <Icon className="h-3 w-3 md:h-4 md:w-4" />
                    </span>
                    <p className="truncate text-[10px] font-medium uppercase tracking-[0.03em] text-slate-500 md:text-xs">
                      {kpi.label}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-semibold leading-none text-slate-950 md:text-3xl">
                        {kpi.value}
                      </span>
                      <span className="truncate text-[10px] font-normal text-slate-500 md:text-xs">
                        {kpi.suffix}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[10px] font-medium text-emerald-700 md:text-xs">
                      {kpi.helper}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
    </div>
  );
}

function ReviewTabsCompact({
  activeTab,
  onChange,
}: {
  activeTab: ReviewDashboardTab;
  onChange: (tab: ReviewDashboardTab) => void;
}) {
  const tabs: Array<{ value: ReviewDashboardTab; label: string }> = [
    { value: 'overview', label: 'Visão geral' },
    { value: 'companies', label: 'Empresas' },
    { value: 'reviews', label: 'Avaliações' },
    { value: 'proposals', label: 'Propostas' },
    { value: 'reputation', label: 'Reputação' },
    { value: 'profile', label: 'Perfil' },
  ];

  return (
    <nav
      aria-label="Seções da central de reputação"
      className="-mx-4 flex w-[calc(100%+2rem)] max-w-[calc(100%+2rem)] gap-2 overflow-x-auto border-y border-slate-200 bg-white px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:w-full md:max-w-full md:rounded-2xl md:border md:px-3 md:shadow-sm [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'h-9 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors md:h-10 md:px-4',
              active
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-100 hover:text-slate-800'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function HeroProfile({
  user,
  reviewsCount,
  companiesCount,
  helpfulVotes,
  impactedPeople,
  repliesCount,
  onOpenReplies,
  unlockedBadgeIds = [],
}: {
  user: User & { city?: string; state?: string; avatar_url?: string };
  reviewsCount: number;
  companiesCount: number;
  helpfulVotes: number;
  impactedPeople: number;
  repliesCount: number;
  onOpenReplies: () => void;
  unlockedBadgeIds?: string[];
}) {
  const location = [user.city, user.state].filter(Boolean).join(', ') || 'Brasil';

  return (
    <section
      id="reputation"
      className="overflow-hidden rounded-[18px] border border-emerald-900/10 bg-[linear-gradient(135deg,#052E2B,#0F5B53_58%,#064E3B)] p-4 text-white shadow-sm md:min-h-[150px] md:rounded-[20px] md:p-5"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Avatar className="h-16 w-16 shrink-0 border-[3px] border-white/25 md:h-20 md:w-20 md:border-4">
            <AvatarImage src={user.avatar_url || ''} alt={user.name} />
            <AvatarFallback className="bg-white text-lg font-semibold text-emerald-900 md:text-2xl">
              {initialsFromName(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-lg font-semibold md:text-2xl">{user.name}</h2>
                <CheckCircle2 className="h-4 w-4 shrink-0 fill-emerald-400 text-emerald-400 md:h-5 md:w-5" />
              </div>
              <p className="text-xs font-medium text-white/80 md:text-sm">
                Especialista Solar · Membro desde {formatMonthYear(user.created_at)}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-normal text-white/75 md:text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </p>
            </div>
            {unlockedBadgeIds.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1">
                <PublicUserBadges unlockedBadgeIds={unlockedBadgeIds} maxVisible={3} size="sm" />
              </div>
            )}
            <p className="text-[11px] font-medium text-emerald-100 md:hidden">
              {reviewsCount} avaliação registrada · {impactedPeople.toLocaleString('pt-BR')} pessoas
              impactadas
            </p>
          </div>
        </div>

        <div className="hidden grid-cols-2 gap-4 sm:grid-cols-4 md:grid xl:min-w-[390px]">
          {[
            ['Avaliações', reviewsCount],
            ['Empresas', companiesCount],
            ['Votos úteis', helpfulVotes],
            ['Impactados', impactedPeople.toLocaleString('pt-BR')],
          ].map(([label, value]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs font-medium text-white/70">{label}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenReplies}
          className={cn(
            'group hidden min-h-[68px] w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.08] p-4 text-left transition hover:bg-white/[0.12] md:flex xl:max-w-[430px]',
            repliesCount > 0 && 'ring-1 ring-emerald-300/50'
          )}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
              <MessageCircle className="h-6 w-6" />
            </span>
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                Respostas das Empresas
                {repliesCount > 0 && (
                  <Badge className="animate-pulse bg-red-600 text-white">{repliesCount}</Badge>
                )}
              </span>
              <span className="text-xs font-semibold text-white/72">
                Empresas responderam suas avaliações
              </span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}

function CompaniesTable({
  rows,
  allRows,
  loading,
  categories,
  searchTerm,
  statusFilter,
  categoryFilter,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onOpenReply,
  onEdit,
  onDelete,
}: {
  rows: CompanyRow[];
  allRows: CompanyRow[];
  loading: boolean;
  categories: string[];
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onOpenReply: (row: CompanyRow) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const mobileFilters = [
    { label: 'Todas', value: 'todos' },
    { label: 'Respondidas', value: 'Respondeu' },
    { label: 'Sem resposta', value: 'Não respondeu' },
    { label: 'Mais recentes', value: 'todos' },
  ];

  return (
    <Card
      id="companies"
      className="rounded-[18px] border-slate-200 bg-white shadow-none md:rounded-[20px] md:shadow-sm"
    >
      <CardHeader className="space-y-3 p-4 md:space-y-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
            Empresas que você avaliou
          </CardTitle>
          <Button
            variant="ghost"
            className="hidden h-9 justify-start rounded-xl text-sm font-medium text-slate-700 md:inline-flex"
          >
            Ver todas <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nome da empresa"
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm font-normal md:h-11"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="hidden h-11 rounded-xl border-slate-200 bg-white font-medium md:inline-flex"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-2xl border-slate-200">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'todos',
                      'Respondeu',
                      'Não respondeu',
                      'Em análise',
                      'Respondida recentemente',
                    ].map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={statusFilter === status ? 'default' : 'outline'}
                        className="h-8 rounded-full text-xs"
                        onClick={() => onStatusChange(status)}
                      >
                        {status === 'todos' ? 'Todos' : status}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Categoria</p>
                  <div className="flex flex-wrap gap-2">
                    {['todos', ...categories].map((category) => (
                      <Button
                        key={category}
                        type="button"
                        size="sm"
                        variant={categoryFilter === category ? 'default' : 'outline'}
                        className="h-8 rounded-full text-xs"
                        onClick={() => onCategoryChange(category)}
                      >
                        {category === 'todos' ? 'Todas' : category}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
          {mobileFilters.map((filter) => (
            <Button
              key={filter.label}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(filter.value)}
              className={cn(
                'h-8 shrink-0 rounded-full px-3 text-[11px] font-medium',
                statusFilter === filter.value
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-500'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visualizações</TableHead>
                <TableHead>Solicitações</TableHead>
                <TableHead>Conversões</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center">
                    <p className="text-sm font-semibold text-slate-900">
                      {allRows.length === 0
                        ? 'Nenhuma empresa avaliada ainda.'
                        : 'Nenhum resultado para os filtros.'}
                    </p>
                    <Button asChild className="mt-3 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                      <Link href="/companies">Avaliar empresa</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100">
                          <AvatarImage src={row.logoUrl || ''} alt={row.name} />
                          <AvatarFallback>{row.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-slate-950">{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">{row.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {ratingStars(row.rating)}
                        <span className="ml-1 text-xs font-semibold">{row.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('rounded-full font-medium', statusClassName(row.status))}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{row.views}</TableCell>
                    <TableCell className="font-semibold">{row.requests}</TableCell>
                    <TableCell className="font-semibold">{row.conversions}</TableCell>
                    <TableCell className="font-medium text-slate-500">
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        row={row}
                        onOpenReply={onOpenReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-2.5 px-4 pb-4 md:hidden">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl" />
            ))
          ) : rows.length === 0 ? (
            <ReviewEmptyStateCompact
              icon={Building2}
              title="Nenhuma empresa avaliada ainda"
              description="As empresas avaliadas por você aparecem aqui."
              href="/companies"
              action="Avaliar empresa"
            />
          ) : (
            rows.map((row) => (
              <div key={row.id} className="min-h-[96px] rounded-2xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-11 w-11 shrink-0 border border-slate-100">
                      <AvatarImage src={row.logoUrl || ''} alt={row.name} />
                      <AvatarFallback>{row.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{row.name}</p>
                      <p className="truncate text-xs font-normal text-slate-500">{row.category}</p>
                      <div className="mt-1 flex items-center gap-1">
                        {ratingStars(row.rating)}
                        <span className="text-[11px] font-medium text-slate-500">
                          {row.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <RowActions
                    row={row}
                    onOpenReply={onOpenReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full text-[11px] font-medium',
                      statusClassName(row.status)
                    )}
                  >
                    {row.status}
                  </Badge>
                  <p className="truncate text-[11px] font-normal text-slate-500">
                    {row.views} visualizações · {row.requests} solicitações
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RowActions({
  row,
  onOpenReply,
  onEdit,
  onDelete,
}: {
  row: CompanyRow;
  onOpenReply: (row: CompanyRow) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onOpenReply(row)}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(row.reviewId)}>
          <Edit3 className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.success('Link de compartilhamento preparado.')}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => onDelete(row.reviewId)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GreenScoreCompact({
  greenScore,
  rankingPosition,
}: {
  greenScore: number;
  rankingPosition: number;
}) {
  const level =
    greenScore >= 900
      ? 'Platinum'
      : greenScore >= 760
        ? 'Gold'
        : greenScore >= 650
          ? 'Green Pro'
          : 'Em evolução';
  const progress = Math.min(100, Math.max(0, Math.round((greenScore / 900) * 100)));

  return (
    <Card className="rounded-[18px] border-slate-200 bg-white shadow-none md:shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 md:h-14 md:w-14">
            <Leaf className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.03em] text-slate-500">
                  Green Score
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-3xl font-semibold leading-none text-slate-950">{greenScore}</p>
                  <span className="text-xs font-medium text-emerald-700">{level}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-emerald-100 bg-emerald-50 text-emerald-700"
              >
                {rankingPosition}º
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={progress} className="h-2 flex-1 bg-slate-100" />
              <span className="text-[11px] font-medium text-slate-500">{progress}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewsPanel({
  rows,
  reviews,
  loading,
  helpfulVotes,
  commentsCount,
  onOpenReply,
  onEdit,
  onDelete,
}: {
  rows: CompanyRow[];
  reviews: Review[];
  loading: boolean;
  helpfulVotes: number;
  commentsCount: number;
  onOpenReply: (row: CompanyRow) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'todas' | 'comentario' | 'resposta' | 'pendente'>('todas');
  const rowByReviewId = useMemo(() => new Map(rows.map((row) => [row.reviewId, row])), [rows]);
  const filteredReviews = reviews.filter((review) => {
    const hasText = Boolean(review.comment || review.body || review.headline || review.buyer_tip);
    const hasReply = Boolean(review.reply || review.replied_at);
    if (filter === 'comentario') return hasText;
    if (filter === 'resposta') return hasReply;
    if (filter === 'pendente') return !hasReply;
    return true;
  });

  const filters = [
    ['todas', 'Todas'],
    ['comentario', 'Com comentário'],
    ['resposta', 'Com resposta'],
    ['pendente', 'Pendentes'],
  ] as const;

  return (
    <Card
      id="reviews"
      className="rounded-[18px] border-slate-200 bg-white shadow-none md:shadow-sm"
    >
      <CardHeader className="space-y-3 p-4 md:p-6">
        <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
          Minhas avaliações
        </CardTitle>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            ['Avaliações', reviews.length],
            ['Votos úteis', helpfulVotes],
            ['Comentários', commentsCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="h-16 min-w-[112px] rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.03em] text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setFilter(value)}
              className={cn(
                'h-8 shrink-0 rounded-full border px-3 text-[11px] font-medium',
                filter === value
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-500'
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))
        ) : filteredReviews.length === 0 ? (
          <ReviewEmptyStateCompact
            icon={MessageCircle}
            title="Nenhuma avaliação encontrada"
            description="As avaliações publicadas com seus filtros atuais aparecem aqui."
            href="/companies"
            action="Avaliar empresa"
          />
        ) : (
          filteredReviews.map((review) => {
            const row = rowByReviewId.get(String(review.id));
            const company = getCompanyInfo(review);
            const text =
              review.comment ||
              review.body ||
              review.buyer_tip ||
              review.headline ||
              'Avaliação sem comentário.';
            const hasReply = Boolean(review.reply || review.replied_at);

            return (
              <article key={review.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{company.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-0.5">{ratingStars(review.rating)}</div>
                      <span className="text-[11px] font-normal text-slate-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                  {row ? (
                    <RowActions
                      row={row}
                      onOpenReply={onOpenReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl"
                      onClick={() => onEdit(String(review.id))}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="mt-3 overflow-hidden text-sm font-normal leading-5 text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                  {text}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      'rounded-full text-[11px] font-medium',
                      hasReply
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-100 bg-red-50 text-red-700'
                    )}
                  >
                    {hasReply ? 'Respondida' : 'Não respondeu'}
                  </Badge>
                  <span className="text-[11px] font-normal text-slate-500">
                    {Number(review.helpful_count || 0)} úteis
                  </span>
                </div>
              </article>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function ProfileSummaryPanel({
  user,
  greenScore,
  profileCompletion,
  location,
}: {
  user: User & { city?: string | null; state?: string | null; avatar_url?: string | null };
  greenScore: number;
  profileCompletion: number;
  location: string;
}) {
  const level =
    greenScore >= 760 ? 'Avançado' : greenScore >= 650 ? 'Intermediário' : 'Em evolução';
  const rows = [
    ['Nome', user.name],
    ['Email', user.email],
    ['Telefone', user.phone || 'Não informado'],
    ['Membro desde', formatDate(user.created_at)],
    ['Localização', location],
    ['Nível', level],
  ];

  return (
    <div className="space-y-4">
      <Card className="rounded-[18px] border-slate-200 bg-white shadow-none md:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
          <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
            Informações pessoais
          </CardTitle>
          <Button
            asChild
            variant="ghost"
            className="h-8 rounded-xl px-2 text-xs font-medium text-emerald-700"
          >
            <Link href="/review-dashboard/profile">
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Editar perfil
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 p-4 pt-0 md:p-6 md:pt-0">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0"
            >
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <span className="min-w-0 truncate text-right text-sm font-normal text-slate-900">
                {value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[18px] border-slate-200 bg-white shadow-none md:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
          <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
            Foto e reputação
          </CardTitle>
          <Button
            asChild
            variant="ghost"
            className="h-8 rounded-xl px-2 text-xs font-medium text-emerald-700"
          >
            <Link href="/review-dashboard/profile">Alterar foto</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Avatar className="h-20 w-20 border-[3px] border-white shadow-sm">
              <AvatarImage src={user.avatar_url || ''} alt={user.name} />
              <AvatarFallback className="bg-emerald-50 text-lg font-semibold text-emerald-800">
                {initialsFromName(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">{user.name}</p>
              <p className="mt-1 text-xs font-normal text-slate-500">
                Green Score {greenScore} · Perfil {profileCompletion}% completo
              </p>
              <Progress value={profileCompletion} className="mt-3 h-2 bg-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewEmptyStateCompact({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex min-h-[132px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
      <Icon className="h-7 w-7 text-slate-300" />
      <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-xs text-xs font-normal text-slate-500">{description}</p>
      {href && action && (
        <Button
          asChild
          className="mt-3 h-9 rounded-xl bg-emerald-700 px-4 text-xs font-medium hover:bg-emerald-800"
        >
          <Link href={href}>{action}</Link>
        </Button>
      )}
    </div>
  );
}

function ProposalTracking({
  leads,
  replies,
  onOpenReply,
}: {
  leads: Lead[];
  replies: CompanyRow[];
  onOpenReply: (row: CompanyRow) => void;
}) {
  const proposalLeads = leads.slice(0, 5);
  const answeredLeads = leads.filter((lead) => lead.status === 'proposal_sent').length;
  const openLeads = leads.filter((lead) =>
    [
      'draft',
      'pending_otp',
      'verified',
      'distributed',
      'proposal_submitted',
      'proposal_processing',
    ].includes(lead.status || '')
  ).length;

  return (
    <Card
      id="opportunities"
      className="rounded-[18px] border-slate-200 bg-white shadow-none md:rounded-[20px] md:shadow-sm"
    >
      <span id="company-replies" className="sr-only" />
      <CardHeader className="space-y-2 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
              Propostas e respostas
            </CardTitle>
            <p className="text-xs font-normal text-slate-500 md:text-sm">
              Suas solicitações vindas de propostas e retornos das empresas em um só lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-blue-200 bg-blue-50 text-xs font-medium text-blue-700"
            >
              {openLeads} em andamento
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700"
            >
              {answeredLeads + replies.length} respondidas
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
        {proposalLeads.length === 0 && replies.length === 0 ? (
          <ReviewEmptyStateCompact
            icon={Send}
            title="Nenhuma proposta solicitada ainda"
            description="Solicite propostas para acompanhar respostas e etapas por aqui."
            href="/companies"
            action="Solicitar proposta"
          />
        ) : (
          <div className="grid gap-3">
            {proposalLeads.map((lead) => {
              const companyName = getLeadCompanyName(lead);
              const meta = leadStatusMeta(lead.status);

              return (
                <div key={lead.id} className="rounded-2xl border border-slate-200 p-3 md:p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0 border border-slate-100">
                        <AvatarImage src={getLeadCompanyLogo(lead) || ''} alt={companyName} />
                        <AvatarFallback>{initialsFromName(companyName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {companyName}
                        </p>
                        <p className="truncate text-xs font-normal text-slate-500">
                          {lead.product_vertical || lead.category || 'Energia Solar'} ·{' '}
                          {formatDate(lead.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('w-fit rounded-full text-xs font-medium', meta.className)}
                    >
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>Progresso da proposta</span>
                      <span>{meta.progress}%</span>
                    </div>
                    <Progress value={meta.progress} className="h-2 bg-slate-100" />
                  </div>
                </div>
              );
            })}

            {replies.slice(0, 3).map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onOpenReply(row)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-left transition hover:bg-emerald-50 md:p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-11 w-11 border border-white">
                    <AvatarImage src={row.logoUrl || ''} alt={row.name} />
                    <AvatarFallback>{row.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{row.name}</p>
                    <p className="truncate text-xs font-normal text-slate-600">
                      {row.reply || 'Resposta disponível para leitura.'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-emerald-700" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SustainableJourney({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    state: string;
    progress: number;
    icon: typeof Sun;
    tone: string;
    details: string[];
  }>;
}) {
  return (
    <Card
      id="green-house"
      className="rounded-[18px] border-slate-200 bg-white shadow-none md:rounded-[20px] md:shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
        <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
          Jornada Sustentável
        </CardTitle>
        <Button
          variant="ghost"
          className="hidden h-8 rounded-xl text-xs font-medium md:inline-flex"
        >
          Ver Green House <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <Accordion type="multiple" defaultValue={['solar']} className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="rounded-2xl border border-slate-200 px-3"
              >
                <AccordionTrigger className="py-2.5 hover:no-underline md:py-4">
                  <div className="flex min-w-0 items-center gap-3 text-left">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:h-11 md:w-11',
                        item.tone
                      )}
                    >
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">
                        {item.title}
                      </span>
                      <span className="block text-xs font-normal text-slate-500">{item.state}</span>
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Progress value={item.progress} className="mb-3 h-2 bg-slate-100" />
                  <div className="space-y-1 pb-2">
                    {item.details.map((detail) => (
                      <p key={detail} className="text-xs font-normal text-slate-500">
                        {detail}
                      </p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// O componente Achievements foi substituído pelo AchievementsStrip com SVGs reais.
// Ver: components/achievements/AchievementsStrip.tsx

function CommunityImpact({
  views,
  requests,
  conversions,
  impactedPeople,
  activityChart,
}: {
  views: number;
  requests: number;
  conversions: number;
  impactedPeople: number;
  activityChart: ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
      <Card className="rounded-[18px] border-slate-200 bg-white shadow-none md:rounded-[20px] md:shadow-sm xl:col-span-2">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
            Impacto na comunidade
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0 md:grid-cols-4 md:gap-4 md:p-6 md:pt-0">
          {[
            ['Visualizações', views],
            ['Solicitações', requests],
            ['Conversões', conversions],
            ['Pessoas impactadas', impactedPeople],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex h-16 flex-col justify-center rounded-2xl bg-slate-50 p-3 md:h-auto md:p-4"
            >
              <p className="truncate text-[11px] font-medium text-slate-500 md:text-xs">{label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-950 md:mt-2 md:text-2xl">
                {Number(value).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="hidden md:block xl:col-span-2">
        <Tabs defaultValue="30d" className="space-y-3">
          <TabsList className="rounded-2xl bg-white p-1 shadow-sm">
            <TabsTrigger value="7d" className="rounded-xl">
              7 dias
            </TabsTrigger>
            <TabsTrigger value="30d" className="rounded-xl">
              30 dias
            </TabsTrigger>
            <TabsTrigger value="90d" className="rounded-xl">
              90 dias
            </TabsTrigger>
            <TabsTrigger value="12m" className="rounded-xl">
              12 meses
            </TabsTrigger>
          </TabsList>
          <TabsContent value="7d">{activityChart}</TabsContent>
          <TabsContent value="30d">{activityChart}</TabsContent>
          <TabsContent value="90d">{activityChart}</TabsContent>
          <TabsContent value="12m">{activityChart}</TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function ActivityFeed({
  events,
}: {
  events: Array<{ icon: typeof Bell; title: string; time: string }>;
}) {
  return (
    <Card
      id="activity-feed"
      className="rounded-[18px] border-slate-200 bg-white shadow-none md:rounded-[20px] md:shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
        <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
          Atividade recente
        </CardTitle>
        <Button
          variant="ghost"
          className="hidden h-8 rounded-xl text-xs font-medium md:inline-flex"
        >
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
        {events.length === 0 ? (
          <ReviewEmptyStateCompact
            icon={Bell}
            title="Sem atividade recente"
            description="Curtidas, respostas e conquistas aparecem aqui."
          />
        ) : (
          events.map((event) => {
            const Icon = event.icon;
            return (
              <div key={event.title} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 md:h-10 md:w-10">
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{event.title}</p>
                </div>
                <span className="text-xs font-normal text-slate-500">{event.time}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function GreenHouseCertification({ greenScore }: { greenScore: number }) {
  const tiers = [
    ['Bronze', 'Energia Solar', greenScore >= 550, Flame],
    ['Silver', 'Solar + EV', greenScore >= 650, ShieldCheck],
    ['Gold', 'Solar + EV + Bateria', greenScore >= 760, Sun],
    ['Platinum', 'Completo', greenScore >= 900, Trophy],
  ] as const;
  return (
    <Card className="rounded-[18px] border-emerald-100 bg-emerald-50/70 shadow-none md:rounded-[20px] md:shadow-sm">
      <CardContent className="p-4 md:p-5">
        <div className="mb-3 md:mb-4">
          <h3 className="text-base font-semibold text-emerald-900 md:text-lg">
            Green House Certification
          </h3>
          <p className="text-xs font-normal text-emerald-800 md:text-sm">
            Conquiste selos e mostre ao mundo que sua casa é sustentável.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {tiers.map(([tier, label, unlocked, Icon]) => (
            <div
              key={tier}
              className="flex h-16 items-center gap-2 rounded-2xl bg-white/70 p-2 md:h-auto md:gap-3 md:p-3"
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:h-12 md:w-12',
                  unlocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                )}
              >
                {unlocked ? (
                  <Icon className="h-4 w-4 md:h-6 md:w-6" />
                ) : (
                  <Lock className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-950 md:text-sm">
                  {tier}
                </span>
                <span className="block truncate text-[11px] font-normal text-slate-500 md:text-xs">
                  {label}
                </span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AiRecommendations({
  recommendations,
}: {
  recommendations: Array<{ name: string; city: string; rating: number; badge: string }>;
}) {
  return (
    <Card className="rounded-[18px] border-slate-200 bg-white shadow-none md:rounded-[20px] md:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
        <div>
          <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
            Recomendações por IA
          </CardTitle>
          <p className="text-xs font-normal text-slate-500">
            Empresas que combinam com seu perfil e região.
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
        {recommendations.length === 0 ? (
          <ReviewEmptyStateCompact
            icon={Sparkles}
            title="Sem recomendações no momento"
            description="As sugestões personalizadas aparecem conforme seu perfil evolui."
          />
        ) : (
          recommendations.map((company) => (
            <div key={company.name} className="rounded-2xl border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{company.name}</p>
                  <p className="text-xs font-normal text-slate-500">{company.city}</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  {company.badge}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {ratingStars(company.rating)}
                  <span className="ml-1 text-xs font-semibold">{company.rating}</span>
                </div>
                <Button
                  size="sm"
                  className="h-8 rounded-xl bg-emerald-700 text-xs font-medium hover:bg-emerald-800"
                  asChild
                >
                  <Link href="/companies">Avaliar</Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ReplyDialog({
  row,
  onOpenChange,
}: {
  row: CompanyRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Resposta da empresa</DialogTitle>
          <DialogDescription>{row?.name || 'Empresa'} respondeu sua avaliação.</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold leading-relaxed text-slate-700">
            {row?.reply ||
              'A empresa agradeceu sua avaliação e informou que acompanhará seu atendimento pela plataforma.'}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => toast.success('Resposta compartilhada.')}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => toast.success('Avaliação da resposta registrada.')}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Avaliar resposta
          </Button>
          <Button
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
            onClick={() => toast.info('Fluxo de resposta será conectado ao chat P2P.')}
          >
            <Send className="mr-2 h-4 w-4" />
            Responder empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SolutionsCard({
  solutions,
  onAddClick,
  onRemove,
}: {
  solutions: UserSolution[];
  onAddClick: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card id="solutions" className="rounded-2xl border-slate-200 bg-white shadow-sm p-6">
      <div className="p-0 mb-4 flex flex-row items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Soluções que você utiliza</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Adicione as tecnologias sustentáveis que você possui instaladas.
          </p>
        </div>
        <Button size="sm" onClick={onAddClick} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white">
          + Adicionar
        </Button>
      </div>

      {solutions.length === 0 ? (
        <div className="p-0 py-6 text-center border border-dashed border-gray-150 rounded-xl bg-slate-50/50">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Laptop className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900">Nenhuma solução cadastrada</h4>
          <p className="max-w-md mx-auto text-xs text-gray-500 mt-1 leading-normal px-4">
            Cadastre empresas, produtos ou tecnologias que você utiliza para receber recomendações melhores, desbloquear conquistas e fortalecer sua reputação.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button size="sm" onClick={onAddClick} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white">
              + Adicionar solução
            </Button>
            <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-semibold" asChild>
              <Link href="/companies">Buscar empresa</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {solutions.map((sol) => (
            <UserSolutionChip key={sol.id} solution={sol} onRemove={onRemove} />
          ))}
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/20 px-3.5 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
          >
            + Adicionar
          </button>
        </div>
      )}
    </Card>
  );
}

function RewardsCard() {
  return (
    <Card id="rewards" className="rounded-2xl border-slate-200 bg-white shadow-sm p-5">
      <div className="p-0 mb-3">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Minhas Recompensas</h3>
      </div>
      <div className="p-0 py-6 text-center border border-dashed border-gray-150 rounded-xl bg-slate-50/50">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Gift className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-bold text-gray-900">Nenhuma recompensa ativa</h4>
        <p className="text-[11px] text-gray-500 mt-1 px-4 leading-normal">
          Acompanhe cupons, pontos extras e benefícios exclusivos aqui assim que publicar avaliações úteis.
        </p>
      </div>
    </Card>
  );
}
