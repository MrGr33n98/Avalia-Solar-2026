"use client";

import { ReactNode, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyContext } from "@/context/CompanyContext";
import { useCompanyDashboardData } from "../hooks/useCompanyDashboardData";
import { getFlatNavigationByContext } from "@/config/navigation";
import { getFeatureAccessEntry, isFeatureHiddenEntry } from "@/lib/feature-access";

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

const DASHBOARD_TAB_FEATURE_KEYS: Record<string, string> = {
  analytics: 'advanced_analytics',
  leads: 'leads_marketplace',
  integrations: 'webhooks',
  'product-banner': 'promo_banner',
  'product-sponsored-description': 'sponsored_description',
  'product-downloads': 'downloadable_materials',
  materials: 'downloadable_materials',
  'product-videos': 'media_gallery',
  'product-images': 'media_gallery',
  media: 'media_gallery',
  chat: 'p2p_chat',
  'live-inbox': 'ai_live_inbox',
};

const ALWAYS_VISIBLE_TABS = new Set<string>(['media']);

/**
 * Envelopa páginas do dashboard que estão "soltas" (como /dashboard/notifications),
 * injetando a sidebar e o header corretos de acordo com a Role do usuário.
 */
export default function RoleBasedDashboardLayout({ 
  children, 
  className,
  activeTab = 'notifications'
}: RoleBasedDashboardLayoutProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeCompany } = useCompanyContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const companyId = activeCompany?.id ? String(activeCompany.id) : '';
  const { stats, featureAccess } = useCompanyDashboardData(companyId);

  const tabAccessEntries = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(DASHBOARD_TAB_FEATURE_KEYS).map(([tabId, featureKey]) => [
          tabId,
          getFeatureAccessEntry(featureAccess, featureKey),
        ])
      ),
    [featureAccess]
  );

  const visibleTabIds = useMemo(
    () =>
      getFlatNavigationByContext('operational')
        .map((item) => item.id)
        .filter(
          (tabId) =>
            ALWAYS_VISIBLE_TABS.has(tabId) || !isFeatureHiddenEntry(tabAccessEntries[tabId])
        ),
    [tabAccessEntries]
  );

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

  const handleTabChange = (tab: string) => {
    if (tab === 'live-inbox') {
      router.push('/dashboard/inbox');
    } else if (tab === 'icp-config') {
      router.push('/dashboard/icp');
    } else if (tab === 'quote-form') {
      router.push(`/dashboard/quote-form?company_id=${companyId}`);
    } else {
      router.push(`/dashboard?tab=${tab}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[hsl(var(--clay-bg))]">
      {/* SIDEBAR DINÂMICA */}
      {isAdmin ? (
        <DashboardSidebar />
      ) : (
        <EnterpriseSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          pendingCount={stats?.pendingApprovals || 0}
          pendingReviewsCount={stats?.pendingReviewsCount || 0}
          visibleTabIds={visibleTabIds}
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
              onTabChange={handleTabChange}
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

