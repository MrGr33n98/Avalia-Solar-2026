'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Award, Zap, Target, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';
import { fetchApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface UniqueOverviewTabProps {
  companyId: string;
}

const motivationalMessages = [
  'Sua empresa está brilhando! 🚀',
  'Performance excepcional continua! 🌟',
  'Continue monitorando sua posição! 🏆',
  'Crescimento em análise! 📈',
  'Liderança consolidada! 👑',
];

interface OverviewData {
  views_30d?: number;
  leads_30d?: number;
  conversion_rate?: number;
  is_premium_analytics?: boolean;
}

interface RankingData {
  rank_position?: number | null;
  ranking_score?: number | null;
  is_premium_analytics?: boolean;
}

interface TrustData {
  trust_score?: number | null;
  health_status?: string;
}

export default function UniqueOverviewTab({ companyId }: UniqueOverviewTabProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Carrega dados reais da empresa — REQ-003
  const overviewQuery = useQuery<OverviewData>({
    queryKey: ['company-dashboard-overview', companyId],
    queryFn: () =>
      fetchApi<OverviewData>('/company_dashboard/analytics/overview', {
        params: { company_id: companyId },
      }),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const rankingQuery = useQuery<RankingData>({
    queryKey: ['company-dashboard-ranking', companyId],
    queryFn: () =>
      fetchApi<RankingData>('/company_dashboard/analytics/ranking', {
        params: { company_id: companyId },
      }),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
  });

  const trustQuery = useQuery<TrustData>({
    queryKey: ['company-trust-health', companyId],
    queryFn: () =>
      fetchApi<TrustData>('/company_dashboard/trust_health', {
        params: { company_id: companyId },
      }),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % motivationalMessages.length);
        setIsVisible(true);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const isLoading =
    overviewQuery.isLoading || rankingQuery.isLoading || trustQuery.isLoading;

  const trustScore = trustQuery.data?.trust_score;
  const rankPosition = rankingQuery.data?.rank_position;
  const rankingScore = rankingQuery.data?.ranking_score;
  const conversionRate = overviewQuery.data?.conversion_rate;
  const isPremium = overviewQuery.data?.is_premium_analytics;

  // Métricas reais — REQ-003: companyId usado em chamadas de API reais
  const metrics = [
    {
      title: 'Trust Score',
      value:
        isLoading
          ? null
          : trustScore != null
            ? `${trustScore}%`
            : '—',
      icon: Award,
      change: trustQuery.data?.health_status ?? undefined,
      changeType:
        (trustQuery.data?.health_status === 'excellent' ||
          trustQuery.data?.health_status === 'good')
          ? ('positive' as const)
          : ('neutral' as const),
      color: 'brand-blue',
    },
    {
      title: 'Posição no Ranking',
      value:
        isLoading
          ? null
          : rankPosition != null
            ? `#${rankPosition}`
            : isPremium === false
              ? '—'
              : '—',
      icon: Target,
      change:
        rankingQuery.data?.is_premium_analytics === false
          ? 'Upgrade para ver'
          : undefined,
      changeType: 'neutral' as const,
      color: 'brand-green',
    },
    {
      title: 'Conversão 30d',
      value:
        isLoading
          ? null
          : conversionRate != null
            ? `${conversionRate}%`
            : isPremium === false
              ? '—'
              : '—',
      icon: Zap,
      change:
        overviewQuery.data?.is_premium_analytics === false
          ? 'Upgrade para ver'
          : undefined,
      changeType: 'neutral' as const,
      color: 'brand-yellow',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Unique Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[3rem] clay-card p-12 bg-gradient-to-br from-brand-blue/10 via-brand-cyan/5 to-brand-purple/10 border-2 border-white/10"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute top-10 right-10 w-32 h-32 bg-brand-blue/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              rotate: -360,
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
              scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute bottom-10 left-10 w-24 h-24 bg-brand-purple/20 rounded-full blur-xl"
          />
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center shadow-2xl shadow-brand-blue/30">
              <Star className="h-8 w-8 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple bg-clip-text text-transparent">
                Bem-vindo ao seu Comando Central
              </h1>
              <p className="text-lg text-muted-foreground/80 font-medium">
                Seu dashboard personalizado de performance e estratégia
              </p>
            </div>
          </motion.div>

          {/* Rotating Motivational Message */}
          <AnimatePresence mode="wait">
            {isVisible && (
              <motion.div
                key={currentMessage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center py-6"
              >
                <p className="text-2xl font-black text-brand-blue dark:text-brand-cyan">
                  {motivationalMessages[currentMessage]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Metrics Grid — dados reais via API */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="clay-card p-6 rounded-2xl space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          : metrics.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.5 }}
              >
                <MetricCard
                  title={metric.title}
                  value={metric.value ?? '—'}
                  icon={metric.icon}
                  change={metric.change}
                  changeType={metric.changeType}
                  color={metric.color}
                />
              </motion.div>
            ))}
      </div>

      {/* Achievement Section — condicional em dados reais */}
      {!isLoading && trustScore != null && trustScore >= 70 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="clay-card p-8 bg-gradient-to-r from-emerald-500/10 to-brand-green/10 border-2 border-emerald-500/20"
        >
          <div className="flex items-center gap-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-brand-green flex items-center justify-center shadow-xl"
            >
              <Award className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                🎯 Trust Score Consolidado!
              </h3>
              <p className="text-muted-foreground font-medium">
                Seu trust score atual é <strong>{trustScore}%</strong>. Continue coletando reviews e mantendo
                o perfil atualizado para subir no ranking.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}