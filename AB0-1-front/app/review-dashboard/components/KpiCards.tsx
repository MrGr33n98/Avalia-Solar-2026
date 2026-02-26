'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Clock, MessageCircle, Star, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardsProps {
  data?: {
    quotes_total: number;
    quotes_open: number;
    quotes_replied: number;
    reviews_published: number;
  };
  loading?: boolean;
}

const kpiConfig = [
  { key: 'quotes_total', label: 'Orçamentos', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'quotes_open', label: 'Em Aberto', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },      
  { key: 'quotes_replied', label: 'Respondidos', icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'reviews_published', label: 'Reviews', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export function KpiCards({ data, loading }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-3xl shadow-sm border-slate-100 overflow-hidden">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = data?.[kpi.key as keyof typeof data] ?? 0;

        return (
          <Card key={kpi.key} className="rounded-3xl shadow-md border-none bg-white hover:shadow-xl transition-all hover:scale-[1.02] cursor-default group overflow-hidden relative">
            {/* Economy Indicator Quick Win */}
            {kpi.key === 'quotes_total' && (
               <div className="absolute top-0 right-0 p-2">
                 <div className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                   <TrendingUp className="h-3 w-3" />
                   ECONOMIA ESTIMADA
                 </div>
               </div>
            )}

            <CardContent className="p-5 md:p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-2xl ${kpi.bg} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                  <h3 className="text-3xl font-black text-slate-950 tracking-tight">{value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
