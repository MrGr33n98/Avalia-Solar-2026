"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyContext } from "@/context/CompanyContext";

// System Admin Layout Components
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

// Company Layout Components
import EnterpriseSidebar from "./EnterpriseSidebar";
import DashboardToolbar from "./DashboardToolbar";

interface RoleBasedDashboardLayoutProps {
  children: ReactNode;
  className?: string;
  activeTab?: string;
}

/**
 * Envelopa páginas do dashboard que estão "soltas" (como /dashboard/notifications),
 * injetando a sidebar e o header corretos de acordo com a Role do usuário.
 */
export default function RoleBasedDashboardLayout({ 
  children, 
  className,
  activeTab = 'notifications'
}: RoleBasedDashboardLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const { activeCompany } = useCompanyContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Carregando painel...</p>
        </div>
      </div>
    );
  }

  const isAdmin = (user?.role as string) === 'admin' || (user?.role as string) === 'super_admin';

  return (
    <div className="flex min-h-screen bg-[hsl(var(--clay-bg))]">
      {/* SIDEBAR DINÂMICA */}
      {isAdmin ? (
        <DashboardSidebar />
      ) : (
        <EnterpriseSidebar 
          activeTab={activeTab} 
          onTabChange={() => {}} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* CONTEÚDO PRINCIPAL */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-[padding] duration-200",
        !isAdmin && "md:pl-[var(--enterprise-sidebar-width,112px)]"
      )}>
        {isAdmin ? (
          <DashboardHeader />
        ) : (
          <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <DashboardToolbar 
              company={activeCompany}
              onTabChange={() => {}}
              navigationOpen={isSidebarOpen}
              onToggleNavigation={() => setIsSidebarOpen((prev) => !prev)}
            />
          </div>
        )}
        
        <main className={cn(
          "flex-1 p-4 lg:p-8 overflow-auto",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
