import { Suspense } from 'react';
import RoleBasedDashboardLayout from '../components/RoleBasedDashboardLayout';
import { CompanyMarketplaceProposalsWorkspace } from '@/components/company-dashboard/CompanyMarketplaceProposalsWorkspace';

export default function DashboardProposalsPage() {
  return (
    <RoleBasedDashboardLayout activeTab="proposals">
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Carregando propostas...</div>}>
        <CompanyMarketplaceProposalsWorkspace />
      </Suspense>
    </RoleBasedDashboardLayout>
  );
}
