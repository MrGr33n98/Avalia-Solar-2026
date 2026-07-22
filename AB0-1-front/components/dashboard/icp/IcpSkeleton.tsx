'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function IcpSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#D8DEE8]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-[#D8DEE8]" />
          <Skeleton className="h-8 w-64 bg-[#B8C2D1]" />
          <Skeleton className="h-4 w-96 bg-[#D8DEE8]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 bg-[#D8DEE8]" />
          <Skeleton className="h-9 w-36 bg-[#B8C2D1]" />
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 bg-white border border-[#D8DEE8] rounded-md space-y-4">
            <Skeleton className="h-5 w-48 bg-[#D8DEE8]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-20 bg-[#F8FAFC]" />
              <Skeleton className="h-20 bg-[#F8FAFC]" />
              <Skeleton className="h-20 bg-[#F8FAFC]" />
            </div>
          </div>
          <div className="p-6 bg-white border border-[#D8DEE8] rounded-md space-y-4">
            <Skeleton className="h-5 w-48 bg-[#D8DEE8]" />
            <Skeleton className="h-40 bg-[#F8FAFC]" />
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-white border border-[#D8DEE8] rounded-md space-y-4">
            <Skeleton className="h-5 w-32 bg-[#D8DEE8]" />
            <Skeleton className="h-24 bg-[#F8FAFC]" />
          </div>
          <div className="p-6 bg-white border border-[#D8DEE8] rounded-md space-y-4">
            <Skeleton className="h-32 bg-[#F8FAFC]" />
          </div>
        </div>
      </div>
    </div>
  );
}
