'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Database,
  Download,
  Bell,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  fetchBuyerIntentAccounts,
  fetchBuyerIntentReporting,
  type BuyerIntentAccount,
  type BuyerIntentReportingData,
  type IcpFilterCriteria,
  EMPTY_REPORTING_DATA,
} from '@/lib/api/buyer-intent';
import { useCompanyContext } from '@/context/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { IcpFilterPanel } from './IcpFilterPanel';
import { BuyerIntentReporting } from './BuyerIntentReporting';
import { BuyerIntentTable } from './BuyerIntentTable';
import { AccountDetailDrawer } from './AccountDetailDrawer';

interface BuyerIntentWorkspaceProps {
  companyId?: string | number;
}

export default function BuyerIntentWorkspace({ companyId }: BuyerIntentWorkspaceProps) {
  const { activeCompany } = useCompanyContext();
  const { user } = useAuth();
  const effectiveCompanyId = companyId ?? activeCompany?.id ?? user?.company_id;

  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de dados
  const [accounts, setAccounts] = useState<BuyerIntentAccount[]>([]);
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [reportingData, setReportingData] =
    useState<BuyerIntentReportingData>(EMPTY_REPORTING_DATA);

  // Filtros de ICP
  const [filters, setFilters] = useState<IcpFilterCriteria>({
    date_range: '30d',
    buying_stage: 'all',
    activity_level: 'all',
  });

  // Drawer de Detalhes
  const [selectedAccount, setSelectedAccount] = useState<BuyerIntentAccount | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = useCallback(
    async (appliedFilters: IcpFilterCriteria, isSilent = false) => {
      if (!effectiveCompanyId) {
        setAccounts([]);
        setTotalAccounts(0);
        setReportingData(EMPTY_REPORTING_DATA);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (!isSilent) setLoading(true);
        const [accRes, repRes] = await Promise.all([
          fetchBuyerIntentAccounts(effectiveCompanyId, appliedFilters),
          fetchBuyerIntentReporting(effectiveCompanyId),
        ]);

        setAccounts(accRes.scores);
        setTotalAccounts(accRes.total);
        setReportingData(repRes);
      } catch (err) {
        console.error('[BuyerIntentWorkspace] Erro ao carregar dados:', err);
        toast({
          title: 'Erro ao sincronizar',
          description: 'Não foi possível carregar os sinais de intenção em tempo real.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [effectiveCompanyId, toast]
  );

  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(filters, true);
  };

  const handleFilterChange = (newFilters: IcpFilterCriteria) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      date_range: '30d',
      buying_stage: 'all',
      activity_level: 'all',
      search_query: '',
    });
  };

  const handleSelectAccount = (acc: BuyerIntentAccount) => {
    setSelectedAccount(acc);
    setIsDrawerOpen(true);
  };

  const handleDownloadCsv = () => {
    const url = `/api/v1/intent_scores/export_csv?company_id=${companyId}`;
    window.open(url, '_blank');
    toast({
      title: 'Download iniciado',
      description: 'O arquivo CSV de resumo por organização compradora foi gerado.',
    });
  };

  const handleDownloadDetailCsv = () => {
    const url = `/api/v1/intent_scores/export_detail_csv?company_id=${companyId}`;
    window.open(url, '_blank');
    toast({
      title: 'Download iniciado',
      description: 'O arquivo Detail CSV de sinais granulares foi gerado com sucesso.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Topo do Header: Título, Badge de Assinatura Enterprise e Ações */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Buyer Intent Platform
            </h1>
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-white shadow-xs">
              <Sparkles className="mr-1 h-3 w-3" />
              Padrão G2 Enterprise
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Inteligência de intenção de compra: identifique em tempo real quais empresas estão
            pesquisando seu perfil, simulando orçamentos ou comparando você com concorrentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar Sinais
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadCsv}
            className="h-9 gap-1.5 bg-amber-500 font-semibold text-xs text-white shadow-xs hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* 1. Painel de Filtros de ICP (Match Your Ideal Customer Profile) */}
      <IcpFilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* 2. Painel de Relatórios Agregados (Buyer Intent Reporting) */}
      <BuyerIntentReporting
        data={reportingData}
        onSelectStage={(stage) => handleFilterChange({ ...filters, buying_stage: stage })}
      />

      {/* 3. Tabela de Contas (Buyer Intent Insights) */}
      <BuyerIntentTable
        accounts={accounts}
        total={totalAccounts}
        onSelectAccount={handleSelectAccount}
        onDownloadCsv={handleDownloadCsv}
        onDownloadDetailCsv={handleDownloadDetailCsv}
        onSearchChange={(q) => handleFilterChange({ ...filters, search_query: q })}
      />

      {/* 4. Drawer de Atividade Detalhada (Detailed Company Activity) */}
      <AccountDetailDrawer
        account={selectedAccount}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
