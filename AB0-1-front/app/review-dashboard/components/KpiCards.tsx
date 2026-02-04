import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Clock, MessageCircle, Star } from 'lucide-react';
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
  { key: 'quotes_total', label: 'Orçamentos solicitados', icon: ClipboardList, color: 'text-teal-600', bg: 'bg-teal-50' },
  { key: 'quotes_open', label: 'Em aberto', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'quotes_replied', label: 'Respondidos', icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'reviews_published', label: 'Reviews publicadas', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
];

export function KpiCards({ data, loading }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl shadow-sm border overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = data?.[kpi.key as keyof typeof data] ?? 0;

        return (
          <Card key={kpi.key} className="rounded-2xl shadow-sm border hover:shadow-md transition-shadow cursor-default">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${kpi.bg}`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
