import React from 'react';

export function GroupCommentSkeleton() {
  return (
    <div className="space-y-4 py-3 animate-pulse" aria-hidden="true">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="h-3 w-1/4 bg-slate-200 rounded" />
            <div className="h-3.5 w-full bg-slate-200 rounded" />
            <div className="h-3 w-5/6 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
