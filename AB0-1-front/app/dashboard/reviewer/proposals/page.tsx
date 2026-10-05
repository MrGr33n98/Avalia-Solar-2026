import { ReviewerShell } from '@/components/reviewer/ReviewerShell';
import { MarketplaceProposalsWorkspace } from '@/components/reviewer/MarketplaceProposalsWorkspace';

export default function ReviewerProposalsPage() {
  return (
    <ReviewerShell>
      <MarketplaceProposalsWorkspace />
    </ReviewerShell>
  );
}
