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
      bg: 'bg-primary/10',
      icon: 'text-primary',
      border: 'border-primary/20'
    },
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-500',
      border: 'border-blue-500/20'
    },
    green: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-500',
      border: 'border-emerald-500/20'
    },
    purple: {
      bg: 'bg-violet-500/10',
      icon: 'text-violet-500',
      border: 'border-violet-500/20'
    },
    'brand-cyan': {
      bg: 'bg-cyan-500/10',
      icon: 'text-cyan-500',
      border: 'border-cyan-500/20'
    },
    'brand-yellow': {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-500',
      border: 'border-amber-500/20'
    },
    'brand-blue': {
      bg: 'bg-blue-600/10',
      icon: 'text-blue-600',
      border: 'border-blue-600/20'
    },
    'brand-green': {
      bg: 'bg-emerald-600/10',
      icon: 'text-emerald-600',
      border: 'border-emerald-600/20'
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
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-500',
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
        'relative h-full overflow-hidden transition-all duration-500 group border-none clay-precision bg-card dark:bg-[#0F172A] shadow-lg hover:shadow-primary/5',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.03] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity'
      )}>
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-6">
            {/* Icon Container with Glass Effect */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                'p-3 rounded-xl transition-all duration-300 shadow-sm border backdrop-blur-sm',
                colors.bg,
                colors.border
              )}
            >
              <Icon className={cn('h-5 w-5', colors.icon)} strokeWidth={2.5} />
            </motion.div>

            {/* Change Badge */}
            {change && (
              <Badge 
                variant="outline"
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 h-6 border-[0.5px]",
                  changeType === 'positive' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  changeType === 'negative' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                  "bg-white/5 text-muted-foreground border-white/10"
                )}
              >
                {changeType === 'positive' && <TrendingUp className="w-3 h-3 mr-1 inline" />}
                {changeType === 'negative' && <TrendingDown className="w-3 h-3 mr-1 inline" />}
                {change}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-white/30">
              {title}
            </p>
            <p className="text-3xl font-black text-foreground dark:text-white tracking-tight font-mono tabular-nums leading-none">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
          </div>

          {/* Mini Trend Line - Refined Bars */}
          {trend && trend.length > 0 && (
            <div className="mt-6 flex items-end gap-1 h-10 w-full overflow-hidden opacity-40 group-hover:opacity-80 transition-opacity">
              {trend.map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: delay + (index * 0.03), duration: 0.5, ease: "easeOut" }}
                  className={cn(
                    'flex-1 min-w-[3px] rounded-t-sm transition-all',
                    changeType === 'positive' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                    changeType === 'negative' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' :
                    'bg-primary shadow-[0_0_8px_rgba(37,99,235,0.3)]'
                  )}
                />
              ))}
            </div>
          )}
          
          {/* Subtle Glow Effect */}
          <div className={cn(
            "absolute -bottom-20 -right-20 w-40 h-40 blur-[80px] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700",
            colors.bg
          )} />
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
