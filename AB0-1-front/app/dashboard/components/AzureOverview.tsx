'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Activity,
  BarChart2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AdvancedAnalytics from './AdvancedAnalytics';

interface MetricCardProps {
  metric: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  };
  index: number;
  themeMode: 'light' | 'dark';
}

interface AzureOverviewProps {
  metrics: any[];
  themeMode: 'light' | 'dark';
  companyId: string;
  onNavigateToAnalytics?: () => void;
  onNavigateToBenchmark?: () => void;
}

function AzureMetricCard({ metric, index, themeMode }: MetricCardProps) {
  const isDark = themeMode === 'dark';
  
  const colorMap = {
    blue: { 
      bg: isDark ? 'bg-blue-500/5' : 'bg-blue-50/50',
      hover: isDark ? 'hover:bg-blue-500/10' : 'hover:bg-blue-50',
      icon: 'text-blue-500',
      border: isDark ? 'border-blue-500/20' : 'border-blue-200/50'
    },
    purple: { 
      bg: isDark ? 'bg-purple-500/5' : 'bg-purple-50/50',
      hover: isDark ? 'hover:bg-purple-500/10' : 'hover:bg-purple-50',
      icon: 'text-purple-500',
      border: isDark ? 'border-purple-500/20' : 'border-purple-200/50'
    },
    green: { 
      bg: isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50',
      hover: isDark ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-50',
      icon: 'text-emerald-500',
      border: isDark ? 'border-emerald-500/20' : 'border-emerald-200/50'
    },
    orange: { 
      bg: isDark ? 'bg-orange-500/5' : 'bg-orange-50/50',
      hover: isDark ? 'hover:bg-orange-500/10' : 'hover:bg-orange-50',
      icon: 'text-orange-500',
      border: isDark ? 'border-orange-500/20' : 'border-orange-200/50'
    },
    yellow: { 
      bg: isDark ? 'bg-yellow-500/5' : 'bg-yellow-50/50',
      hover: isDark ? 'hover:bg-yellow-500/10' : 'hover:bg-yellow-50',
      icon: 'text-yellow-500',
      border: isDark ? 'border-yellow-500/20' : 'border-yellow-200/50'
    },
    pink: { 
      bg: isDark ? 'bg-pink-500/5' : 'bg-pink-50/50',
      hover: isDark ? 'hover:bg-pink-500/10' : 'hover:bg-pink-50',
      icon: 'text-pink-500',
      border: isDark ? 'border-pink-500/20' : 'border-pink-200/50'
    },
    emerald: { 
      bg: isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50',
      hover: isDark ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-50',
      icon: 'text-emerald-500',
      border: isDark ? 'border-emerald-500/20' : 'border-emerald-200/50'
    }
  };

  const colors = colorMap[metric.color as keyof typeof colorMap] || colorMap.blue;
  const isPositive = metric.changeType === 'positive';
  const isNegative = metric.changeType === 'negative';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className={cn(
        'border transition-all duration-300',
        colors.border,
        colors.hover,
        isDark ? 'bg-card/50' : 'bg-white/50',
        'backdrop-blur-sm'
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Icon */}
            <div className={cn(
              'p-2 rounded-lg',
              colors.bg
            )}>
              <metric.icon className={cn('h-4 w-4', colors.icon)} />
            </div>

            {/* Change Badge */}
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              isPositive && 'text-emerald-600 bg-emerald-500/10',
              isNegative && 'text-red-600 bg-red-500/10',
              !isPositive && !isNegative && (isDark ? 'text-slate-400 bg-slate-500/10' : 'text-gray-600 bg-gray-500/10')
            )}>
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {metric.change}
            </div>
          </div>

          {/* Value */}
          <div className="mt-3">
            <div className={cn(
              'text-2xl font-semibold tracking-tight',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              {metric.value.toLocaleString ? metric.value.toLocaleString('pt-BR') : metric.value}
            </div>
            <div className={cn(
              'text-xs mt-1',
              isDark ? 'text-slate-400' : 'text-gray-600'
            )}>
              {metric.title}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AzureOverview({ 
  metrics, 
  themeMode,
  companyId,
  onNavigateToAnalytics,
  onNavigateToBenchmark 
}: AzureOverviewProps) {
  const isDark = themeMode === 'dark';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn(
            'text-xl font-semibold tracking-tight',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            Visão Geral
          </h2>
          <p className={cn(
            'text-sm mt-0.5',
            isDark ? 'text-slate-400' : 'text-gray-600'
          )}>
            Métricas principais e tendências históricas
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToAnalytics}
            className={cn(
              'text-xs gap-1.5',
              isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            Analytics
            <ArrowRight className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToBenchmark}
            className={cn(
              'text-xs gap-1.5',
              isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
            )}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Benchmark
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Metrics Grid - Azure Style: 4 columns compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.slice(0, 8).map((metric, index) => (
          <AzureMetricCard
            key={metric.title}
            metric={metric}
            index={index}
            themeMode={themeMode}
          />
        ))}
      </div>

      {/* Quick Insights - Azure Panels Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Performance Summary */}
        <Card className={cn(
          'border transition-all duration-300',
          isDark 
            ? 'bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 hover:border-blue-500/30' 
            : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:border-blue-300'
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                isDark ? 'bg-blue-500/10' : 'bg-blue-100'
              )}>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'text-xs font-medium mb-1',
                  isDark ? 'text-slate-300' : 'text-gray-700'
                )}>
                  Crescimento
                </div>
                <div className={cn(
                  'text-xs leading-relaxed',
                  isDark ? 'text-slate-400' : 'text-gray-600'
                )}>
                  Performance acima da média com crescimento consistente em todas as métricas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Summary */}
        <Card className={cn(
          'border transition-all duration-300',
          isDark 
            ? 'bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/30' 
            : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50 hover:border-emerald-300'
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'
              )}>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'text-xs font-medium mb-1',
                  isDark ? 'text-slate-300' : 'text-gray-700'
                )}>
                  Engajamento
                </div>
                <div className={cn(
                  'text-xs leading-relaxed',
                  isDark ? 'text-slate-400' : 'text-gray-600'
                )}>
                  Alta taxa de interação com CTAs e tempo médio acima do esperado
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking Summary */}
        <Card className={cn(
          'border transition-all duration-300',
          isDark 
            ? 'bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20 hover:border-purple-500/30' 
            : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:border-purple-300'
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                isDark ? 'bg-purple-500/10' : 'bg-purple-100'
              )}>
                <BarChart2 className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'text-xs font-medium mb-1',
                  isDark ? 'text-slate-300' : 'text-gray-700'
                )}>
                  Posicionamento
                </div>
                <div className={cn(
                  'text-xs leading-relaxed',
                  isDark ? 'text-slate-400' : 'text-gray-600'
                )}>
                  Top 10% da categoria com tendência de crescimento no ranking
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Section */}
      <AdvancedAnalytics themeMode={themeMode} companyId={companyId} />
    </div>
  );
}
