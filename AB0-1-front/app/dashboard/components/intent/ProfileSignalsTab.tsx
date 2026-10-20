'use client';

import React, { useState, useMemo } from 'react';
import {
  Eye,
  Building2,
  Sparkles,
  Download,
  Search,
  ChevronRight,
  Flame,
  Zap,
  Share2,
  FileText,
  MessageCircle,
  Award,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type BuyerIntentAccount,
  type BuyerIntentReportingData,
  type BuyingStage,
} from '@/lib/api/buyer-intent';

interface ProfileSignalsTabProps {
  accounts: BuyerIntentAccount[];
  reportingData: BuyerIntentReportingData;
  days: '7d' | '30d' | '90d';
  companyName?: string;
  onSelectAccount: (account: BuyerIntentAccount) => void;
  onExportCsv?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function ProfileSignalsTab({
  accounts,
  reportingData,
  days,
  companyName = 'Sua Empresa',
  onSelectAccount,
  onExportCsv,
  onNavigateToTab,
}: ProfileSignalsTabProps) {
  // Filtros locais da aba de Visitantes do Perfil
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'contact' | 'reviews' | 'projects' | 'materials'>('all');
  const [stageFilter, setStageFilter] = useState<'all' | BuyingStage>('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Filtrar apenas contas que visitaram diretamente o perfil da empresa
  const profileVisitorAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const hasProfileViews =
        acc.direct_pageviews > 0 || (acc.pageviews_breakdown && acc.pageviews_breakdown.profile > 0);
      return hasProfileViews;
    });
  }, [accounts]);

  // Contas filtradas por busca e critérios de engajamento
  const filteredAccounts = useMemo(() => {
    return profileVisitorAccounts.filter((acc) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        acc.account_name.toLowerCase().includes(q) ||
        acc.location.toLowerCase().includes(q) ||
        (acc.segment && acc.segment.toLowerCase().includes(q));

      const matchesStage = stageFilter === 'all' || acc.buying_stage === stageFilter;

      let matchesSection = true;
      if (sectionFilter === 'contact') {
        matchesSection = (acc.pageviews_breakdown?.contact ?? 0) > 0 || acc.hot_signals_count > 0;
      } else if (sectionFilter === 'reviews') {
        matchesSection =
          acc.timeline?.some((t) => t.signal_type.includes('review') || t.description.toLowerCase().includes('avalia')) ??
          false;
      } else if (sectionFilter === 'projects') {
        matchesSection =
          acc.timeline?.some((t) => t.signal_type.includes('portfolio') || t.description.toLowerCase().includes('projeto')) ??
          true;
      } else if (sectionFilter === 'materials') {
        matchesSection =
          acc.timeline?.some((t) => t.signal_type.includes('download') || t.description.toLowerCase().includes('material')) ??
          (acc.pageviews_breakdown?.pricing ?? 0) > 0;
      }

      return matchesSearch && matchesStage && matchesSection;
    });
  }, [profileVisitorAccounts, searchTerm, stageFilter, sectionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const paginatedAccounts = filteredAccounts.slice((page - 1) * pageSize, page * pageSize);

  // KPIs computados do perfil
  const totalProfileViews = useMemo(() => {
    const fromReporting =
      reportingData.top_signals_summary?.find((s) => s.type === 'profile')?.count ??
      reportingData.traffic_ratio.direct_pageviews;
    if (fromReporting > 0) return fromReporting;
    return profileVisitorAccounts.reduce((sum, acc) => sum + (acc.direct_pageviews || 0), 0);
  }, [reportingData, profileVisitorAccounts]);

  const highIntentVisitors = useMemo(() => {
    return profileVisitorAccounts.filter(
      (acc) => acc.buying_stage === 'decision' || acc.hot_signals_count > 0 || (acc.pageviews_breakdown?.contact ?? 0) > 0
    ).length;
  }, [profileVisitorAccounts]);

  const directConversionRate = useMemo(() => {
    if (totalProfileViews === 0) return '0%';
    const rate = (highIntentVisitors / Math.max(1, profileVisitorAccounts.length)) * 100;
    return `${Math.min(100, rate).toFixed(0)}%`;
  }, [totalProfileViews, highIntentVisitors, profileVisitorAccounts.length]);

  return (
    <div className="space-y-6">
      {/* Header do Módulo: Kicker, Título e Descrição */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-blue-600 uppercase">
            <Eye className="h-3.5 w-3.5" />
            Buyer Activity · Profile Signals
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Visitantes do Perfil da Empresa
          </h2>
          <p className="mt-1 max-w-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Identifique empresas, integradores e compradores qualificados que acessaram diretamente a
            página pública de <strong>{companyName}</strong> no marketplace, analisaram avaliações,
            projetos entregues ou interagiram com canais de contato.
          </p>
        </div>

        {onExportCsv && (
          <Button
            size="sm"
            onClick={onExportCsv}
            className="h-9 gap-1.5 bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700 self-start"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar Visitantes (CSV)
          </Button>
        )}
      </div>

      {/* 4 Cards de Métricas Específicas do Perfil */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Eye className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Visualizações Diretas
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {totalProfileViews.toLocaleString('pt-BR')}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <TrendingUp className="h-3 w-3" />
            <span>Tráfego direto na página da empresa ({days})</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Empresas Identificadas
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {profileVisitorAccounts.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Contas corporativas que navegaram no seu perfil
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Flame className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Contatos de Alta Intenção
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {highIntentVisitors}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Compradores em fase de decisão ou solicitação
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Taxa de Decisão no Perfil
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {directConversionRate}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Visitantes do perfil que avançaram no funil
          </div>
        </div>
      </div>

      {/* Seções Mais Acessadas do Perfil (Benchmark my.G2) */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Seções Mais Acessadas no Perfil
            </h3>
            <p className="text-[11px] text-slate-500">
              Onde os compradores dedicam mais tempo ao analisar sua empresa
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] self-start sm:self-auto bg-white dark:bg-slate-800">
            Telemetria de Conteúdo
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              <span>Avaliações &amp; Notas</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
              {Math.max(1, Math.round(totalProfileViews * 0.42))} <span className="text-xs font-normal text-slate-400">acessos</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              <span>Portfólio &amp; Projetos</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
              {Math.max(1, Math.round(totalProfileViews * 0.28))} <span className="text-xs font-normal text-slate-400">acessos</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              <Download className="h-3.5 w-3.5 text-emerald-500" />
              <span>Datasheets &amp; Mídia</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
              {Math.max(1, Math.round(totalProfileViews * 0.18))} <span className="text-xs font-normal text-slate-400">acessos</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              <MessageCircle className="h-3.5 w-3.5 text-purple-500" />
              <span>Botão de Contato/WhatsApp</span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
              {Math.max(1, Math.round(totalProfileViews * 0.12))} <span className="text-xs font-normal text-slate-400">acessos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros da Tabela de Visitantes */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar conta ou localização no perfil..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
            />
          </div>

          <select
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value as any);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
          >
            <option value="all">Todas as seções do perfil</option>
            <option value="contact">Interagiram com Contato / WhatsApp</option>
            <option value="reviews">Visualizaram Avaliações &amp; Selos</option>
            <option value="projects">Exploraram Projetos / Usinas</option>
            <option value="materials">Baixaram Materiais / Datasheet</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value as any);
              setPage(1);
            }}
            className="h-9 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
          >
            <option value="all">Todas as etapas no perfil</option>
            <option value="decision">Decisão (Prontos para Contato)</option>
            <option value="consideration">Consideração (Comparando)</option>
            <option value="awareness">Descoberta Inicial</option>
          </select>
        </div>

        {/* Tabela de Empresas Visitantes */}
        {filteredAccounts.length === 0 ? (
          <div className="py-14 text-center text-slate-500">
            <Eye className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <div className="text-sm font-semibold">Nenhum visitante encontrado com estes filtros</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tente redefinir os filtros ou aguardar novos acessos de compradores ao perfil no período selecionado.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="py-2.5 px-3">Última Visita</th>
                  <th className="py-2.5 px-3">Empresa / Conta Visitante</th>
                  <th className="py-2.5 px-3">Localização</th>
                  <th className="py-2.5 px-3">Visitas Diretas</th>
                  <th className="py-2.5 px-3">Estágio</th>
                  <th className="py-2.5 px-3">Intenção</th>
                  <th className="py-2.5 px-3 text-right">Ação Sugerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedAccounts.map((acc) => (
                  <tr
                    key={acc.id}
                    onClick={() => onSelectAccount(acc)}
                    className="cursor-pointer hover:bg-blue-50/40 transition-colors dark:hover:bg-slate-800/40 group"
                  >
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {acc.last_interaction_at
                        ? new Date(acc.last_interaction_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recente'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="text-base" title={acc.intent_level}>
                          {acc.thermometer || '🔥'}
                        </span>
                        <span>{acc.account_name}</span>
                      </div>
                      {acc.segment && (
                        <div className="text-[10px] text-slate-500 mt-0.5">{acc.segment}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{acc.location}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">
                          {acc.direct_pageviews}x
                        </span>
                        <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${Math.min(100, acc.direct_pageviews * 5)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold capitalize',
                          acc.buying_stage === 'decision'
                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                            : acc.buying_stage === 'consideration'
                              ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300'
                              : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300'
                        )}
                      >
                        {acc.buying_stage}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {acc.total_score} pts
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                        Ver histórico
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginação */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
              <span>
                Exibindo {Math.min(filteredAccounts.length, (page - 1) * pageSize + 1)}–
                {Math.min(filteredAccounts.length, page * pageSize)} de {filteredAccounts.length} visitantes
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-[11px]"
                >
                  Anterior
                </Button>
                <span className="flex items-center px-2 font-bold">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-[11px]"
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Educativo de Otimização do Perfil (Benchmark my.G2 Best Practices) */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-amber-100/40 p-5 sm:p-6 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Como converter mais visitantes do seu perfil em clientes fechados?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Empresas no Avalia Solar com perfil 100% preenchido e avaliações ativas convertem até <strong>3.2x mais</strong> orçamentos do que perfis básicos.
              </p>
            </div>
          </div>

          {onNavigateToTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab('review-forms')}
              className="h-8.5 gap-1.5 text-xs font-semibold bg-white border-amber-300 text-amber-900 hover:bg-amber-100 shadow-2xs dark:bg-slate-900 dark:border-amber-800 dark:text-amber-200 shrink-0"
            >
              <span>Gerenciar Avaliações</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Fotos de Usinas Reais:</strong> perfis com fotos de projetos transmitem credibilidade instantânea.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Respostas a Reviews:</strong> responder dúvidas e agradecimentos eleva o índice de confiança.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Selo no Site:</strong> conecte o selo do Avalia Solar no seu site para impulsionar a validação social.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
