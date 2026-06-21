'use client';

import { ReactNode, useMemo, useState } from 'react';
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
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Award,
  BatteryCharging,
  Bell,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Command,
  Edit3,
  Eye,
  FileText,
  Filter,
  Flame,
  Home,
  Leaf,
  Lock,
  MapPin,
  Medal,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Network,
  Plus,
  Recycle,
  RefreshCcw,
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
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Lead, Review, User } from '@/lib/api';
import { cn } from '@/lib/utils';

import { type ReviewDashboardSummary } from '../DashboardLayoutClient';

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

function greeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function initialsFromName(name?: string | null) {
  const safeName = name?.trim() || 'Usuário';
  const parts = safeName.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase();
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

  return {
    name: review.company?.name || 'Empresa',
    logoUrl: review.company?.logo_url || null,
    slug: review.company?.slug,
  };
}

function getLeadCompanyName(lead: Lead) {
  if (typeof lead.company === 'string' && lead.company.trim()) return lead.company;
  if (lead.company && typeof lead.company === 'object' && lead.company.name) return lead.company.name;
  if (lead.company_obj?.name) return lead.company_obj.name;
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
    draft: { label: 'Rascunho', className: 'bg-slate-100 text-slate-700 border-slate-200', progress: 12 },
    pending_otp: { label: 'Aguardando validação', className: 'bg-amber-50 text-amber-700 border-amber-200', progress: 24 },
    verified: { label: 'Validada', className: 'bg-blue-50 text-blue-700 border-blue-200', progress: 42 },
    distributed: { label: 'Enviada às empresas', className: 'bg-indigo-50 text-indigo-700 border-indigo-200', progress: 58 },
    proposal_submitted: { label: 'Proposta solicitada', className: 'bg-purple-50 text-purple-700 border-purple-200', progress: 68 },
    proposal_processing: { label: 'Em análise', className: 'bg-amber-50 text-amber-700 border-amber-200', progress: 78 },
    proposal_sent: { label: 'Respondida', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', progress: 100 },
    proposal_failed: { label: 'Revisar dados', className: 'bg-red-50 text-red-700 border-red-200', progress: 36 },
    canceled: { label: 'Cancelada', className: 'bg-red-50 text-red-700 border-red-200', progress: 0 },
  };

  return statusMap[status || ''] || {
    label: status || 'Em acompanhamento',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    progress: 35,
  };
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
  return reviews.map((review, index) => {
    const company = getCompanyInfo(review);
    const relatedLeads = leads.filter((lead) => getLeadCompanyName(lead) === company.name);
    const requests = relatedLeads.length;
    // @ts-ignore - read_count might not be typed yet
    const views = Number(review.read_count || review.metadata?.read_count || 0);
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
      conversions: relatedLeads.filter(l => ['verified', 'proposal_sent', 'proposal_processing'].includes(l.status || '')).length,
      date: review.created_at,
      reply: review.reply,
    };
  });
}

function statusClassName(status: CompanyRow['status']) {
  if (status === 'Respondida recentemente') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
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
  refreshing,
  error,
  activityChart,
  onRefresh,
  onDeleteReview,
  onEditReview,
}: ReputationDashboardProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [replyDialogRow, setReplyDialogRow] = useState<CompanyRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const profileUser = user as User & { city?: string; state?: string; avatar_url?: string };
  const firstName = user.name?.split(' ')[0] || 'Felipe';

  const rows = useMemo(() => buildCompanyRows(reviews, leads), [reviews, leads]);
  const monthlyReviews = reviews.filter((review) => isRecent(review.created_at)).length;
  
  // Real values from the API summary
  const helpfulVotes = summary?.impact?.helpful_votes || 0;
  const impactedPeople = summary?.impact?.impacted_people || 0;
  const greenScore = summary?.gamification?.green_score || 0;
  const rankingPosition = summary?.gamification?.regional_ranking || 1;
  const achievementsList = summary?.gamification?.achievements || [];
  const recommendationsList = summary?.recommendations || [];
  const recentActivitiesList = summary?.recent_activities || [];
  
  const companyReplies = rows.filter((row) => row.reply || row.status.includes('Respond'));
  const profileViews = summary?.charts?.activity_30d?.reduce((total, point) => total + point.profile_views, 0) || 0;
  const ctaClicks = summary?.charts?.activity_30d?.reduce((total, point) => total + point.cta_clicks + point.whatsapp_clicks, 0) || 0;
  
  const profileCompletion = summary?.profile?.completion_percent || 0;
  const userLocation = [profileUser.city, profileUser.state].filter(Boolean).join(', ') || 'Brasil';

  const kpis = [
    {
      label: 'Green Score',
      value: `${greenScore}`,
      suffix: 'pontos',
      helper: greenScore >= 760 ? 'Nível Eco Expert' : greenScore >= 650 ? 'Nível Green Pro' : 'Nível em evolução',
      icon: Leaf,
      iconClass: 'bg-green-100 text-green-700',
    },
    {
      label: 'Avaliações realizadas',
      value: `${reviews.length}`,
      suffix: 'avaliações',
      helper: `+${monthlyReviews} este mês`,
      icon: Star,
      iconClass: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Votos úteis recebidos',
      value: `${helpfulVotes}`,
      suffix: 'votos',
      helper: `Verificado e contabilizado`,
      icon: ThumbsUp,
      iconClass: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Pessoas impactadas',
      value: impactedPeople.toLocaleString('pt-BR'),
      suffix: 'pessoas',
      helper: `Leituras e engajamentos reais`,
      icon: Users,
      iconClass: 'bg-rose-100 text-rose-700',
    },
    {
      label: 'Ranking regional',
      value: `${rankingPosition}º`,
      suffix: userLocation,
      helper: 'Posição na sua região',
      icon: Trophy,
      iconClass: 'bg-yellow-100 text-yellow-700',
    },
  ];

  const categories = Array.from(new Set(rows.map((row) => row.category).filter(Boolean)));
  const filteredRows = rows.filter((row) => {
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || row.status === statusFilter;
    const matchesCategory = categoryFilter === 'todos' || row.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const achievements = achievementsList.map(a => {
    let icon = Award;
    if (a.title.includes('Primeira')) icon = Medal;
    else if (a.title.includes('5')) icon = Trophy;
    else if (a.title.includes('10')) icon = Sun;
    else if (a.title.includes('Expert')) icon = ShieldCheck;
    else if (a.title.includes('Green House')) icon = Leaf;
    else if (a.title.includes('EV')) icon = Car;
    else if (a.title.includes('Storage')) icon = BatteryCharging;
    
    return {
      title: a.title,
      subtitle: a.subtitle,
      icon,
      state: a.state,
      unlocked: a.state !== 'bloqueado'
    };
  });

  const recommendations = recommendationsList;

  const activityEvents = recentActivitiesList.map(a => {
    let icon = Bell;
    if (a.icon === 'MessageCircle') icon = MessageCircle;
    else if (a.icon === 'ThumbsUp') icon = ThumbsUp;
    else if (a.icon === 'Leaf') icon = Leaf;
    else if (a.icon === 'Trophy') icon = Trophy;

    return {
      title: a.title,
      time: a.time,
      icon
    };
  });

  const sustainableItems = [
    {
      id: 'solar',
      title: 'Energia Solar',
      state: reviews.length > 0 ? 'Completo' : 'Não iniciado',
      progress: reviews.length > 0 ? 100 : 0,
      icon: Sun,
      tone: 'bg-yellow-100 text-yellow-700',
      details: reviews.length > 0 ? ['Com avaliações no perfil'] : ['Sem avaliações ainda'],
    },
    {
      id: 'mobility',
      title: 'Mobilidade Elétrica',
      state: leads.some((lead) => /car|ev|mobil/i.test(lead.product_vertical || '')) ? 'Em progresso' : 'Não iniciado',
      progress: leads.some((lead) => /car|ev|mobil/i.test(lead.product_vertical || '')) ? 55 : 0,
      icon: Car,
      tone: 'bg-green-100 text-green-700',
      details: leads.some((lead) => /car|ev|mobil/i.test(lead.product_vertical || '')) ? ['Interesse demonstrado em propostas'] : ['Sem propostas na área'],
    },
    {
      id: 'battery',
      title: 'Bateria / Armazenamento',
      state: leads.some((lead) => /bater/i.test(lead.product_vertical || '')) ? 'Em progresso' : 'Não iniciado',
      progress: leads.some((lead) => /bater/i.test(lead.product_vertical || '')) ? 36 : 0,
      icon: BatteryCharging,
      tone: 'bg-orange-100 text-orange-700',
      details: leads.some((lead) => /bater/i.test(lead.product_vertical || '')) ? ['Interesse demonstrado em propostas'] : ['Sem propostas na área'],
    },
    {
      id: 'consumption',
      title: 'Consumo Consciente',
      state: profileCompletion > 50 ? 'Em progresso' : 'Não iniciado',
      progress: Math.max(0, profileCompletion),
      icon: Recycle,
      tone: 'bg-blue-100 text-blue-700',
      details: [`Perfil ${profileCompletion}% preenchido`],
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-28">

            {error && (
              <Card className="rounded-[20px] border-red-100 bg-red-50 shadow-sm">
                <CardContent className="flex items-center gap-3 p-4 text-red-800">
                  <CircleHelp className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-semibold">{error}</p>
                </CardContent>
              </Card>
            )}

            <section id="overview">
              <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible xl:grid-cols-6 [&::-webkit-scrollbar]:hidden">
                {loading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index} className="h-[120px] min-w-[210px] rounded-[20px] border-slate-200 bg-white shadow-sm md:min-w-0">
                        <CardContent className="flex h-full items-center gap-3 p-4">
                          <Skeleton className="h-11 w-11 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-7 w-20" />
                            <Skeleton className="h-3 w-28" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  : kpis.map((kpi) => {
                      const Icon = kpi.icon;
                      return (
                        <Card key={kpi.label} className="h-[120px] min-w-[210px] rounded-[20px] border-slate-200 bg-white shadow-sm md:min-w-0">
                          <CardContent className="flex h-full flex-col justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', kpi.iconClass)}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <p className="min-w-0 text-xs font-bold text-slate-700">{kpi.label}</p>
                            </div>
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-950">{kpi.value}</span>
                                <span className="min-w-0 text-xs font-semibold text-slate-600">{kpi.suffix}</span>
                              </div>
                              <p className="truncate text-xs font-semibold text-emerald-700">{kpi.helper}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
              </div>
            </section>

              <HeroProfile
                user={profileUser}
                reviewsCount={reviews.length}
                companiesCount={rows.length}
              helpfulVotes={helpfulVotes}
              impactedPeople={impactedPeople}
              repliesCount={companyReplies.length}
              onOpenReplies={() => {
                document.getElementById('company-replies')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
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

                <ProposalTracking
                  leads={leads}
                  replies={companyReplies}
                  onOpenReply={setReplyDialogRow}
                />

                <CommunityImpact
                  views={profileViews}
                  requests={leads.length}
                  conversions={Math.round(leads.length * 0.35)}
                  impactedPeople={impactedPeople}
                  activityChart={activityChart}
                />
              </div>

              <aside className="space-y-6 xl:col-span-4">
                <SustainableJourney items={sustainableItems} />
                <Achievements achievements={achievements} />
                <ActivityFeed events={activityEvents} />
              </aside>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <GreenHouseCertification greenScore={greenScore} />
              </div>
              <div className="lg:col-span-2">
                <AiRecommendations recommendations={recommendations} />
              </div>
            </div>
      <ReplyDialog row={replyDialogRow} onOpenChange={(open) => !open && setReplyDialogRow(null)} />
    </div>
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
}: {
  user: User & { city?: string; state?: string; avatar_url?: string };
  reviewsCount: number;
  companiesCount: number;
  helpfulVotes: number;
  impactedPeople: number;
  repliesCount: number;
  onOpenReplies: () => void;
}) {
  const badges = ['Solar Expert', 'Green House', 'EV Driver', 'Energy Storage', 'Top Avaliador', 'Especialista Residencial'];
  const location = [user.city, user.state].filter(Boolean).join(', ') || 'Brasil';

  return (
    <section id="reputation" className="rounded-[20px] bg-[linear-gradient(135deg,#0A2C33,#0F5B53_54%,#114D43)] p-5 text-white shadow-sm md:min-h-[140px]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center">
          <Avatar className="h-20 w-20 shrink-0 border-4 border-white/20">
            <AvatarImage src={user.avatar_url || ''} alt={user.name} />
            <AvatarFallback className="bg-white text-2xl font-black text-emerald-900">{initialsFromName(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-black">{user.name}</h2>
                <CheckCircle2 className="h-5 w-5 fill-emerald-400 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-white/78">Especialista Solar · Membro desde {formatMonthYear(user.created_at)}</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-white/78">
                <MapPin className="h-4 w-4" />
                {location}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge key={badge} className="rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/15">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:min-w-[390px]">
          {[
            ['Avaliações', reviewsCount],
            ['Empresas', companiesCount],
            ['Votos úteis', helpfulVotes],
            ['Impactados', impactedPeople.toLocaleString('pt-BR')],
          ].map(([label, value]) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs font-semibold text-white/70">{label}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenReplies}
          className={cn(
            'group flex min-h-[74px] w-full items-center justify-between rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:bg-white/12 xl:max-w-[430px]',
            repliesCount > 0 && 'ring-1 ring-emerald-300/50'
          )}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
              <MessageCircle className="h-6 w-6" />
            </span>
            <span>
              <span className="flex items-center gap-2 text-sm font-black">
                Respostas das Empresas
                {repliesCount > 0 && <Badge className="animate-pulse bg-red-600 text-white">{repliesCount}</Badge>}
              </span>
              <span className="text-xs font-semibold text-white/72">Empresas responderam suas avaliações</span>
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
  return (
    <Card id="companies" className="rounded-[20px] border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg font-black text-slate-950">Empresas que você avaliou</CardTitle>
          <Button variant="ghost" className="h-9 justify-start rounded-xl text-sm font-bold text-slate-700">
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
              className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 font-semibold"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white font-bold">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-2xl border-slate-200">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-black uppercase text-slate-500">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['todos', 'Respondeu', 'Não respondeu', 'Em análise', 'Respondida recentemente'].map((status) => (
                      <Button key={status} type="button" size="sm" variant={statusFilter === status ? 'default' : 'outline'} className="h-8 rounded-full text-xs" onClick={() => onStatusChange(status)}>
                        {status === 'todos' ? 'Todos' : status}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-black uppercase text-slate-500">Categoria</p>
                  <div className="flex flex-wrap gap-2">
                    {['todos', ...categories].map((category) => (
                      <Button key={category} type="button" size="sm" variant={categoryFilter === category ? 'default' : 'outline'} className="h-8 rounded-full text-xs" onClick={() => onCategoryChange(category)}>
                        {category === 'todos' ? 'Todas' : category}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
                      <TableCell key={cellIndex}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center">
                    <p className="text-sm font-bold text-slate-900">{allRows.length === 0 ? 'Nenhuma empresa avaliada ainda.' : 'Nenhum resultado para os filtros.'}</p>
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
                        <span className="font-bold text-slate-950">{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-600">{row.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {ratingStars(row.rating)}
                        <span className="ml-1 text-xs font-black">{row.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('rounded-full font-bold', statusClassName(row.status))}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">{row.views}</TableCell>
                    <TableCell className="font-bold">{row.requests}</TableCell>
                    <TableCell className="font-bold">{row.conversions}</TableCell>
                    <TableCell className="font-semibold text-slate-500">{formatDate(row.date)}</TableCell>
                    <TableCell>
                      <RowActions row={row} onOpenReply={onOpenReply} onEdit={onEdit} onDelete={onDelete} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
              <p className="text-sm font-bold text-slate-900">Nenhuma empresa avaliada ainda.</p>
              <Button asChild className="mt-3 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                <Link href="/companies">Avaliar empresa</Link>
              </Button>
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-11 w-11 border border-slate-100">
                      <AvatarImage src={row.logoUrl || ''} alt={row.name} />
                      <AvatarFallback>{row.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{row.name}</p>
                      <p className="truncate text-xs font-semibold text-slate-500">{row.category}</p>
                    </div>
                  </div>
                  <RowActions row={row} onOpenReply={onOpenReply} onEdit={onEdit} onDelete={onDelete} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>{ratingStars(row.rating)}</div>
                  <Badge variant="outline" className={cn('justify-center rounded-full font-bold', statusClassName(row.status))}>{row.status}</Badge>
                  <p className="font-semibold text-slate-600">{row.views} visualizações</p>
                  <p className="font-semibold text-slate-600">{row.requests} solicitações</p>
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
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(row.reviewId)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
    ['draft', 'pending_otp', 'verified', 'distributed', 'proposal_submitted', 'proposal_processing'].includes(
      lead.status || ''
    )
  ).length;

  return (
    <Card id="opportunities" className="rounded-[20px] border-emerald-100 bg-white shadow-sm">
      <span id="company-replies" className="sr-only" />
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-black text-slate-950">
              Acompanhamento de Propostas e Respostas
            </CardTitle>
            <p className="text-sm font-semibold text-slate-500">
              Suas solicitações vindas de propostas e retornos das empresas em um só lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
              {openLeads} em andamento
            </Badge>
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">
              {answeredLeads + replies.length} respondidas
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {proposalLeads.length === 0 && replies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <Send className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-900">Nenhuma proposta em acompanhamento ainda</p>
            <p className="text-xs font-semibold text-slate-500">
              Quando você solicitar orçamentos, as etapas aparecem aqui com status real da API.
            </p>
            <Button asChild className="mt-4 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700">
              <Link href="/companies">Solicitar proposta</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {proposalLeads.map((lead) => {
              const companyName = getLeadCompanyName(lead);
              const meta = leadStatusMeta(lead.status);

              return (
                <div key={lead.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-11 w-11 border border-slate-100">
                        <AvatarImage src={getLeadCompanyLogo(lead) || ''} alt={companyName} />
                        <AvatarFallback>{initialsFromName(companyName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{companyName}</p>
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {lead.product_vertical || lead.category || 'Energia Solar'} · {formatDate(lead.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('w-fit rounded-full font-bold', meta.className)}>
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
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
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left transition hover:bg-emerald-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-11 w-11 border border-white">
                    <AvatarImage src={row.logoUrl || ''} alt={row.name} />
                    <AvatarFallback>{row.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{row.name}</p>
                    <p className="truncate text-xs font-semibold text-slate-600">
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

function SustainableJourney({ items }: { items: Array<{ id: string; title: string; state: string; progress: number; icon: typeof Sun; tone: string; details: string[] }> }) {
  return (
    <Card id="green-house" className="rounded-[20px] border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black text-slate-950">Jornada Sustentável</CardTitle>
        <Button variant="ghost" className="h-8 rounded-xl text-xs font-bold">
          Ver Green House <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['solar']} className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <AccordionItem key={item.id} value={item.id} className="rounded-2xl border border-slate-100 px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex min-w-0 items-center gap-3 text-left">
                    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', item.tone)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950">{item.title}</span>
                      <span className="block text-xs font-semibold text-slate-500">{item.state}</span>
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Progress value={item.progress} className="mb-3 h-2 bg-slate-100" />
                  <div className="space-y-1 pb-2">
                    {item.details.map((detail) => (
                      <p key={detail} className="text-xs font-semibold text-slate-500">{detail}</p>
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

function Achievements({ achievements }: { achievements: Array<{ title: string; subtitle: string; icon: typeof Trophy; state: string; unlocked: boolean }> }) {
  const AchievementCard = ({ achievement }: { achievement: (typeof achievements)[number] }) => {
    const Icon = achievement.icon;
    return (
      <div className={cn('flex min-h-[128px] flex-col items-center justify-center rounded-2xl border p-3 text-center', achievement.unlocked ? 'border-slate-100 bg-white' : 'border-slate-100 bg-slate-50 opacity-70')}>
        <div className={cn('mb-3 flex h-14 w-14 items-center justify-center rounded-full', achievement.unlocked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
          {achievement.unlocked ? <Icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
        </div>
        <p className="text-xs font-black text-slate-950">{achievement.title}</p>
        <p className="text-[11px] font-semibold text-slate-500">{achievement.subtitle}</p>
        <Badge variant="outline" className="mt-2 rounded-full text-[10px] capitalize">{achievement.state}</Badge>
      </div>
    );
  };

  return (
    <Card id="achievements" className="rounded-[20px] border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black text-slate-950">Conquistas</CardTitle>
        <Button variant="ghost" className="h-8 rounded-xl text-xs font-bold">Ver todas</Button>
      </CardHeader>
      <CardContent>
        <div className="hidden grid-cols-2 gap-3 md:grid">
          {achievements.slice(0, 6).map((achievement) => (
            <AchievementCard key={achievement.title} achievement={achievement} />
          ))}
        </div>
        <div className="md:hidden">
          <Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent>
              {achievements.map((achievement) => (
                <CarouselItem key={achievement.title} className="basis-[68%]">
                  <AchievementCard achievement={achievement} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </CardContent>
    </Card>
  );
}

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
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="rounded-[20px] border-slate-200 bg-white shadow-sm xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-black text-slate-950">Impacto na comunidade</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Visualizações', views],
            ['Solicitações', requests],
            ['Conversões', conversions],
            ['Pessoas impactadas', impactedPeople],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="xl:col-span-2">
        <Tabs defaultValue="30d" className="space-y-3">
          <TabsList className="rounded-2xl bg-white p-1 shadow-sm">
            <TabsTrigger value="7d" className="rounded-xl">7 dias</TabsTrigger>
            <TabsTrigger value="30d" className="rounded-xl">30 dias</TabsTrigger>
            <TabsTrigger value="90d" className="rounded-xl">90 dias</TabsTrigger>
            <TabsTrigger value="12m" className="rounded-xl">12 meses</TabsTrigger>
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

function ActivityFeed({ events }: { events: Array<{ icon: typeof Bell; title: string; time: string }> }) {
  return (
    <Card id="activity-feed" className="rounded-[20px] border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black text-slate-950">Atividade recente</CardTitle>
        <Button variant="ghost" className="h-8 rounded-xl text-xs font-bold">Ver todas</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => {
          const Icon = event.icon;
          return (
            <div key={event.title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{event.title}</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">{event.time}</span>
            </div>
          );
        })}
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
    <Card className="rounded-[20px] border-emerald-100 bg-emerald-50/70 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-black text-emerald-900">Green House Certification</h3>
          <p className="text-sm font-semibold text-emerald-800">Conquiste selos e mostre ao mundo que sua casa é sustentável.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiers.map(([tier, label, unlocked, Icon]) => (
            <div key={tier} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3">
              <span className={cn('flex h-12 w-12 items-center justify-center rounded-full', unlocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400')}>
                {unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
              </span>
              <span>
                <span className="block text-sm font-black text-slate-950">{tier}</span>
                <span className="block text-xs font-semibold text-slate-500">{label}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AiRecommendations({ recommendations }: { recommendations: Array<{ name: string; city: string; rating: number; badge: string }> }) {
  return (
    <Card className="rounded-[20px] border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-black text-slate-950">Recomendações por IA</CardTitle>
          <p className="text-xs font-semibold text-slate-500">Empresas que combinam com seu perfil e região.</p>
        </div>
        <Sparkles className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((company) => (
          <div key={company.name} className="rounded-2xl border border-slate-100 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">{company.name}</p>
                <p className="text-xs font-semibold text-slate-500">{company.city}</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{company.badge}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">{ratingStars(company.rating)}<span className="ml-1 text-xs font-black">{company.rating}</span></div>
              <Button size="sm" className="h-8 rounded-xl bg-emerald-600 text-xs font-bold hover:bg-emerald-700" asChild>
                <Link href="/companies">Avaliar</Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReplyDialog({ row, onOpenChange }: { row: CompanyRow | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Resposta da empresa</DialogTitle>
          <DialogDescription>{row?.name || 'Empresa'} respondeu sua avaliação.</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold leading-relaxed text-slate-700">
            {row?.reply || 'A empresa agradeceu sua avaliação e informou que acompanhará seu atendimento pela plataforma.'}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => toast.success('Resposta compartilhada.')}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => toast.success('Avaliação da resposta registrada.')}>
            <ThumbsUp className="mr-2 h-4 w-4" />
            Avaliar resposta
          </Button>
          <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => toast.info('Fluxo de resposta será conectado ao chat P2P.')}>
            <Send className="mr-2 h-4 w-4" />
            Responder empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
