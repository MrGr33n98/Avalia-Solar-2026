'use client';

import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';

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
}

export default function FeatureGuard({
  entry,
  title,
  description,
  children,
  className,
}: FeatureGuardProps) {
  if (isFeatureHiddenEntry(entry)) return null;
  if (!entry || isFeatureEnabledEntry(entry)) return <>{children}</>;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="pointer-events-none select-none overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
        <div className="space-y-4 p-6 blur-[2px] opacity-55">
          <div className="h-6 w-48 rounded-full bg-white/10" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-2xl bg-white/10" />
            <div className="h-28 rounded-2xl bg-white/10" />
            <div className="h-28 rounded-2xl bg-white/10" />
          </div>
          <div className="h-56 rounded-3xl bg-white/10" />
        </div>
      </div>

      <Card className="border-white/10 bg-[#002B4D] text-white shadow-none">
        <CardContent className="flex flex-col gap-3 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <Lock className="h-5 w-5 text-brand-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm text-white/60">{description}</p>
            </div>
          </div>
          <p className="text-sm text-white/70">
            {entry?.upsell_copy || 'Disponivel mediante upgrade de plano.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
