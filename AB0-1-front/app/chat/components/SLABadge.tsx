'use client';

import { useMemo } from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SLABadgeProps {
  slaDueAt?: string | null;
  status?: string;
  className?: string;
}

export function SLABadge({ slaDueAt, status, className }: SLABadgeProps) {
  const slaState = useMemo(() => {
    if (!slaDueAt || status === 'resolved' || status === 'blocked') {
      return null;
    }

    const due = new Date(slaDueAt).getTime();
    const now = Date.now();
    const diffMs = due - now;

    if (diffMs <= 0) {
      const minutesOver = Math.abs(Math.floor(diffMs / 60000));
      const hoursOver = (minutesOver / 60).toFixed(1);
      return {
        type: 'breached' as const,
        label: `SLA vencido há ${minutesOver < 60 ? `${minutesOver}m` : `${hoursOver}h`}`,
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: AlertTriangle,
      };
    }

    const minutesLeft = Math.floor(diffMs / 60000);
    const hoursLeft = Math.floor(minutesLeft / 60);
    const remainingMins = minutesLeft % 60;

    if (minutesLeft <= 60) {
      return {
        type: 'warning' as const,
        label: `SLA em ${minutesLeft}m`,
        color: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
        icon: Clock,
      };
    }

    return {
      type: 'ok' as const,
      label: `Responder em ${hoursLeft > 0 ? `${hoursLeft}h ${remainingMins}m` : `${minutesLeft}m`}`,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Zap,
    };
  }, [slaDueAt, status]);

  if (!slaState) return null;

  const Icon = slaState.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight shadow-2xs',
        slaState.color,
        className
      )}
      title={`Vencimento SLA: ${new Date(slaDueAt!).toLocaleString('pt-BR')}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{slaState.label}</span>
    </span>
  );
}
