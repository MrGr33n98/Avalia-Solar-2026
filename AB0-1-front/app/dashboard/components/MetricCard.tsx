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
      bg: 'bg-brand-blue/10',
      icon: 'text-brand-blue',
      gradient: 'from-brand-blue/20 to-brand-blue/5'
    },
    blue: {
      bg: 'bg-brand-blue/10',
      icon: 'text-brand-blue',
      gradient: 'from-brand-blue/20 to-brand-blue/5'
    },
    green: {
      bg: 'bg-brand-green/10',
      icon: 'text-brand-green',
      gradient: 'from-brand-green/20 to-brand-green/5'
    },
    purple: {
      bg: 'bg-brand-blue/10',
      icon: 'text-brand-blue',
      gradient: 'from-brand-blue/20 to-brand-blue/5'
    },
    'brand-cyan': {
      bg: 'bg-brand-cyan/10',
      icon: 'text-brand-cyan',
      gradient: 'from-brand-cyan/20 to-brand-cyan/5'
    },
    'brand-yellow': {
      bg: 'bg-brand-yellow/10',
      icon: 'text-brand-yellow',
      gradient: 'from-brand-yellow/20 to-brand-yellow/5'
    },
    'brand-blue': {
      bg: 'bg-brand-blue/10',
      icon: 'text-brand-blue',
      gradient: 'from-brand-blue/20 to-brand-blue/5'
    },
    'brand-green': {
      bg: 'bg-brand-green/10',
      icon: 'text-brand-green',
      gradient: 'from-brand-green/20 to-brand-green/5'
    },
    yellow: {
      bg: 'bg-brand-yellow/10',
      icon: 'text-brand-yellow',
      gradient: 'from-brand-yellow/20 to-brand-yellow/5'
    },
    pink: {
      bg: 'bg-brand-blue/10',
      icon: 'text-brand-blue',
      gradient: 'from-brand-blue/20 to-brand-blue/5'
    },
    emerald: {
      bg: 'bg-brand-green/10',
      icon: 'text-brand-green',
      gradient: 'from-brand-green/20 to-brand-green/5'
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
        'relative overflow-hidden transition-all duration-300 group shadow-none border-none clay-precision bg-card dark:bg-[#002B4D]',
        'hover:scale-[1.02]'
      )}>
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between mb-5">
            {/* Icon */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                'p-3 rounded-2xl transition-all duration-300 shadow-inner border',
                colors.bg,
                'border-black/5 dark:border-white/5'
              )}
            >
              <Icon className={cn('h-6 w-6', colors.icon)} />
            </motion.div>

            {/* Change Badge */}
            {change && (
              <Badge 
                variant={
                  changeType === 'positive' ? 'default' : 
                  changeType === 'negative' ? 'destructive' : 
                  'secondary'
                }
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 h-5 border-none",
                  changeType === 'positive' ? "bg-brand-green/10 text-brand-green shadow-none" :
                  changeType === 'negative' ? "bg-red-500/10 text-red-500 shadow-none" :
                  "bg-black/5 dark:bg-white/10 text-muted-foreground dark:text-white/70"
                )}
              >
                {change}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/30">
              {title}
            </p>
            <p className="text-3xl font-black text-foreground dark:text-white tracking-tighter font-mono">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
          </div>

          {/* Mini Trend Line */}
          {trend && trend.length > 0 && (
            <div className="mt-5 flex items-end gap-1.5 h-8">
              {trend.map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: delay + (index * 0.05), duration: 0.3 }}
                  className={cn(
                    'flex-1 rounded-t-lg transition-colors border-t border-white/5',
                    changeType === 'positive' ? 'bg-brand-green/20' :
                    changeType === 'negative' ? 'bg-red-500/20' :
                    'bg-black/5 dark:bg-white/5'
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
