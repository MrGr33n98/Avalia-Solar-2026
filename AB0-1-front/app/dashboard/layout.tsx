import type { ReactNode } from 'react';
import OfflineStatusBar from './components/OfflineStatusBar';

interface DashboardRootLayoutProps {
  children: ReactNode;
}

export default function DashboardRootLayout({ children }: DashboardRootLayoutProps) {
  return (
    <div
      className="dashboard-root-shell min-h-dvh"
      data-dashboard-shell="true"
      aria-label="Área logada do dashboard"
    >
      <OfflineStatusBar />
      {children}
    </div>
  );
}
