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
    <div className="py-8 px-4 bg-gradient-to-br from-blue-50 to-slate-50 border-b border-slate-200">
      <div className="container mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SponsoredSkeleton() {
  return (
    <div className="py-8 px-4 bg-white border-b border-slate-200">
      <div className="container mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[220px] rounded-lg" />
      ))}
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
