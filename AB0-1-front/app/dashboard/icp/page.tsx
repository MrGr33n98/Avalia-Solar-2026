'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/context/CompanyContext';
import { useCompanyDashboardData } from '../hooks/useCompanyDashboardData';
import { useIcpProfile } from '@/hooks/useIcpProfile';
import { useIcpForm } from '@/hooks/useIcpForm';
import { useIcpScorePreview } from '@/hooks/useIcpScorePreview';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { toast } from 'sonner';

// Swiss Style Components
import { IcpPageHeader } from '@/components/dashboard/icp/IcpPageHeader';
import { IcpFinancialSection } from '@/components/dashboard/icp/IcpFinancialSection';
import { IcpMobilitySection } from '@/components/dashboard/icp/IcpMobilitySection';
import { IcpPropertySection } from '@/components/dashboard/icp/IcpPropertySection';
import { IcpLocationSection } from '@/components/dashboard/icp/IcpLocationSection';
import { IcpDecisionSection } from '@/components/dashboard/icp/IcpDecisionSection';
import { IcpStrictnessCard } from '@/components/dashboard/icp/IcpStrictnessCard';
import { IcpSummaryCard } from '@/components/dashboard/icp/IcpSummaryCard';
import { IcpImpactCard } from '@/components/dashboard/icp/IcpImpactCard';
import { IcpActionsCard } from '@/components/dashboard/icp/IcpActionsCard';
import { IcpMobileActionBar } from '@/components/dashboard/icp/IcpMobileActionBar';
import { IcpSkeleton } from '@/components/dashboard/icp/IcpSkeleton';

// Layout Components
import EnterpriseSidebar from '../components/EnterpriseSidebar';
import DashboardToolbar from '../components/DashboardToolbar';
import MobileDashboardQuickAccess from '../components/MobileDashboardQuickAccess';
import ThemeToggle from '../components/ThemeToggle';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IcpPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeCompany, isLoading: companyLoading } = useCompanyContext();

  const companyId = activeCompany?.id ? String(activeCompany.id) : '';

  const {
    loading: dashboardDataLoading,
    company,
    stats,
    featureAccess,
  } = useCompanyDashboardData(companyId);

  // ICP Data & Mutations
  const {
    profile,
    loading: profileLoading,
    updateProfile,
    refetch,
  } = useIcpProfile(companyId);

  // States for save feedback
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  // Gating check - Pro or Enterprise required for advanced features
  // If plan is 'free', some sections are locked/gated.
  const isPremium = company?.plan_tier && company.plan_tier !== 'free';

  const handleFormSubmit = async (data: any) => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError(false);

      // Save Rules
      await updateProfile(data);
      
      setSaveSuccess(true);
      toast.success('Regras de ICP salvas com sucesso!');
      
      // Clear success state after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(true);
      toast.error('Erro ao salvar as configurações do ICP.');
    } finally {
      setSaving(false);
    }
  };

  const { form, onSubmit, isDirty, reset } = useIcpForm({
    initialData: profile,
    onSubmit: handleFormSubmit,
  });

  // Calculate live score preview based on form values
  const formValues = form.watch();
  const scorePreview = useIcpScorePreview(formValues);

  // Handle unsaved changes block
  useUnsavedChanges(isDirty);

  // Actions
  const handleToggleActive = async () => {
    try {
      const nextActive = !profile?.auto_reject_out_of_icp;
      await updateProfile({
        ...formValues,
        auto_reject_out_of_icp: nextActive,
      });
      refetch();
    } catch (err) {
      toast.error('Erro ao alterar status de ativação.');
    }
  };

  const handleResetToDefaults = () => {
    form.reset({
      min_monthly_bill: 1500,
      min_system_kwp: 5,
      min_ev_chargers_count: 1,
      min_ev_vehicles_count: 0,
      ev_active: false,
      strictness_level: 'balanced',
      auto_reject_out_of_icp: false,
      notify_only_high_match: false,
      nationwide: false,
      target_audiences: ['commercial', 'residential'],
      preferred_roof_types: ['colonial', 'metalico'],
      ev_charger_types: ['ac_wallbox'],
      target_states: ['SP', 'RJ'],
      decision_profiles: ['decision_maker'],
      motivations: ['bill_savings'],
    });
    toast.success('Configurações resetadas para o padrão recomendado.');
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formValues, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `icp-config-${companyId || 'company'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Configuração JSON exportada com sucesso.');
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setThemeMode(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Auth Redirects
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?return_to=%2Fdashboard%2Ficp');
    }
  }, [user, authLoading, router]);

  if (authLoading || companyLoading || profileLoading || dashboardDataLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-6 lg:p-8">
        <IcpSkeleton />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0B1F3A] flex flex-col md:flex-row">
      {/* Sidebar navigation */}
      <EnterpriseSidebar
        activeTab="icp-config"
        onTabChange={(tab) => {
          if (tab === 'live-inbox') router.push('/dashboard/inbox');
          else router.push(`/dashboard?tab=${tab}`);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCount={stats?.pendingApprovals || 0}
        pendingReviewsCount={stats?.pendingReviewsCount || 0}
        visibleTabIds={[]}
      />

      <div className="flex-1 lg:pl-[var(--enterprise-sidebar-width,240px)] flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6 pb-24 md:pb-8">
          {/* Quick Access toolbar for Mobile */}
          <MobileDashboardQuickAccess
            activeTab="icp-config"
            company={company}
            stats={stats}
            onTabChange={() => {}}
            onOpenNavigation={() => setSidebarOpen(true)}
            visibleTabIds={[]}
          />

          <DashboardToolbar
            company={company}
            onTabChange={() => {}}
            themeToggle={<ThemeToggle onThemeChange={handleThemeChange} />}
          />

          {/* Page Header */}
          <IcpPageHeader
            isActive={!!profile?.auto_reject_out_of_icp}
            isDirty={isDirty}
            updatedAt={profile?.updated_at}
            onSave={onSubmit}
            saving={saving}
            saveSuccess={saveSuccess}
            saveError={saveError}
            onTutorialClick={() => toast.info('O motor de match qualifica leads cruzando dados em tempo real. Ajuste faturas mínimas e regiões de cobertura para ver a simulação do score na barra lateral.')}
          />

          <FormProvider {...form}>
            <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Main Content Column (72% approximate) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. Investimento e Faturamento */}
                <IcpFinancialSection form={form} />

                {/* 2. Mobilidade Elétrica e Carregadores EV */}
                <div className="relative">
                  {!isPremium && (
                    <div className="absolute inset-0 bg-[#F5F7FA]/75 backdrop-blur-[1px] z-10 rounded-md border border-[#D8DEE8] flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <div className="h-10 w-10 rounded-full bg-[#EEF4FF] flex items-center justify-center">
                        <Lock className="h-4.5 w-4.5 text-[#1F5EFF]" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#0B1F3A]">Critérios Avançados Bloqueados</h4>
                      <p className="text-[11px] text-[#526071] max-w-sm">
                        Configurações detalhadas de Mobilidade Elétrica e Carregadores EV são exclusivas para parceiros nos planos Pro e Enterprise.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => router.push('/dashboard?tab=product-pricing')}
                        className="bg-[#1F5EFF] hover:bg-[#1749CC] text-white text-[10px] uppercase font-black px-4 rounded-sm tracking-wider"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Fazer Upgrade
                      </Button>
                    </div>
                  )}
                  <IcpMobilitySection form={form} />
                </div>

                {/* 3. Tipo de Imóvel e Estrutura */}
                <IcpPropertySection form={form} />

                {/* 4. Localização Geográfica */}
                <IcpLocationSection form={form} />

                {/* 5. Comportamento e Tomada de Decisão */}
                <IcpDecisionSection form={form} />

              </div>

              {/* Sidebar Column (28% approximate) */}
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[88px]">
                
                {/* Nível de Rigor */}
                <IcpStrictnessCard form={form} />

                {/* Resumo do ICP */}
                <IcpSummaryCard
                  preview={scorePreview}
                  isActive={!!profile?.auto_reject_out_of_icp}
                />

                {/* Funcionamento do Cálculo */}
                <IcpImpactCard />

                {/* Ações Secundárias e Destrutivas */}
                <IcpActionsCard
                  isActive={!!profile?.auto_reject_out_of_icp}
                  onDeactivate={handleToggleActive}
                  onReset={handleResetToDefaults}
                  onExport={handleExportJson}
                />

              </div>

            </form>
          </FormProvider>
        </main>
      </div>

      {/* Floating Bottom Bar for Mobile Devices */}
      <IcpMobileActionBar
        onBack={() => router.push('/dashboard')}
        onSave={onSubmit}
        saving={saving}
        isDirty={isDirty}
      />
    </div>
  );
}
