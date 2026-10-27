'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import CRMSidebar from '@/components/sales/layout/CRMSidebar';
import CRMTopbar from '@/components/sales/layout/CRMTopbar';
import SettingsSubSidebar from '@/components/sales/layout/SettingsSubSidebar';
import ReportsSubSidebar from '@/components/sales/layout/ReportsSubSidebar';
import CRMCommandPalette from '@/components/sales/CRMCommandPalette';
import CRMGlobalCreateHost from '@/components/sales/create/CRMGlobalCreateHost';
import CRMMobileBottomNav from '@/components/sales/layout/CRMMobileBottomNav';
import CRMMobileMoreSheet from '@/components/sales/layout/CRMMobileMoreSheet';

interface SalesLayoutWrapperProps {
  children: ReactNode;
}

export default function SalesLayoutWrapper({ children }: SalesLayoutWrapperProps) {
  const pathname = usePathname();
  const isSettings = pathname?.startsWith('/dashboard/sales/settings') ?? false;
  const isWallboard = pathname === '/dashboard/sales/reports/wallboard';
  const isReports = (pathname?.startsWith('/dashboard/sales/reports') ?? false) && !isWallboard;

  const [searchOpen, setSearchOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<string | null>(null);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-sky-100 selection:text-sky-900">
      {/* Primary Navy Sidebar */}
      {!isWallboard && (
        <CRMSidebar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenAddModal={(type) => setAddModalType(type)}
        />
      )}

      {/* Secondary Settings Sub-Sidebar (Appears on /settings/*) */}
      {isSettings && <SettingsSubSidebar />}

      {/* Secondary Reports Sub-Sidebar (Appears on /reports/*) */}
      {isReports && <ReportsSubSidebar />}

      {/* Main Clean Viewport with Topbar */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <CRMTopbar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenAddModal={(type) => setAddModalType(type)}
        />
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto pb-16 md:pb-0">
          <div className="mx-auto w-full max-w-[1600px] min-w-0 p-3 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* PWA Mobile Bottom Navigation */}
      <CRMMobileBottomNav onOpenMore={() => setMoreSheetOpen(true)} />

      {/* Mobile More Actions & Modules Sheet */}
      <CRMMobileMoreSheet
        open={moreSheetOpen}
        onOpenChange={setMoreSheetOpen}
        onOpenAddModal={(type) => setAddModalType(type)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Global Modals & Palette */}
      <CRMGlobalCreateHost modalType={addModalType} onClose={() => setAddModalType(null)} />
      <CRMCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
