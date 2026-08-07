'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  trend?: number[] | null;
  color?: string;
  delay?: number;
  description?: string;
  variant?: string;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  trend,
  color = 'primary',
  delay = 0,
  description,
  variant
}: MetricCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary/10',
      icon: 'text-primary',
      border: 'border-primary/20'
    },
    blue: {
      bg: 'bg-brand-blue/10',
      icon: 'text-brand-blue',
      border: 'border-brand-blue/20'
    },
    green: {
      bg: 'bg-brand-green/10',
      icon: 'text-brand-green',
      border: 'border-emerald-500/20'
    },
    purple: {
      bg: 'bg-violet-500/10',
      icon: 'text-violet-500',
      border: 'border-violet-500/20'
    },
    'brand-cyan': {
      bg: 'bg-brand-cyan/10',
      icon: 'text-brand-cyan',
      border: 'border-brand-cyan/20'
    },
    'brand-yellow': {
      bg: 'bg-brand-yellow/10',
      icon: 'text-brand-yellow',
      border: 'border-brand-yellow/20'
    },
    'brand-blue': {
      bg: 'bg-brand-blue/10',
      icon: 'text-brand-blue',
      border: 'border-brand-blue/20'
    },
    'brand-green': {
      bg: 'bg-brand-green/10',
      icon: 'text-brand-green',
      border: 'border-brand-green/20'
    },
    yellow: {
      bg: 'bg-amber-400/10',
      icon: 'text-amber-400',
      border: 'border-amber-400/20'
    },
    pink: {
      bg: 'bg-pink-500/10',
      icon: 'text-pink-500',
      border: 'border-pink-500/20'
    },
    emerald: {
      bg: 'bg-brand-green/10',
      icon: 'text-brand-green',
      border: 'border-emerald-500/20'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className={cn(
        'relative h-full rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
        'before:absolute before:inset-0 before:bg-slate-50 before:opacity-0 hover:before:opacity-100 before:transition-opacity'
      )}>
        <CardContent className="p-5 relative z-10">
          <div className="flex items-start justify-between mb-4">
            {/* Enhanced Icon Container */}
            <div
              className={cn(
                'p-1.5 rounded-md transition-all duration-200 border bg-slate-50 border-slate-100',
                colors.icon
              )}
            >
              <Icon className={cn('h-4 w-4', colors.icon)} strokeWidth={2} />
            </div>

            {/* Change Badge */}
            {change && (
              <Badge 
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold px-2 h-5 border",
                  changeType === 'positive' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                  changeType === 'negative' ? "bg-red-50 text-red-600 border-red-200" :
                  "bg-slate-50 text-slate-600 border-slate-200"
                )}
              >
                {changeType === 'positive' && <TrendingUp className="w-3 h-3 mr-1 inline" />}
                {changeType === 'negative' && <TrendingDown className="w-3 h-3 mr-1 inline" />}
                {change}
              </Badge>
            )}
          </div>

          {/* Enhanced Content */}
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 leading-tight">
              {title}
            </p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
            {description && (
              <p className="text-xs text-slate-400 leading-tight mt-1">
                {description}
              </p>
            )}
          </div>

          {/* Enhanced Mini Trend Line */}
          {trend && trend.length > 0 && (
            <div className="mt-4 flex items-end gap-1 h-6 w-full overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity">
              {trend.map((height, index) => (
                <div
                  key={index}
                  style={{ height: `${Math.max(height, 8)}%` }}
                  className={cn(
                    'flex-1 min-w-[3px] rounded-t-sm transition-all',
                    changeType === 'positive' ? 'bg-emerald-400' :
                    changeType === 'negative' ? 'bg-red-400' :
                    'bg-slate-300'
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
    trend?: number[] | null;
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
