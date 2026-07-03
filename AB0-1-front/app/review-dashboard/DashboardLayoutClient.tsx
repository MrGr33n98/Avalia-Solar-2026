'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { reviewsApi, leadsApi, reviewDashboardApi, Review, Lead } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import { toast } from 'sonner';
import { MobileDashboardNav } from './Navigation';
import { ReviewerProfileCard } from '@/components/dashboard/ReviewerProfileCard';
import { OnboardingBar } from '@/components/dashboard/OnboardingBar';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Plus, MessageCircle, Trophy, UserRound } from 'lucide-react';
import { deriveAchievementStatuses } from '@/config/achievements';
import type { UserSolution } from '@/components/profile/UserSolutionChip';

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
  sustainable_journey?: Array<{
    id: string;
    title: string;
    state: string;
    progress: number;
    details: string[];
  }>;
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
      achievements: [],
    },
    impact: {
      helpful_votes: 0,
      impacted_people: 0,
    },
    recommendations: [],
    recent_activities: [],
    profile: {
      completion_percent: 45,
    },
    charts: {
      activity_30d: activity,
    },
    sustainable_journey: [
      {
        id: 'solar',
        title: 'Energia Solar',
        state: 'Não iniciado',
        progress: 0,
        details: ['Sem avaliações ainda'],
      },
      {
        id: 'mobility',
        title: 'Mobilidade Elétrica',
        state: 'Não iniciado',
        progress: 0,
        details: ['Sem propostas na área'],
      },
      {
        id: 'battery',
        title: 'Bateria / Armazenamento',
        state: 'Não iniciado',
        progress: 0,
        details: ['Sem propostas na área'],
      },
      {
        id: 'consumption',
        title: 'Consumo Consciente',
        state: 'Não iniciado',
        progress: 0,
        details: ['Perfil 0% preenchido'],
      },
    ],
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
  unlockedBadgeIds?: string[];
  solutions: UserSolution[];
  addSolution: (sol: UserSolution) => void;
  removeSolution: (id: string) => void;
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

  const [commandOpen, setCommandOpen] = useState(false);
  const [solutions, setSolutions] = useState<UserSolution[]>([]);
  const [isLinkedInVerified, setIsLinkedInVerified] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setSolutions([]);
      setIsLinkedInVerified(false);
      return;
    }

    const cachedSolutions = localStorage.getItem(`reviewer_solutions_${user.id}`);
    if (cachedSolutions) {
      try {
        const parsedSolutions: unknown = JSON.parse(cachedSolutions);
        setSolutions(Array.isArray(parsedSolutions) ? parsedSolutions : []);
      } catch (error) {
        console.error('[ReviewDashboard] Invalid cached solutions', error);
        setSolutions([]);
      }
    } else {
      setSolutions([]);
    }

    const cachedPrivacy = localStorage.getItem(`reviewer_privacy_${user.id}`);
    if (cachedPrivacy) {
      try {
        const parsedPrivacy = JSON.parse(cachedPrivacy) as { publicProfile?: boolean };
        setIsLinkedInVerified(Boolean(parsedPrivacy.publicProfile));
      } catch (error) {
        console.error('[ReviewDashboard] Invalid cached privacy settings', error);
        setIsLinkedInVerified(false);
      }
    } else {
      setIsLinkedInVerified(false);
    }
  }, [user]);

  const addSolution = useCallback(
    (newSolution: UserSolution) => {
      if (!user) return;
      setSolutions((previousSolutions) => {
        if (previousSolutions.some((solution) => solution.id === newSolution.id)) {
          toast.error('Esta solução já está cadastrada.');
          return previousSolutions;
        }
        const updatedSolutions = [...previousSolutions, newSolution];
        localStorage.setItem(`reviewer_solutions_${user.id}`, JSON.stringify(updatedSolutions));
        return updatedSolutions;
      });
    },
    [user]
  );

  const removeSolution = useCallback(
    (id: string) => {
      if (!user) return;
      setSolutions((previousSolutions) => {
        const updatedSolutions = previousSolutions.filter((solution) => solution.id !== id);
        localStorage.setItem(`reviewer_solutions_${user.id}`, JSON.stringify(updatedSolutions));
        return updatedSolutions;
      });
    },
    [user]
  );

  if (authLoading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || user.role !== 'review') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md text-center">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Acesso Restrito</h2>
          <p className="mb-6 text-slate-600">
            Você não tem acesso à Central de Reputação. Faça login com uma conta de Especialista
            Solar.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-none bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Fazer login novamente
          </button>
        </div>
      </div>
    );
  }

  const greenScore = summary?.gamification?.green_score ?? 0;
  const companyReplies = reviews.filter((r) => r.reply || r.replied_at);

  const hasSolarSolution = solutions.some((s) => s.category.toLowerCase().includes('solar'));
  const hasEVSolution = solutions.some(
    (s) =>
      s.category.toLowerCase().includes('mobilidade') ||
      s.category.toLowerCase().includes('bateria')
  );
  const solarSolutionsCount = solutions.filter((s) =>
    s.category.toLowerCase().includes('solar')
  ).length;

  const hasSolarReview = reviews.some((r) =>
    (r.category_name || '').toLowerCase().includes('solar')
  );
  const hasMobilityReview = reviews.some(
    (r) =>
      (r.category_name || '').toLowerCase().includes('mobilidade') ||
      (r.category_name || '').toLowerCase().includes('elétric')
  );

  // Calcula completude do perfil
  const baseCompletion = user
    ? (user.name ? 50 : 0) + (user.email ? 15 : 0) + (user.phone ? 10 : 0)
    : 75;
  const locationCompletion = user?.city && user?.state ? 5 : 0;
  const avatarCompletion = user?.avatar_url ? 10 : 0;
  const solutionsCompletion = solutions.length > 0 ? Math.min(solutions.length * 5, 10) : 0;
  const profileCompletion = Math.min(
    baseCompletion + locationCompletion + avatarCompletion + solutionsCompletion,
    100
  );

  const achievementStatuses = deriveAchievementStatuses({
    reviewsCount: Math.max(reviews.length, solarSolutionsCount >= 3 ? 3 : 0),
    profileCompletionPercent: profileCompletion,
    helpfulVotes: summary?.impact?.helpful_votes ?? 0,
    greenScore,
    hasSolarReview: hasSolarReview || hasSolarSolution,
    hasMobilityReview: hasMobilityReview || hasEVSolution,
    hasEVSolution,
    isLinkedInVerified,
  });

  const unlockedBadgeIds = achievementStatuses
    .filter((s) => s.unlocked)
    .map((s) => s.achievementId);

  return (
    <DashboardContext.Provider
      value={{
        summary,
        reviews,
        leads,
        loading,
        refreshing,
        error,
        onRefresh: () => fetchDashboardData(true),
        unlockedBadgeIds,
        solutions,
        addSolution,
        removeSolution,
      }}
    >
      <div className="review-dashboard-enterprise min-h-screen w-full overflow-x-hidden bg-[#F6F7F9] text-slate-950 dark:bg-[#020617]">
        {/* Barra de Onboarding com gradiente */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <OnboardingBar profileCompletion={profileCompletion} reviewsCount={reviews.length} />
        </div>

        {/* Shell Principal do Dashboard em Duas Colunas */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
          {/* Coluna Esquerda: Profile Card / Menu lateral */}
          <aside className="hidden lg:block">
            <div className="sticky top-[88px]">
              <ReviewerProfileCard
                profileCompletion={profileCompletion}
                greenScore={greenScore}
                unlockedBadgeIds={unlockedBadgeIds}
              />
            </div>
          </aside>

          {/* Coluna Direita: Conteúdo Principal */}
          <main className="min-w-0 flex flex-col gap-6">{children}</main>
        </div>

        <MobileDashboardNav repliesCount={companyReplies.length} />

        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Buscar ações, empresas e seções..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Ações rápidas">
              {[
                { label: 'Avaliar empresa', href: '/companies', icon: Plus },
                {
                  label: 'Ver respostas das empresas',
                  href: '/review-dashboard#company-replies',
                  icon: MessageCircle,
                },
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
