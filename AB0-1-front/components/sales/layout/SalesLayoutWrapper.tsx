'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import CRMSidebar from '@/components/sales/layout/CRMSidebar';
import CRMTopbar from '@/components/sales/layout/CRMTopbar';
import SettingsSubSidebar from '@/components/sales/layout/SettingsSubSidebar';
import CRMCommandPalette from '@/components/sales/CRMCommandPalette';
import CRMGlobalCreateHost from '@/components/sales/create/CRMGlobalCreateHost';

interface SalesLayoutWrapperProps {
  children: ReactNode;
}

export default function SalesLayoutWrapper({ children }: SalesLayoutWrapperProps) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/dashboard/sales/settings');

  const [searchOpen, setSearchOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      {/* Primary Navy Sidebar */}
      <CRMSidebar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAddModal={(type) => setAddModalType(type)}
      />

      {/* Secondary Settings Sub-Sidebar (Appears on /settings/*) */}
      {isSettings && <SettingsSubSidebar />}

      {/* Main Clean Viewport with Topbar */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <CRMTopbar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenAddModal={(type) => setAddModalType(type)}
        />
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] min-w-0 p-3 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Global Modals & Palette */}
      <CRMGlobalCreateHost modalType={addModalType} onClose={() => setAddModalType(null)} />
      <CRMCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
