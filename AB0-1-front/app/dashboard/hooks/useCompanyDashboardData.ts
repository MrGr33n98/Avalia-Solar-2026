'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchApi, companiesApi, FeatureAccessEntry } from '@/lib/api';
import { subscribeCompanyDashboard } from '@/lib/cable';

type RealtimeSubscription =
  | (() => void)
  | {
      unsubscribe?: () => void;
    }
  | null
  | undefined;

const cleanupRealtimeSubscription = (subscription: RealtimeSubscription) => {
  if (!subscription) return;
  if (typeof subscription === 'function') {
    subscription();
    return;
  }
  if (typeof subscription.unsubscribe === 'function') {
    subscription.unsubscribe();
  }
};

interface DashboardStats {
  profileViews: number;
  ctaClicks: number;
  whatsappClicks: number;
  leadsReceived: number;
  marketplace_potential?: {
    leads_in_category: number;
    leads_in_region: number;
    market_share_percent: number;
  };
  active_categories?: Array<{
    id: number;
    name: string;
    leads_in_category: number;
  }>;
  reviewsCount: number;
  pendingReviewsCount: number;
  averageRating: number;
  pendingApprovals: number;
  activeCampaigns: number;
  conversionRate: number;
  leads_count?: number;
  monthly_views?: number[];
}

interface Notification {
  id: string;
  type: 'approval' | 'review' | 'lead' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Janela para agrupar rajadas de eventos realtime num único refresh (D0 H02)
export const REALTIME_REFRESH_DEBOUNCE_MS = 400;

const toSafeDate = (value: unknown): Date => {
  if (!value) return new Date();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export function useCompanyDashboardData(companyId: string) {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [featureAccess, setFeatureAccess] = useState<Record<string, FeatureAccessEntry>>({});
  const [featureAccessLoading, setFeatureAccessLoading] = useState(true);
  const [featureAccessError, setFeatureAccessError] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);
  const [nextBestActions, setNextBestActions] = useState<any[]>([]);

  // Empresa cujas respostas ainda podem ser aplicadas. Respostas de outra
  // empresa (troca A→B) ou após unmount são descartadas (D0 H03).
  const activeCompanyRef = useRef<string | null>(companyId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCurrent = useCallback((requestCompanyId: string) => activeCompanyRef.current === requestCompanyId, []);

  const fetchCompanyData = useCallback(async (signal?: AbortSignal) => {
    try {
      console.debug('[CompanyDashboardData] Fetching company data', { companyId });
      if (signal?.aborted || !isCurrent(companyId)) return;

      const data = await companiesApi.getById(Number(companyId), { signal });
      if (signal?.aborted || !isCurrent(companyId)) return;
      if (!data) {
        console.warn('[CompanyDashboardData] Company not found for dashboard user', { companyId });
        setCompanyError('Empresa nao encontrada ou nao associada a sua conta.');
      } else {
        setCompany(data);
      }
    } catch (error: any) {
      if (signal?.aborted || !isCurrent(companyId) || error?.name === 'AbortError') return;
      console.error('[CompanyDashboardData] Error fetching company', {
        companyId,
        endpoint: '/companies/:id',
        error,
      });
      setCompanyError('Falha ao carregar dados da empresa.');
    }
  }, [companyId, isCurrent]);

  const fetchDashboardStats = useCallback(async (signal?: AbortSignal) => {
    setStatsLoading(true);
    try {
      console.debug('[CompanyDashboardData] Fetching dashboard stats', { companyId });
      if (signal?.aborted || !isCurrent(companyId)) return;

      const data = await fetchApi<{
        stats: any;
        plan_features?: Record<string, any>;
        feature_access?: Record<string, FeatureAccessEntry>;
        health?: any;
        next_best_actions?: any[];
      }>('/company_dashboard/stats', {
        params: { company_id: companyId },
        signal,
      });
      if (signal?.aborted || !isCurrent(companyId)) return;
      const s = data?.stats || {};

      setStats({
        profileViews: s.profile_views ?? 0,
        ctaClicks: s.cta_clicks ?? 0,
        whatsappClicks: s.whatsapp_clicks ?? 0,
        leadsReceived: s.leads_received ?? 0,
        marketplace_potential: s.marketplace_potential,
        active_categories: s.active_categories,
        reviewsCount: s.reviews_count ?? 0,
        pendingReviewsCount: s.pending_reviews_count ?? 0,
        averageRating: s.average_rating ?? 0,
        pendingApprovals: s.pending_approvals ?? 0,
        activeCampaigns: s.active_campaigns ?? 0,
        conversionRate: s.conversion_rate ?? 0,
        leads_count: s.leads_count ?? 0,
        monthly_views: s.monthly_views ?? [],
      });
      setHealth(data?.health || null);
      setNextBestActions(data?.next_best_actions || []);
    } catch (error: any) {
      if (signal?.aborted || !isCurrent(companyId) || error?.name === 'AbortError') return;
      console.error('[CompanyDashboardData] Error fetching dashboard stats', {
        companyId,
        endpoint: '/company_dashboard/stats',
        error,
      });
    } finally {
      if (!signal?.aborted && isCurrent(companyId)) setStatsLoading(false);
    }
  }, [companyId, isCurrent]);

  const fetchFeatureAccess = useCallback(async (noCache = false, signal?: AbortSignal) => {
    setFeatureAccessLoading(true);
    setFeatureAccessError(false);
    try {
      console.debug('[CompanyDashboardData] Fetching canonical feature access', { companyId });
      if (signal?.aborted || !isCurrent(companyId)) return;

      const data = await companiesApi.getFeatureAccess(companyId, noCache, { signal });
      if (signal?.aborted || !isCurrent(companyId)) return;
      setFeatureAccess(data?.features || {});
    } catch (error: any) {
      if (signal?.aborted || !isCurrent(companyId) || error?.name === 'AbortError') return;
      console.error('[CompanyDashboardData] Error fetching feature access', {
        companyId,
        endpoint: '/companies/:id/feature_access',
        error,
      });
      setFeatureAccess({});
      setFeatureAccessError(true);
    } finally {
      if (!signal?.aborted && isCurrent(companyId)) setFeatureAccessLoading(false);
    }
  }, [companyId, isCurrent]);

  const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
    setNotificationsLoading(true);
    try {
      console.debug('[CompanyDashboardData] Fetching dashboard notifications', { companyId });
      if (signal?.aborted || !isCurrent(companyId)) return;

      const data = await fetchApi<{ notifications: any[] }>('/company_dashboard/notifications', {
        params: { company_id: companyId },
        signal,
      });
      if (signal?.aborted || !isCurrent(companyId)) return;
      const list = data?.notifications || [];

      setNotifications(
        list.map((n, idx) => ({
          id: `${n.type}-${n.timestamp ?? idx}-${idx}`,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: toSafeDate(n.timestamp),
          read: !!n.read,
        }))
      );
    } catch (error: any) {
      if (signal?.aborted || !isCurrent(companyId) || error?.name === 'AbortError') return;
      console.error('[CompanyDashboardData] Error fetching notifications', {
        companyId,
        endpoint: '/company_dashboard/notifications',
        error,
      });
    } finally {
      if (!signal?.aborted && isCurrent(companyId)) setNotificationsLoading(false);
    }
  }, [companyId, isCurrent]);

  const refreshData = useCallback(() => {
    fetchDashboardStats();
    fetchFeatureAccess(true);
    fetchNotifications();
  }, [fetchDashboardStats, fetchFeatureAccess, fetchNotifications]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeCompanyRef.current = companyId;

    setCompany(null);
    setCompanyError(null);
    setStats(null);
    setNotifications([]);
    setFeatureAccess({});
    setFeatureAccessLoading(true);
    setFeatureAccessError(false);
    setHealth(null);
    setNextBestActions([]);

    const loadAll = async () => {
      setLoading(true);
      setStatsLoading(true);
      setNotificationsLoading(true);

      // 1. Etapa Crítica: Empresa e Acesso a Funcionalidades liberam o shell imediatamente
      const criticalPromise = Promise.all([
        fetchCompanyData(controller.signal),
        fetchFeatureAccess(false, controller.signal),
      ]);

      // 2. Etapa Progressiva: Métricas e Notificações rodam independentemente
      const secondaryPromise = Promise.allSettled([
        fetchDashboardStats(controller.signal),
        fetchNotifications(controller.signal),
      ]);

      // Desbloqueia o shell assim que a etapa crítica terminar
      await criticalPromise;
      if (!controller.signal.aborted && isCurrent(companyId)) setLoading(false);

      // Aguarda as secundárias sem travar a interface
      await secondaryPromise;
    };

    loadAll();

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const subscription = subscribeCompanyDashboard(companyId, () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        refreshData();
      }, REALTIME_REFRESH_DEBOUNCE_MS);
    });

    return () => {
      controller.abort();
      activeCompanyRef.current = null;
      if (refreshTimer) clearTimeout(refreshTimer);
      cleanupRealtimeSubscription(subscription);
    };
  }, [companyId, fetchCompanyData, fetchDashboardStats, fetchFeatureAccess, fetchNotifications, refreshData, isCurrent]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return {
    loading,
    statsLoading,
    notificationsLoading,
    company,
    companyError,
    stats,
    featureAccess,
    featureAccessLoading,
    featureAccessError,
    notifications,
    markNotificationAsRead,
    refreshData,
    health,
    nextBestActions,
  };
}
