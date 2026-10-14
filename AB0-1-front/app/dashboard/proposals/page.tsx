import { Suspense } from 'react';
import RoleBasedDashboardLayout from '../components/RoleBasedDashboardLayout';
import { CompanyMarketplaceProposalsWorkspace } from '@/components/company-dashboard/CompanyMarketplaceProposalsWorkspace';

export default function DashboardProposalsPage() {
  return (
    <RoleBasedDashboardLayout
      activeTab="proposals"
      className="p-2 sm:p-3 lg:p-4 overflow-hidden h-[calc(100dvh-68px)] flex flex-col"
    >
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Carregando propostas...</div>}>
        <CompanyMarketplaceProposalsWorkspace />
      </Suspense>
    </RoleBasedDashboardLayout>
  );
}
