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
        'relative h-full overflow-hidden transition-all duration-500 group cursor-pointer clay-card',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.03] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
        'after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/5 after:to-transparent after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:pointer-events-none'
      )}>
        <CardContent className="p-8 relative z-10">
          <div className="flex items-start justify-between mb-8">
            {/* Enhanced Icon Container */}
            <motion.div
              whileHover={{ scale: 1.15, rotate: 8 }}
              className={cn(
                'p-4 rounded-2xl transition-all duration-300 shadow-lg border-2 backdrop-blur-sm relative overflow-hidden',
                colors.bg,
                colors.border,
                'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity'
              )}
            >
              <Icon className={cn('h-6 w-6 relative z-10', colors.icon)} strokeWidth={2.2} />
              <div className={cn(
                "absolute -inset-1 blur-md opacity-20 group-hover:opacity-40 transition-opacity",
                colors.bg
              )} />
            </motion.div>

            {/* Change Badge */}
            {change && (
              <Badge 
                variant="outline"
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 h-6 border-[0.5px]",
                  changeType === 'positive' ? "bg-brand-green/10 text-brand-green border-emerald-500/20" :
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

          {/* Enhanced Content */}
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 dark:text-white/40 leading-tight">
              {title}
            </p>
            <p className="text-4xl font-black text-foreground dark:text-white tracking-tight font-mono tabular-nums leading-none">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
          </div>

          {/* Enhanced Mini Trend Line */}
          {trend && trend.length > 0 && (
            <div className="mt-8 flex items-end gap-2 h-12 w-full overflow-hidden opacity-30 group-hover:opacity-90 transition-opacity">
              {trend.map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${Math.max(height, 8)}%`, opacity: 1 }}
                  transition={{ delay: delay + (index * 0.08), duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    'flex-1 min-w-[4px] rounded-t-lg transition-all relative overflow-hidden',
                    changeType === 'positive' ? 'bg-gradient-to-t from-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.4)]' :
                    changeType === 'negative' ? 'bg-gradient-to-t from-red-400 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.4)]' :
                    'bg-gradient-to-t from-brand-blue to-brand-cyan shadow-[0_0_12px_rgba(37,99,235,0.4)]',
                    'before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity'
                  )}
                />
              ))}
            </div>
          )}
                />
              ))}
            </div>
          )}
          
          {/* Enhanced Glow Effect */}
          <div className={cn(
            "absolute -bottom-24 -right-24 w-48 h-48 blur-[100px] rounded-full opacity-0 group-hover:opacity-15 transition-all duration-1000 delay-200",
            colors.bg
          )} />
          
          {/* Subtle Border Animation */}
          <div className={cn(
            "absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
            "bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"
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
