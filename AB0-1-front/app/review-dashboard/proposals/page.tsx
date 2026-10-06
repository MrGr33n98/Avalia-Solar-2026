import { MarketplaceProposalsWorkspace } from '@/components/reviewer/MarketplaceProposalsWorkspace';

export default function ReviewDashboardProposalsPage() {
  return (
    <Suspense fallback={<p role="status">Carregando propostas…</p>}>
      <MarketplaceProposalsWorkspace />
    </Suspense>
  );
}
import { Suspense } from 'react';
