'use client';

export function TemplateSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col justify-between rounded-lg border p-5 space-y-4 animate-pulse">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-5 bg-muted/60 rounded w-1/2" />
              <div className="h-5 bg-muted/40 rounded w-16" />
            </div>
            <div className="h-4 bg-muted/40 rounded w-3/4" />
            <div className="h-3 bg-muted/30 rounded w-1/3" />
          </div>
          <div className="flex justify-between border-t pt-4">
            <div className="h-8 bg-muted/40 rounded w-20" />
            <div className="h-8 bg-muted/40 rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
