'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function HeroSkeleton() {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 py-8 md:py-12 px-4">
      <div className="container mx-auto space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-2/3" />
        <div className="flex gap-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
    </div>
  );
}

export function ChipsSkeleton() {
  return (
    <div className="bg-white border-b border-slate-200 py-4 px-4">
      <div className="container mx-auto flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function TopRankingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function SponsoredSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[240px] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function ToolbarSkeleton() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 max-w-xs rounded" />
        <Skeleton className="h-10 w-40 rounded" />
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <aside className="hidden lg:block w-64 space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </aside>
  );
}
