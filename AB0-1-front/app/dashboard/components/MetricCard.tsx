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
        'relative overflow-hidden border-white/10 bg-card/95 backdrop-blur-sm transition-all duration-300 group shadow-none',
        'hover:border-brand-blue/40'
      )}>
        {/* Gradient background on hover */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          colors.gradient
        )} />

        <CardContent className="p-4 relative">
          <div className="flex items-start justify-between mb-4">
            {/* Icon */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                'p-2.5 rounded-lg transition-all duration-300',
                colors.bg
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
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-1.5 h-5 border-none",
                  changeType === 'positive' ? "bg-brand-green text-white" :
                  changeType === 'negative' ? "bg-red-500 text-white" :
                  "bg-white/10 text-white/70"
                )}
              >
                {change}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
              {title}
            </p>
            <p className="text-2xl font-bold text-white tracking-tight font-mono">
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
          </div>

          {/* Mini Trend Line */}
          {trend && trend.length > 0 && (
            <div className="mt-4 flex items-end gap-1 h-6">
              {trend.map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: delay + (index * 0.05), duration: 0.3 }}
                  className={cn(
                    'flex-1 rounded-t-sm transition-colors',
                    changeType === 'positive' ? 'bg-brand-green/40' :
                    changeType === 'negative' ? 'bg-red-500/40' :
                    'bg-white/10'
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
