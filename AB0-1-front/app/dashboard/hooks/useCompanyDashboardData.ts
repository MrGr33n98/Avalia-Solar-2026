'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi, companiesApi } from '@/lib/api';
import { subscribeCompanyDashboard } from '@/lib/cable';

interface DashboardStats {
  profileViews: number;
  ctaClicks: number;
  whatsappClicks: number;
  leadsReceived: number;
  reviewsCount: number;
  averageRating: number;
  pendingApprovals: number;
  activeCampaigns: number;
  conversionRate: number;
}

interface Notification {
  id: string;
  type: 'approval' | 'review' | 'lead' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function useCompanyDashboardData(companyId: string) {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchCompanyData = useCallback(async () => {
    try {
      const data = await companiesApi.getById(Number(companyId));
      if (!data) {
        setCompanyError('Empresa não encontrada ou não associada à sua conta.');
      } else {
        setCompany(data);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setCompanyError('Falha ao carregar dados da empresa.');
    }
  }, [companyId]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const data = await fetchApi<{ stats: any }>('/company_dashboard/stats', {
        params: { company_id: companyId }
      });
      const s = data?.stats || {};
      setStats({
        profileViews: s.profile_views ?? 0,
        ctaClicks: s.cta_clicks ?? 0,
        whatsappClicks: s.whatsapp_clicks ?? 0,
        leadsReceived: s.leads_received ?? 0,
        reviewsCount: s.reviews_count ?? 0,
        averageRating: s.average_rating ?? 0,
        pendingApprovals: s.pending_approvals ?? 0,
        activeCampaigns: s.active_campaigns ?? 0,
        conversionRate: s.conversion_rate ?? 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, [companyId]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await fetchApi<{ notifications: any[] }>('/company_dashboard/notifications', {
        params: { company_id: companyId }
      });
      const list = data?.notifications || [];
      setNotifications(
        list.map((n, idx) => ({
          id: `${n.type}-${n.timestamp ?? idx}-${idx}`,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: new Date(n.timestamp),
          read: !!n.read,
        }))
      );
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [companyId]);

  const refreshData = useCallback(() => {
    fetchDashboardStats();
    fetchNotifications();
  }, [fetchDashboardStats, fetchNotifications]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchCompanyData(),
        fetchDashboardStats(),
        fetchNotifications()
      ]);
      setLoading(false);
    };

    loadAll();

    const unsubscribe = subscribeCompanyDashboard(companyId, () => {
      refreshData();
    });

    return unsubscribe;
  }, [companyId, fetchCompanyData, fetchDashboardStats, fetchNotifications, refreshData]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  return {
    loading,
    company,
    companyError,
    stats,
    notifications,
    markNotificationAsRead,
    refreshData
  };
}
