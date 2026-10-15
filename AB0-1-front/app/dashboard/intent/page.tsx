import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Buyer Intent Platform (G2 Standard) | Avalia Solar',
  description: 'Monitore sinais de intenção de compra, contas em pesquisa e ICP matching em tempo real.',
};

const BuyerIntentWorkspace = dynamic(
  () => import('../components/intent/BuyerIntentWorkspace'),
  {
    loading: () => <BuyerIntentSkeleton />,
    ssr: false,
  }
);

function BuyerIntentSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-4 w-[500px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-[140px] rounded-2xl" />
        <Skeleton className="h-[140px] rounded-2xl" />
        <Skeleton className="h-[140px] rounded-2xl" />
      </div>
      <Skeleton className="h-[360px] w-full rounded-2xl" />
    </div>
  );
}

export default function IntentDashboardPage() {
  // Padrão multi-tenant da empresa ativa no dashboard
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <Suspense fallback={<BuyerIntentSkeleton />}>
          <BuyerIntentWorkspace />
        </Suspense>
      </div>
    </div>
  );
}
