'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnterpriseMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  trend?: number[];
  color?: string;
  delay?: number;
}

export default function EnterpriseMetricCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  trend,
  color = 'blue',
  delay = 0
}: EnterpriseMetricCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/20'
    },
    green: {
      bg: 'bg-green-500/10',
      icon: 'text-green-600 dark:text-green-400',
      border: 'border-green-500/20'
    },
    purple: {
      bg: 'bg-purple-500/10',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20'
    },
    orange: {
      bg: 'bg-orange-500/10',
      icon: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-500/20'
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      icon: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-500/20'
    },
    pink: {
      bg: 'bg-pink-500/10',
      icon: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-500/20'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20'
    },
    gray: {
      bg: 'bg-gray-500/10',
      icon: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-500/20'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={cn(
        'relative overflow-hidden border-border/50 hover:border-border transition-all duration-300 group bg-card/50'
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            {/* Icon */}
            <div className={cn(
              'p-2.5 rounded-lg transition-all',
              colors.bg,
              colors.border,
              'border'
            )}>
              <Icon className={cn('h-4 w-4', colors.icon)} />
            </div>

            {/* Change Badge */}
            {change && (
              <div className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                changeType === 'positive' && 'bg-green-500/10 text-green-600 dark:text-green-400',
                changeType === 'negative' && 'bg-red-500/10 text-red-600 dark:text-red-400',
                changeType === 'neutral' && 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
              )}>
                {changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
                {changeType === 'negative' && <TrendingDown className="h-3 w-3" />}
                <span>{change}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
          </div>

          {/* Mini Trend Line */}
          {trend && trend.length > 0 && (
            <div className="mt-4 flex items-end gap-1 h-8">
              {trend.map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: delay + (index * 0.05), duration: 0.3 }}
                  className={cn(
                    'flex-1 rounded-t transition-colors',
                    changeType === 'positive' ? 'bg-green-500/20' :
                    changeType === 'negative' ? 'bg-red-500/20' :
                    'bg-muted/50'
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Componente para grid de métricas
interface EnterpriseMetricsGridProps {
  metrics: Array<{
    title: string;
    value: string | number;
    icon: LucideIcon;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    trend?: number[];
    color?: string;
  }>;
}

export function EnterpriseMetricsGrid({ metrics }: EnterpriseMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <EnterpriseMetricCard
          key={metric.title}
          {...metric}
          delay={index * 0.05}
        />
      ))}
    </div>
  );
}
