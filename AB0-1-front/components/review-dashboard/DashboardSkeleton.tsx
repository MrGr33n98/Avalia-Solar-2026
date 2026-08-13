'use client';

import { cn } from '@/lib/utils';

interface DashboardSkeletonProps {
  variant?: 'metrics' | 'cards' | 'list' | 'profile' | 'page';
  className?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200/60', className)} />;
}

export function DashboardSkeleton({ variant = 'page', className }: DashboardSkeletonProps) {
  if (variant === 'metrics') {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="h-2.5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-xl" />
              <div className="space-y-2 flex-1">
                <SkeletonBlock className="h-3.5 w-3/4" />
                <SkeletonBlock className="h-2.5 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
            <SkeletonBlock className="h-16 w-16 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <SkeletonBlock className="h-3.5 w-2/3" />
              <SkeletonBlock className="h-2.5 w-1/2" />
              <SkeletonBlock className="h-2.5 w-1/3" />
            </div>
            <SkeletonBlock className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div className={cn('rounded-xl border border-slate-200 bg-white p-6 flex items-center gap-5', className)}>
        <SkeletonBlock className="h-16 w-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="h-3 w-64" />
          <SkeletonBlock className="h-2.5 w-32" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-2 w-full max-w-[200px]" />
        </div>
      </div>
    );
  }

  // Full page skeleton
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-72" />
      </div>
      {/* Profile */}
      <DashboardSkeleton variant="profile" />
      {/* Metrics */}
      <DashboardSkeleton variant="metrics" />
      {/* Actions */}
      <DashboardSkeleton variant="cards" />
    </div>
  );
}
