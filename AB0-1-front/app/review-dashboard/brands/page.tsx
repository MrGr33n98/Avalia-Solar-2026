'use client';

import { Suspense } from 'react';
import { SolutionsWorkspace } from '@/components/review-dashboard/solutions/SolutionsWorkspace';

export default function BrandsPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px] animate-pulse rounded border border-[#DDE5EF] bg-white/60" />}>
      <SolutionsWorkspace initialHubTab="brands" />
    </Suspense>
  );
}
