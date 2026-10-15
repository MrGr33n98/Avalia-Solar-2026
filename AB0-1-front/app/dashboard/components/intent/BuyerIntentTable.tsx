'use client';

import React, { useState } from 'react';
import {
  Download,
  Search,
  Eye,
  GitCompare,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Flame,
  Zap,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  type BuyerIntentAccount,
  type BuyingStage,
  type ActivityLevel,
} from '@/lib/api/buyer-intent';

interface BuyerIntentTableProps {
  accounts: BuyerIntentAccount[];
  total: number;
  onSelectAccount: (account: BuyerIntentAccount) => void;
  onDownloadCsv: () => void;
  onDownloadDetailCsv: () => void;
  onSearchChange: (query: string) => void;
}

export function BuyerIntentTable({
  accounts,
  total,
  onSelectAccount,
  onDownloadCsv,
  onDownloadDetailCsv,
  onSearchChange,
}: BuyerIntentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchTerm(v);
    onSearchChange(v);
  };

  const renderStageBadge = (stage: BuyingStage) => {
    switch (stage) {
      case 'decision':
        return (
          <Badge className="border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
            <Flame className="mr-1 h-3 w-3" />
            Decisão
          </Badge>
        );
      case 'consideration':
        return (
          <Badge className="border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
            <Zap className="mr-1 h-3 w-3" />
            Avaliação
          </Badge>
        );
      case 'awareness':
      default:
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
            <Eye className="mr-1 h-3 w-3" />
            Descoberta
          </Badge>
        );
    }
  };

  const renderActivityBadge = (level: ActivityLevel) => {
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Alta
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            Média
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            Baixa
          </span>
        );
    }
  };

  const formatLastSeen = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    return `Há ${diffDays} dias`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Barra Superior da Tabela: Título, Busca e Exportação CSV */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Organizações com Intenção Detectada (Buyer Intent Insights)
            </h3>
            <Badge variant="secondary" className="text-xs">
              {total} contas
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Dados enriquecidos de empresas e tomadores de decisão pesquisando sua solução no Avalia Solar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por conta ou cidade..."
              value={searchTerm}
              onChange={handleSearch}
              className="h-9 pl-9 text-xs"
            />
          </div>

          {/* Botões de Exportação */}
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadCsv}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadDetailCsv}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Detail CSV
          </Button>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
            <tr>
              <th className="py-3 pl-5 pr-3">Organização / Comprador</th>
              <th className="px-3 py-3">Estágio de Compra</th>
              <th className="px-3 py-3">Nível de Atividade</th>
              <th className="px-3 py-3">Sede / Região</th>
              <th className="px-3 py-3">Último Sinal</th>
              <th className="px-3 py-3">Comparado Com</th>
              <th className="px-3 py-3 text-center">Visualizações</th>
              <th className="px-3 py-3 text-center">Visitantes</th>
              <th className="py-3 pl-3 pr-5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  Nenhuma organização encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr
                  key={acc.id}
                  onClick={() => onSelectAccount(acc)}
                  className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  {/* Nome da Conta */}
                  <td className="py-3.5 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 font-bold text-xs text-white shadow-xs">
                        {acc.account_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                          {acc.account_name}
                        </div>
                        <div className="text-[11px] text-slate-500">{acc.segment || 'Setor Solar / Comercial'}</div>
                      </div>
                    </div>
                  </td>

                  {/* Buying Stage */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    {renderStageBadge(acc.buying_stage)}
                  </td>

                  {/* Activity Level */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    {renderActivityBadge(acc.activity_level)}
                  </td>

                  {/* Localização */}
                  <td className="px-3 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{acc.location}</span>
                    </div>
                  </td>

                  {/* Last Seen */}
                  <td className="px-3 py-3.5 text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{formatLastSeen(acc.last_interaction_at)}</span>
                    </div>
                  </td>

                  {/* Compared To */}
                  <td className="px-3 py-3.5">
                    {acc.compared_competitors && acc.compared_competitors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {acc.compared_competitors.map((comp) => (
                          <Badge
                            key={comp.name}
                            variant="secondary"
                            className="bg-indigo-50 text-[10px] text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                          >
                            vs {comp.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Pageviews */}
                  <td className="px-3 py-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    <span title={`Diretas: ${acc.direct_pageviews} | Concorrentes: ${acc.competitive_pageviews}`}>
                      {acc.direct_pageviews + acc.competitive_pageviews}
                    </span>
                  </td>

                  {/* Unique Visitors */}
                  <td className="px-3 py-3.5 text-center font-medium text-slate-600 dark:text-slate-400">
                    {acc.unique_visitors}
                  </td>

                  {/* Ação */}
                  <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
                    >
                      <span>Ver Detalhes</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
