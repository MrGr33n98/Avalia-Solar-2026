import RoleBasedDashboardLayout from '../components/RoleBasedDashboardLayout';
import { CompanyMarketplaceProposalsWorkspace } from '@/components/company-dashboard/CompanyMarketplaceProposalsWorkspace';

export default function DashboardProposalsPage() {
  return (
    <RoleBasedDashboardLayout activeTab="proposals">
      <CompanyMarketplaceProposalsWorkspace />
    </RoleBasedDashboardLayout>
  );
}
