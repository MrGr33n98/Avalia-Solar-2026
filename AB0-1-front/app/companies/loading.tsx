import { Skeleton } from '@/components/ui/skeleton';

export default function CompaniesLoading() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50/50">
      {/* Mobile Search Placeholder */}
      <div className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <Skeleton className="h-10 w-full rounded-full bg-slate-100" />
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex w-full min-w-0 flex-col items-start gap-4 dashboard:gap-4 xl:gap-6 2xl:gap-8 dashboard:flex-row">
          {/* Desktop Sidebar Skeleton */}
          <aside className="hidden dashboard:block dashboard:w-[220px] xl:w-[240px] 2xl:w-[300px] shrink-0 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <Skeleton className="h-5 w-24 bg-slate-200" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-16 bg-slate-100" />
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[...Array(15)].map((_, i) => (
                    <Skeleton key={i} className="h-7 rounded bg-slate-100" />
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <Skeleton className="h-4 w-20 bg-slate-100" />
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <Skeleton className="h-4 w-32 bg-slate-100" />
                    <Skeleton className="h-4 w-6 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Area */}
          <div className="w-full min-w-0 flex-1 space-y-6">
            {/* Top Banner Placeholder */}
            <Skeleton className="w-full h-24 md:h-28 rounded-2xl bg-slate-100 border border-slate-200/60" />

            {/* Heading & Controls Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64 md:w-80 bg-slate-200 rounded-lg" />
                <Skeleton className="h-4 w-48 md:w-60 bg-slate-100 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-44 rounded-lg bg-slate-100" />
                <Skeleton className="h-9 w-28 rounded-lg bg-slate-100" />
              </div>
            </div>

            {/* Quick Actions Pills Skeleton */}
            <div className="hidden md:flex gap-3 pb-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-28 rounded-xl bg-slate-100" />
              ))}
            </div>

            {/* 12 Company Card Skeletons with exact geometry */}
            <div
              className="grid w-full min-w-0 gap-4 [--company-card-min:280px] dashboard:[--company-card-min:300px] xl:[--company-card-min:320px] 2xl:[--company-card-min:380px]"
              style={{
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(min(100%, var(--company-card-min)), 1fr))',
              }}
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  data-testid="company-card-skeleton"
                  className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm flex flex-col justify-between h-[256px]"
                >
                  <div className="space-y-3">
                    {/* Header: Logo + Title/City */}
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-11 w-11 rounded-lg bg-slate-100 shrink-0" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <Skeleton className="h-4 w-3/4 bg-slate-200" />
                        <Skeleton className="h-3 w-1/2 bg-slate-100" />
                      </div>
                    </div>

                    {/* Meta Row: Rating + Tag */}
                    <div className="flex items-center gap-2 pt-1">
                      <Skeleton className="h-5 w-20 rounded bg-slate-100" />
                      <Skeleton className="h-5 w-24 rounded bg-slate-100" />
                    </div>

                    {/* Description preview */}
                    <div className="space-y-1 pt-1">
                      <Skeleton className="h-3 w-full bg-slate-100" />
                      <Skeleton className="h-3 w-4/5 bg-slate-100" />
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 flex-1 rounded-lg bg-slate-100" />
                      <Skeleton className="h-7 flex-1 rounded-lg bg-slate-100" />
                      <Skeleton className="h-7 w-8 rounded-lg bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Rail Banner Skeleton */}
          <div className="hidden dashboard:flex flex-col gap-4 dashboard:w-[220px] xl:w-[240px] 2xl:w-[300px] shrink-0">
            <Skeleton className="w-full h-64 rounded-2xl bg-slate-100 border border-slate-200/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
