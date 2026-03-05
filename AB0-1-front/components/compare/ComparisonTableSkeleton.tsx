'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function ComparisonTableSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Carregando comparação">
      <span className="sr-only">Carregando...</span>
      
      {/* Header skeleton */}
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-3xl p-8 shadow-lg space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        ))}
      </div>

      {/* CTA skeleton */}
      <div className="bg-white rounded-3xl p-8 shadow-lg">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
