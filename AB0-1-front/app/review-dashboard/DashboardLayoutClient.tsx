'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  reviewsApi,
  leadsApi,
  reviewDashboardApi,
  reviewerSolutionsApi,
  Review,
  Lead,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics/lazy';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Plus, MessageCircle, Trophy, UserRound } from 'lucide-react';
import type { UserSolution } from '@/components/profile/UserSolutionChip';
import { canAccessReviewDashboard } from '@/lib/auth/role-access';

export interface ReviewDashboardSummary {
  meta?: {
    schema_version?: number;
    generated_at?: string;
    request_id?: string;
    partial?: boolean;
    stale_sections?: string[];
    duration_ms?: number;
  };
  kpis?: {
    reviews?: {
      total?: number | null;
      published?: number | null;
      pending?: number | null;
      rejected?: number | null;
    };
    estimated_savings?: number;
    quotes_total: number | null;
    quotes_open: number | null;
    quotes_replied: number | null;
    reviews_published: number | null;
  };
  gamification?: {
    green_score: number | null;
    regional_ranking: number | null;
    earned_points?: number;
    achievements: Array<{
      id?: string;
      title: string;
      subtitle: string;
      description?: string;
      state: string;
      unlocked?: boolean;
      progress?: number | null;
      target?: number | null;
      unlocked_at?: string | null;
    }>;
    level?: {
      key: string;
      name: string;
      next: string | null;
      progress: number;
      threshold: number;
    } | null;
  };
  impact?: {
    helpful_votes: number | null;
    impacted_people: number | null;
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
    items?: Array<{ key: string; label: string; completed: boolean }>;
    missing_fields?: string[];
  };
  charts?: {
    activity_30d?: Array<{
      date: string;
      profile_views: number | null;
      whatsapp_clicks: number | null;
      cta_clicks: number | null;
    }> | null;
  };
  sustainable_journey?: Array<{
    id: string;
    title: string;
    state: string;
    progress: number;
    details: string[];
  }>;
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
  solutionsLoading: boolean;
  solutionsError: string | null;
  addSolution: (sol: UserSolution) => Promise<void>;
  removeSolution: (id: string) => Promise<void>;
  removingSolutionId: string | null;
  summaryLoading: boolean;
  reviewsLoading: boolean;
  reviewsError: string | null;
  leadsLoading: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboardContext() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboardContext must be used within DashboardLayoutClient');
  return ctx;
}

export function useOptionalDashboardContext() {
  return useContext(DashboardContext);
}

/**
 * Pure data provider without layout UI.
 * Used by the new ReviewerDashboardShell architecture.
 */
export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
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
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const [commandOpen, setCommandOpen] = useState(false);
  const [solutions, setSolutions] = useState<UserSolution[]>([]);
  const [solutionsLoading, setSolutionsLoading] = useState(true);
  const [solutionsError, setSolutionsError] = useState<string | null>(null);
  const [removingSolutionId, setRemovingSolutionId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const loadSummary = async () => {
        setSummaryLoading(true);
        try {
          setSummary((await reviewDashboardApi.getSummary()) as ReviewDashboardSummary);
          setError(null);
        } catch (err) {
          console.warn('[ReviewDashboard] Summary unavailable', err);
          setError('Não foi possível carregar o resumo do dashboard.');
        } finally {
          setSummaryLoading(false);
        }
      };
      const loadReviews = async () => {
        setReviewsLoading(true);
        setReviewsError(null);
        try {
          if (pathname === '/review-dashboard') {
            setReviews([]);
            return;
          }
          const response = await reviewsApi.listMine({ per_page: 20 });
          setReviews(
            response.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        } catch (err) {
          const apiError = err instanceof ApiError ? err : (err as { status?: number });
          const status = apiError.status;
          setReviewsError(
            status === 403
              ? 'Você não tem autorização para carregar suas avaliações.'
              : 'Não foi possível carregar suas avaliações.'
          );
          track('review_dashboard_reviews_load_failed', {
            status: status ?? 'unknown',
            endpoint: '/reviews/mine',
            user_id: user.id,
          });
          if (status === 401) {
            setIsRedirecting(true);
            router.push(
              `/login?redirect=${encodeURIComponent('/review-dashboard/reviews')}&error=session_expired`
            );
          }
        } finally {
          setReviewsLoading(false);
        }
      };
      const loadLeads = async () => {
        setLeadsLoading(true);
        try {
          if (pathname === '/review-dashboard') {
            setLeads([]);
            return;
          }
          const response = await leadsApi.mine();
          setLeads(
            normalizeApiList(response as ApiListResponse<Lead>).sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        } catch (err) {
          console.warn('[ReviewDashboard] Leads unavailable', err);
        } finally {
          setLeadsLoading(false);
        }
      };

      void Promise.all([loadSummary(), loadReviews(), loadLeads()])
        .then(() => {
          if (isRefresh) {
            toast.success('Painel atualizado.');
            track('review_dashboard_refresh', { user_id: user.id });
          }
        })
        .catch((err: unknown) => {
          const apiError = err as { status?: number };
          if (apiError.status === 401) {
            setIsRedirecting(true);
            router.push(
              `/login?redirect=${encodeURIComponent('/review-dashboard')}&error=session_expired`
            );
          }
        })
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [user, router, pathname]
  );

  useEffect(() => {
    if (authLoading || isRedirecting) return;
    if (!canAccessReviewDashboard(user?.role)) return;
    fetchDashboardData();
  }, [user, authLoading, isRedirecting, fetchDashboardData]);

  useEffect(() => {
    if (pathname === '/review-dashboard' && window.location.hash === '#reviews') {
      router.replace('/review-dashboard/reviews');
    }
  }, [pathname, router]);

  useEffect(() => {
    if (!user) {
      setSolutions([]);
      setSolutionsLoading(false);
      return;
    }

    void (async () => {
      setSolutionsLoading(true);
      setSolutionsError(null);
      try {
        const response = await reviewerSolutionsApi.list();
        const data = Array.isArray(response)
          ? response
          : (response as { data?: UserSolution[] }).data || [];
        setSolutions(data);
      } catch (error) {
        console.error('[ReviewDashboard] Solutions unavailable', error);
        setSolutionsError('Não foi possível carregar suas soluções.');
      } finally {
        setSolutionsLoading(false);
      }
    })();
  }, [user]);

  const addSolution = useCallback(
    async (newSolution: UserSolution) => {
      if (!user) return;
      try {
        const response = await reviewerSolutionsApi.create({
          name: newSolution.name,
          solution_type: newSolution.type,
          category: newSolution.category,
          company_id: newSolution.companyId,
        });
        const created = response as UserSolution;
        setSolutions((previous) =>
          previous.some((item) => item.id === created.id) ? previous : [...previous, created]
        );
        toast.success('Solução adicionada com sucesso!');
      } catch {
        toast.error('Não foi possível adicionar solução.');
      }
    },
    [user]
  );

  const removeSolution = useCallback(async (id: string) => {
    setRemovingSolutionId(id);
    try {
      await reviewerSolutionsApi.remove(id);
      setSolutions((previous) => previous.filter((solution) => solution.id !== id));
    } catch {
      toast.error('Não foi possível remover solução.');
    } finally {
      setRemovingSolutionId(null);
    }
  }, []);

  if (authLoading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !canAccessReviewDashboard(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md text-center">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Acesso Restrito</h2>
          <p className="mb-6 text-slate-600">
            Você não tem acesso a esta área com a conta atual. Entre novamente com uma conta
            autorizada.
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

  const achievementStatuses = (summary?.gamification?.achievements ?? []).map(
    (achievement, index) => ({
      achievementId: achievement.title || `achievement-${index}`,
      unlocked: achievement.state !== 'bloqueado',
      unlockedAt: undefined,
      progressCurrent: achievement.state !== 'bloqueado' ? 1 : 0,
      progressTarget: 1,
    })
  );
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
        solutionsLoading,
        solutionsError,
        addSolution,
        removeSolution,
        removingSolutionId,
        summaryLoading,
        reviewsLoading,
        reviewsError,
        leadsLoading,
      }}
    >
      {children}

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
    </DashboardContext.Provider>
  );
}
