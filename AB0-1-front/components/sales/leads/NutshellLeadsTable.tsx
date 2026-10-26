'use client';

import React, { useState, useMemo } from 'react';
import {
  Star,
  XCircle,
  ChevronsRight,
  ArrowUpDown,
  Columns,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface NutshellLeadItem {
  id: number;
  stageKey: string;
  stageName?: string;
  stagePosition?: number;
  company: string;
  plan: string;
  value: string;
  rawCents: number;
  probability: number;
  contact: string;
  contactPhone?: string | null;
  ownerName?: string | null;
  status: string;
  source?: string | null;
  createdAt?: string;
  expectedCloseDate?: string | null;
  accountId?: number;
  contactId?: number;
}

interface NutshellLeadsTableProps {
  leads: NutshellLeadItem[];
  onSelectLead: (lead: NutshellLeadItem) => void;
  totalStagesCount?: number;
}

// Formata tempo relativo em linguagem humana (Age)
function formatLeadAge(createdAtStr?: string): string {
  if (!createdAtStr) return '—';
  const created = new Date(createdAtStr);
  if (isNaN(created.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week';
  if (diffWeeks < 5) return `${diffWeeks} weeks`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month';
  if (diffMonths < 12) return `${diffMonths} months`;
  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? '1 year' : `${diffYears} years`;
}

// Formata data prevista ou real de fechamento
function formatCloseDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';

  const today = new Date();
  const isYesterday =
    today.getDate() - 1 === date.getDate() &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Régua Gráfica de 5 Barras Verticais (Nutshell Stage Progress Bar)
function StageProgressBar({
  position = 1,
  totalStages = 5,
  status = 'open',
}: {
  position?: number;
  totalStages?: number;
  status?: string;
}) {
  const TOTAL_BARS = 5;
  // Calcula quantas das 5 barras devem estar preenchidas
  let filledBars = 1;
  if (status === 'won') {
    filledBars = 5;
  } else if (status === 'lost') {
    filledBars = 0;
  } else {
    const ratio = Math.max(1, position) / Math.max(1, totalStages);
    filledBars = Math.min(5, Math.max(1, Math.round(ratio * TOTAL_BARS)));
  }

  return (
    <div
      className="inline-flex items-center gap-0.5"
      title={`Progresso: estágio ${position} de ${totalStages}`}
    >
      {[...Array(TOTAL_BARS)].map((_, i) => {
        const isFilled = i < filledBars;
        return (
          <span
            key={i}
            className={`w-1 h-3.5 rounded-2xs transition-colors ${
              isFilled ? 'bg-sky-600' : 'bg-slate-200'
            }`}
          />
        );
      })}
    </div>
  );
}

// Ícone de Status + ID Empilhado (Padrão Oficial Nutshell)
function StatusIdBadge({ status, id }: { status: string; id: number }) {
  const isWon = status === 'won';
  const isLost = status === 'lost';

  return (
    <div className="flex flex-col items-center justify-center shrink-0 w-8 select-none">
      {isWon ? (
        <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
      ) : isLost ? (
        <XCircle className="w-4 h-4 text-slate-500" />
      ) : (
        <ChevronsRight className="w-4 h-4 text-sky-600" />
      )}
      <span className="text-[10px] font-mono text-slate-500 font-semibold leading-tight mt-0.5">
        {id}
      </span>
    </div>
  );
}

type SortField = 'name' | 'age' | 'value' | 'confidence' | 'close_date';

export function NutshellLeadsTable({
  leads,
  onSelectLead,
  totalStagesCount = 5,
}: NutshellLeadsTableProps) {
  // Estado de Colunas Visíveis (Change columns)
  const [columns, setColumns] = useState({
    age: true,
    value: true,
    assignee: true,
    stage: true,
    confidence: true,
    closeDate: true,
    sources: true,
  });

  // Estado de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Estado de Ordenação
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Alterna Ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Dados Ordenados
  const sortedLeads = useMemo(() => {
    const list = [...leads];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.company || a.plan).localeCompare(b.company || b.plan);
          break;
        case 'value':
          comparison = (a.rawCents || 0) - (b.rawCents || 0);
          break;
        case 'confidence':
          comparison = (a.probability || 0) - (b.probability || 0);
          break;
        case 'age':
          comparison =
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'close_date':
          comparison =
            new Date(a.expectedCloseDate || 0).getTime() -
            new Date(b.expectedCloseDate || 0).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [leads, sortField, sortDirection]);

  // Paginação Calculada
  const totalLeads = sortedLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalLeads / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLeads);
  const currentLeads = sortedLeads.slice(startIndex, endIndex);

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* 1. Barra de Paginação Superior no Estilo Canônico Nutshell */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white text-xs">
        {/* Contagem: 1-50 of 115 */}
        <div className="font-semibold text-slate-700">
          {totalLeads > 0 ? (
            <span>
              {startIndex + 1}-{endIndex} of {totalLeads}
            </span>
          ) : (
            <span>0 leads</span>
          )}
        </div>

        {/* Navegação de Páginas: < Prev [1] 2 3 Next > */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-2 py-1 text-slate-600 font-semibold hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => {
            const isActive = pg === currentPage;
            return (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {pg}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-2 py-1 text-slate-600 font-semibold hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Botão Change columns com Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 font-semibold text-sky-700 hover:text-sky-900 transition-colors">
              <Columns className="w-3.5 h-3.5" />
              <span>Change columns</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2 text-xs">
            <p className="font-bold text-slate-800 pb-2 mb-1 border-b border-slate-100">
              Colunas Visíveis
            </p>
            <div className="space-y-1">
              {[
                { id: 'age', label: 'Age (Idade)' },
                { id: 'value', label: 'Value (Valor)' },
                { id: 'assignee', label: 'Assignee (Responsável)' },
                { id: 'stage', label: 'Stage (Estágio & Régua)' },
                { id: 'confidence', label: 'Confidence (Probabilidade)' },
                { id: 'closeDate', label: 'Close date (Fechamento)' },
                { id: 'sources', label: 'Sources (Origem)' },
              ].map((col) => {
                const key = col.id as keyof typeof columns;
                return (
                  <label
                    key={col.id}
                    className="flex items-center justify-between p-1 rounded-md hover:bg-slate-50 cursor-pointer"
                  >
                    <span className="text-slate-700">{col.label}</span>
                    <input
                      type="checkbox"
                      checked={columns[key]}
                      onChange={() =>
                        setColumns((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </label>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 2. TABELA DESKTOP (md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-white text-slate-900 font-bold border-b border-slate-200">
            <tr>
              {/* Lead name */}
              <th className="py-2.5 px-4">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 font-bold text-slate-900 hover:text-sky-700"
                >
                  Lead name
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>

              {/* Age */}
              {columns.age && (
                <th className="py-2.5 px-3">
                  <button
                    onClick={() => handleSort('age')}
                    className="flex items-center gap-1 font-bold text-slate-900 hover:text-sky-700"
                  >
                    Age
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
              )}

              {/* Value */}
              {columns.value && (
                <th className="py-2.5 px-3">
                  <button
                    onClick={() => handleSort('value')}
                    className="flex items-center gap-1 font-bold text-slate-900 hover:text-sky-700"
                  >
                    Value
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
              )}

              {/* Assignee */}
              {columns.assignee && (
                <th className="py-2.5 px-3 font-bold text-slate-900">Assignee</th>
              )}

              {/* Stage */}
              {columns.stage && (
                <th className="py-2.5 px-3 font-bold text-slate-900">Stage</th>
              )}

              {/* Confidence */}
              {columns.confidence && (
                <th className="py-2.5 px-3">
                  <button
                    onClick={() => handleSort('confidence')}
                    className="flex items-center gap-1 font-bold text-slate-900 hover:text-sky-700"
                  >
                    Confidence
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
              )}

              {/* Close date */}
              {columns.closeDate && (
                <th className="py-2.5 px-3">
                  <button
                    onClick={() => handleSort('close_date')}
                    className="flex items-center gap-1 font-bold text-slate-900 hover:text-sky-700"
                  >
                    Close date
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
              )}

              {/* Sources */}
              {columns.sources && (
                <th className="py-2.5 px-4 font-bold text-slate-900">Sources</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {currentLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                  Nenhum lead encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              currentLeads.map((deal) => (
                <tr
                  key={deal.id}
                  onClick={() => onSelectLead(deal)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Lead name: Ícone + ID e Nome da Empresa + Contato */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <StatusIdBadge status={deal.status} id={deal.id} />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate group-hover:text-blue-900 text-[13px]">
                          {deal.company || deal.plan || 'Empresa sem nome'}
                        </p>
                        <p className="text-slate-500 text-xs truncate">
                          {deal.contact || 'Sem contato'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Age */}
                  {columns.age && (
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {formatLeadAge(deal.createdAt)}
                    </td>
                  )}

                  {/* Value */}
                  {columns.value && (
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {deal.value || 'R$ 0'}
                    </td>
                  )}

                  {/* Assignee em cor Terracota / Laranja Suave */}
                  {columns.assignee && (
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {deal.ownerName ? (
                        <span className="font-semibold text-[#C2410C] hover:underline">
                          {deal.ownerName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                  )}

                  {/* Stage com Régua de 5 Barras */}
                  {columns.stage && (
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-800 font-medium">
                          {deal.stageName || deal.stageKey}
                        </span>
                        <StageProgressBar
                          position={deal.stagePosition ?? 1}
                          totalStages={totalStagesCount}
                          status={deal.status}
                        />
                      </div>
                    </td>
                  )}

                  {/* Confidence */}
                  {columns.confidence && (
                    <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {deal.probability ?? 0}%
                    </td>
                  )}

                  {/* Close date */}
                  {columns.closeDate && (
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {formatCloseDate(deal.expectedCloseDate)}
                    </td>
                  )}

                  {/* Sources */}
                  {columns.sources && (
                    <td className="py-2.5 px-4 text-slate-600 truncate max-w-[130px]">
                      {deal.source || '—'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. VISUALIZAÇÃO MOBILE-FIRST (md:hidden) — Cards de Alta Densidade */}
      <div className="md:hidden divide-y divide-slate-100">
        {currentLeads.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic text-xs">
            Nenhum lead encontrado.
          </div>
        ) : (
          currentLeads.map((deal) => (
            <div
              key={deal.id}
              onClick={() => onSelectLead(deal)}
              className="p-3.5 hover:bg-slate-50/80 active:bg-slate-100 transition-colors space-y-2 cursor-pointer"
            >
              {/* Linha 1: Status/ID, Empresa, Contato e Valor */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <StatusIdBadge status={deal.status} id={deal.id} />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {deal.company || deal.plan || 'Empresa'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {deal.contact || 'Sem contato'}
                    </p>
                  </div>
                </div>

                {/* Valor em destaque */}
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-sm text-slate-900 block">
                    {deal.value || 'R$ 0'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatLeadAge(deal.createdAt)}
                  </span>
                </div>
              </div>

              {/* Linha 2: Estágio + Régua de Barras + Confiança */}
              <div className="flex items-center justify-between text-xs bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    {deal.stageName || deal.stageKey}
                  </span>
                  <StageProgressBar
                    position={deal.stagePosition ?? 1}
                    totalStages={totalStagesCount}
                    status={deal.status}
                  />
                </div>
                <span className="font-bold text-sky-800">
                  {deal.probability ?? 0}% conf.
                </span>
              </div>

              {/* Linha 3: Responsável, Fechamento e Ações Móveis Rápidas */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-500">
                  {deal.ownerName && (
                    <span className="font-semibold text-[#C2410C]">
                      {deal.ownerName}
                    </span>
                  )}
                  {deal.expectedCloseDate && (
                    <span className="text-slate-400 text-[11px]">
                      • Prev: {formatCloseDate(deal.expectedCloseDate)}
                    </span>
                  )}
                </div>

                {/* Botões Rápidos */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {deal.contactPhone && (
                    <a
                      href={`https://wa.me/55${deal.contactPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {deal.contactPhone && (
                    <a
                      href={`tel:${deal.contactPhone}`}
                      className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200"
                      title="Ligar"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => onSelectLead(deal)}
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200"
                    title="Ver detalhes"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NutshellLeadsTable;
