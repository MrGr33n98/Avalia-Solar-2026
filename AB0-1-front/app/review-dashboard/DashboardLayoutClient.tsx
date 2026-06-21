'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { reviewsApi, leadsApi, reviewDashboardApi, Review, Lead, User } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import { toast } from 'sonner';
import { DesktopSidebar, MobileDrawer, MobileDashboardNav, Header } from './Navigation';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Plus, MessageCircle, Trophy, UserRound } from 'lucide-react';

export interface ReviewDashboardSummary {
  kpis?: {
    estimated_savings?: number;
    quotes_total: number;
    quotes_open: number;
    quotes_replied: number;
    reviews_published: number;
  };
  gamification?: {
    green_score: number;
    regional_ranking: number;
    achievements: Array<{
      title: string;
      subtitle: string;
      state: string;
    }>;
  };
  impact?: {
    helpful_votes: number;
    impacted_people: number;
  };
  recommendations?: Array<{
    name: string;
    city: string;
    rating: number;
    badge: string;
  }>;
  recent_activities?: Array<{
    icon: string;
    title: string;
    time: string;
  }>;
  profile?: {
    completion_percent?: number;
  };
  charts?: {
    activity_30d?: Array<{
      date: string;
      profile_views: number;
      whatsapp_clicks: number;
      cta_clicks: number;
    }>;
  };
}

export function emptySummary(): ReviewDashboardSummary {
  const today = new Date();
  const activity = Array.from({ length: 31 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (30 - index));

    return {
      date: date.toISOString().slice(0, 10),
      profile_views: 0,
      whatsapp_clicks: 0,
      cta_clicks: 0,
    };
  });

  return {
    kpis: {
      estimated_savings: 0,
      quotes_total: 0,
      quotes_open: 0,
      quotes_replied: 0,
      reviews_published: 0,
    },
    gamification: {
      green_score: 520,
      regional_ranking: 1,
      achievements: []
    },
    impact: {
      helpful_votes: 0,
      impacted_people: 0
    },
    recommendations: [],
    recent_activities: [],
    profile: {
      completion_percent: 45
    },
    charts: {
      activity_30d: activity
    }
  };
}

type ApiListResponse<T> = T[] | { data?: T[] };
function normalizeApiList<T>(response: ApiListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return Array.isArray(response.data) ? response.data : [];
}

interface DashboardContextType {
  summary: ReviewDashboardSummary | null;
  reviews: Review[];
  leads: Lead[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboardContext() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboardContext must be used within DashboardLayoutClient');
  return ctx;
}

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [summary, setSummary] = useState<ReviewDashboardSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [summaryRes, reviewsRes, leadsRes] = await Promise.allSettled([
          reviewDashboardApi.getSummary(),
          reviewsApi.getAll({ mine: true, limit: 100 }),
          leadsApi.mine(),
        ]);

        const failures = [];

        if (summaryRes.status === 'fulfilled') {
          const apiSummary = summaryRes.value;
          setSummary({
            ...emptySummary(),
            ...apiSummary,
          } as ReviewDashboardSummary);
        } else {
          console.warn('[ReviewDashboard] Summary unavailable', summaryRes.reason);
          setSummary(emptySummary());
          failures.push('summary');
        }

        if (reviewsRes.status === 'fulfilled') {
          setReviews(
            normalizeApiList(reviewsRes.value as ApiListResponse<Review>).sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        } else {
          console.warn('[ReviewDashboard] Reviews unavailable', reviewsRes.reason);
          setReviews([]);
          failures.push('reviews');
        }

        if (leadsRes.status === 'fulfilled') {
          setLeads(
            normalizeApiList(leadsRes.value as ApiListResponse<Lead>).sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        } else {
          console.warn('[ReviewDashboard] Leads unavailable', leadsRes.reason);
          setLeads([]);
          failures.push('leads');
        }

        if (failures.length === 3) {
          setError('Não foi possível carregar os dados do painel agora.');
        }

        if (isRefresh) {
          if (failures.length > 0) {
            toast.warning('Painel atualizado parcialmente.');
          } else {
            toast.success('Painel atualizado com sucesso!');
          }
          track('review_dashboard_refresh', { user_id: user?.id });
        }
      } catch (err: unknown) {
        console.error('[ReviewDashboard] Failed to load data', err);
        const apiError = err as { status?: number; message?: string };
        if (apiError.status === 401) {
          setIsRedirecting(true);
          router.push(
            `/login?redirect=${encodeURIComponent('/review-dashboard')}&error=session_expired`
          );
          return;
        }

        const errorMessage = apiError.message || 'Não foi possível carregar os dados do painel.';
        setError(errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, router]
  );

  useEffect(() => {
    if (authLoading || isRedirecting) return;
    if (user?.role !== 'review') return;
    fetchDashboardData();
  }, [user, authLoading, isRedirecting, fetchDashboardData]);

  if (authLoading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user || user.role !== 'review') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md text-center">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Acesso Restrito</h2>
          <p className="mb-6 text-slate-600">
            Você não tem acesso à Central de Reputação. Faça login com uma conta de Especialista Solar.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700"
          >
            Fazer login novamente
          </button>
        </div>
      </div>
    );
  }

  const greenScore = summary?.gamification?.green_score ?? 0;
  const companyReplies = reviews.filter((r) => r.reply || r.replied_at);
  const activityEvents = summary?.recent_activities || [];
  const firstName = user.name?.split(' ')[0] || 'Usuário';

  return (
    <DashboardContext.Provider value={{ summary, reviews, leads, loading, refreshing, error, onRefresh: () => fetchDashboardData(true) }}>
      <div className="flex min-h-screen w-full bg-slate-50">
        <DesktopSidebar repliesCount={companyReplies.length} notificationsCount={activityEvents.length} />

        <div className="flex flex-1 flex-col lg:pl-[280px]">
          <Header
            firstName={firstName}
            user={user as User & { avatar_url?: string }}
            greenScore={greenScore}
            notificationsCount={activityEvents.length}
            refreshing={refreshing}
            onRefresh={() => fetchDashboardData(true)}
            onOpenCommand={() => setCommandOpen(true)}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />

          <main className="flex-1">
            {children}
          </main>
        </div>

        <MobileDashboardNav repliesCount={companyReplies.length} />
        <MobileDrawer open={mobileNavOpen} onOpenChange={setMobileNavOpen} repliesCount={companyReplies.length} notificationsCount={activityEvents.length} />

        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Buscar ações, empresas e seções..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Ações rápidas">
              {[
                { label: 'Avaliar empresa', href: '/companies', icon: Plus },
                { label: 'Ver respostas das empresas', href: '/review-dashboard#company-replies', icon: MessageCircle },
                { label: 'Abrir conquistas', href: '/review-dashboard#achievements', icon: Trophy },
                { label: 'Completar perfil', href: '/review-dashboard/profile', icon: UserRound },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.label}
                    onSelect={() => {
                      setCommandOpen(false);
                      if (item.href.includes('#')) {
                        const path = item.href.split('#')[0];
                        const hash = '#' + item.href.split('#')[1];
                        if (pathname === path) {
                          document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          router.push(item.href);
                        }
                      } else {
                        router.push(item.href);
                      }
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </DashboardContext.Provider>
  );
}
