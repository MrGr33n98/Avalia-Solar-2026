import { ReviewerShell } from '@/components/reviewer/ReviewerShell';
import { MarketplaceProposalsWorkspace } from '@/components/reviewer/MarketplaceProposalsWorkspace';

export default function ReviewerProposalsPage() {
  return (
    <ReviewerShell>
      <Suspense fallback={<p role="status">Carregando propostas…</p>}>
        <MarketplaceProposalsWorkspace />
      </Suspense>
    </ReviewerShell>
  );
}
import { Suspense } from 'react';
