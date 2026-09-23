'use client';

import type { ReactNode } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { FeatureAccessEntry } from '@/lib/api';
import { isFeatureEnabledEntry, isFeatureHiddenEntry } from '@/lib/feature-access';
import { cn } from '@/lib/utils';

interface FeatureGuardProps {
  entry?: FeatureAccessEntry | null;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  featureId?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

function LockedPreview() {
  return (
    <div aria-hidden="true" className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-2xl bg-[hsl(var(--dashboard-surface))]" />
        <div className="h-28 rounded-2xl bg-[hsl(var(--dashboard-surface))]" />
        <div className="h-28 rounded-2xl bg-[hsl(var(--dashboard-surface))]" />
      </div>
      <div className="h-56 rounded-3xl bg-[hsl(var(--dashboard-surface))]" />
    </div>
  );
}

export default function FeatureGuard({
  entry,
  title,
  description,
  children,
  className,
  loading,
  error,
  onRetry,
}: FeatureGuardProps) {
  if (loading) {
    return (
      <div className="space-y-6 w-full animate-pulse p-6 bg-slate-50 dark:bg-slate-950/20 rounded-3xl border border-slate-200 dark:border-white/10">
        <div className="h-8 w-64 rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-[350px] rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="h-56 rounded-3xl bg-slate-200 dark:bg-white/10 mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950/20 rounded-3xl border border-slate-200 dark:border-white/10 text-center min-h-[300px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Erro ao carregar permissões</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          Não foi possível verificar os recursos do seu plano. Se o problema continuar, atualize a página.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (isFeatureHiddenEntry(entry)) return null;
  if (entry && isFeatureEnabledEntry(entry)) return <>{children}</>;

  return (
    <div className={cn('relative w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/20', className)}>
      {/* Blurred Background Content */}
      <div className="pointer-events-none select-none blur-[8px] opacity-40 transition-all duration-300">
        <LockedPreview />
      </div>

      {/* Absolute Overlaid Lock Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6 bg-slate-900/10 dark:bg-black/20 backdrop-blur-[2px]">
        <Card className="max-w-md border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#002B4D]/95 text-slate-900 dark:text-white shadow-2xl backdrop-blur-md">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 dark:bg-white/10 text-brand-blue dark:text-brand-cyan">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight uppercase">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">{description}</p>
              </div>
            </div>
            
            <div className="h-[1px] w-full bg-slate-100 dark:bg-white/10" />
            
            <p className="text-xs font-semibold text-slate-500 dark:text-white/70">
              {entry?.upsell_copy || 'Disponivel mediante upgrade de plano.'}
            </p>

            <button 
              onClick={() => window.location.href = '/pricing'}
              className="w-full mt-2 h-11 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-[10px] shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Fazer Upgrade Agora
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
