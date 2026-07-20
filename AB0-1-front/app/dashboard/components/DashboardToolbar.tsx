'use client';

import { Download } from 'lucide-react';
import { CommandMenu } from './CommandMenu';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics/lazy';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardToolbarProps {
  company: any;
  onTabChange: (tabId: string) => void;
  themeToggle?: React.ReactNode;
}

export default function DashboardToolbar({ company, onTabChange, themeToggle }: DashboardToolbarProps) {
  const { user } = useAuth();

  const handleExportCSV = () => {
    track('Report Exported', {
      export_type: 'csv',
      company_id: company?.id,
      user_id: user?.id
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Métrica,Valor\n"
      + `Nome da Empresa,${company?.name || 'N/A'}\n`
      + `Visualizações de Perfil,${company?.stats?.profile_views || 0}\n`
      + `Cliques em CTA,${company?.stats?.cta_clicks || 0}\n`
      + `Leads Recebidos,${company?.stats?.leads_received || 0}\n`
      + `Média de Avaliações,${company?.stats?.average_rating || 0}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_dashboard_${company?.id || 'empresa'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mb-6 bg-white border border-slate-100 p-2 sm:p-3 rounded-xl shadow-sm">
      <div className="flex-1 w-full max-w-md hidden md:block">
        <CommandMenu onSelectTab={onTabChange} />
      </div>
      
      <div className="flex items-center gap-2 justify-end w-full md:w-auto">
        <div className="md:hidden flex-1 max-w-[200px]">
          <CommandMenu onSelectTab={onTabChange} />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200">
              <Download className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Relatórios</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200">
            <DropdownMenuLabel>Opções de Exportação</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem className="cursor-pointer hover:bg-slate-50" onClick={handleExportCSV}>
              Exportar visão geral (.csv)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {themeToggle && (
          <div className="h-9 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md px-1 hover:bg-slate-100 transition-colors">
            {themeToggle}
          </div>
        )}
      </div>
    </div>
  );
}
