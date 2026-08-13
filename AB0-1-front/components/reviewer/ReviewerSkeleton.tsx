export function ReviewerSkeleton() {
  return <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Carregando dashboard">
    <div className="h-10 w-64 rounded bg-slate-200" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded-2xl bg-white shadow-sm" />)}</div>
    <div className="h-48 rounded-2xl bg-white shadow-sm" />
  </div>;
}
