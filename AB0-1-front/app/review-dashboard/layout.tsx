import { ReviewerDashboardShell } from '@/components/review-dashboard/layout/ReviewerDashboardShell';
import { DashboardDataProvider } from './DashboardLayoutClient';

export default function ReviewDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardDataProvider>
      <ReviewerDashboardShell>{children}</ReviewerDashboardShell>
    </DashboardDataProvider>
  );
}
