'use client';

import React from 'react';

export const OpportunityCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xs animate-pulse dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="h-4 w-3/4 bg-slate-200 rounded dark:bg-slate-700" />
        <div className="h-4 w-10 bg-slate-200 rounded dark:bg-slate-700" />
      </div>
      <div className="h-5 w-1/2 bg-slate-200 rounded my-1 dark:bg-slate-700" />
      <div className="h-3 w-2/3 bg-slate-200 rounded dark:bg-slate-700" />
      <div className="h-3 w-4/5 bg-slate-200 rounded dark:bg-slate-700" />
      <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between">
        <div className="h-3 w-1/3 bg-slate-200 rounded dark:bg-slate-700" />
        <div className="h-3 w-8 bg-slate-200 rounded dark:bg-slate-700" />
      </div>
    </div>
  );
};
