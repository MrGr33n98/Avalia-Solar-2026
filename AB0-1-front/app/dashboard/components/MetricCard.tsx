'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  trend?: number[];
  color?: string;
  delay?: number;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  trend,
  color = 'primary',
  delay = 0
}: MetricCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary/10 dark:bg-primary/5',
      icon: 'text-primary',
      gradient: 'from-primary/20 to-primary/5'
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-950',
      icon: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500/20 to-blue-500/5'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-950',
      icon: 'text-green-600 dark:text-green-400',
      gradient: 'from-green-500/20 to-green-500/5'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-950',
      icon: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-500/20 to-purple-500/5'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-950',
      icon: 'text-orange-600 dark:text-orange-400',
      gradient: 'from-orange-500/20 to-orange-500/5'
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-950',
      icon: 'text-yellow-600 dark:text-yellow-400',
      gradient: 'from-yellow-500/20 to-yellow-500/5'
    },
    pink: {
      bg: 'bg-pink-100 dark:bg-pink-950',
      icon: 'text-pink-600 dark:text-pink-400',
      gradient: 'from-pink-500/20 to-pink-500/5'
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-950',
      icon: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-500/20 to-emerald-500/5'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -4 }}
    >
      <Card className={cn(
        'relative overflow-hidden border-muted hover:border-primary/40 transition-all duration-300 group',
        'hover:shadow-lg hover:shadow-primary/5'
      )}>
        {/* Gradient background on hover */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          colors.gradient
        )} />

        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            {/* Icon */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                'p-3 rounded-xl transition-all duration-300',
                colors.bg,
                'group-hover:shadow-lg'
              )}
            >
              <Icon className={cn('h-5 w-5', colors.icon)} />
            </motion.div>

            {/* Change Badge */}
            {change && (
              <Badge 
                variant={
                  changeType === 'positive' ? 'default' : 
                  changeType === 'negative' ? 'destructive' : 
                  'secondary'
                }
                className="text-xs font-medium"
              >
                {change}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
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
                    changeType === 'positive' ? 'bg-green-500/30' :
                    changeType === 'negative' ? 'bg-red-500/30' :
                    'bg-muted'
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
interface MetricsGridProps {
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

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          {...metric}
          delay={index * 0.05}
        />
      ))}
    </div>
  );
}
