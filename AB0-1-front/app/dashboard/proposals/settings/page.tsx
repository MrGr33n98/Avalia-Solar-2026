import { Suspense } from 'react';
import RoleBasedDashboardLayout from '../../components/RoleBasedDashboardLayout';
import { ProposalSettingsStudio } from '@/components/company-dashboard/proposals/ProposalSettingsStudio';

export default function DashboardProposalSettingsPage() {
  return (
    <RoleBasedDashboardLayout
      activeTab="proposals"
      className="p-2 sm:p-4 overflow-hidden h-[calc(100dvh-68px)] flex flex-col"
    >
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Carregando configurações...</div>}>
        <ProposalSettingsStudio isStandalonePage />
      </Suspense>
    </RoleBasedDashboardLayout>
  );
}
