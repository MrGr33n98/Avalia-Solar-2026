'use client';

import React from 'react';
import {
  Search,
  Plus,
  FilePlus2,
  MapPin,
  Zap,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import {
  getStatusInfo,
  formatBrlCurrency,
  PROPOSAL_GROUPED_TABS,
  type ProposalGroupedFilter,
} from '@/lib/proposals/domain';
import { cn } from '@/lib/utils';

interface ProposalListPaneProps {
  proposals: MarketplaceProposal[];
  selectedProposalId: number | null;
  onSelectProposal: (proposal: MarketplaceProposal) => void;
  groupedFilter: ProposalGroupedFilter;
  onFilterChange: (filter: ProposalGroupedFilter) => void;
  counts: Record<ProposalGroupedFilter, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateDialog: () => void;
  hasEligibleDistributions: boolean;
  className?: string;
}

export function ProposalListPane({
  proposals,
  selectedProposalId,
  onSelectProposal,
  groupedFilter,
  onFilterChange,
  counts,
  searchQuery,
  onSearchChange,
  onOpenCreateDialog,
  hasEligibleDistributions,
  className,
}: ProposalListPaneProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Top Header */}
      <div className="border-b border-slate-100 p-3.5 space-y-3 bg-slate-50/40 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Propostas ({counts.all})
            </h2>
          </div>

          {hasEligibleDistributions && (
            <button
              type="button"
              onClick={onOpenCreateDialog}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por cliente, ref ou cidade..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Grouped Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {PROPOSAL_GROUPED_TABS.map((tab) => {
            const count = counts[tab.value] || 0;
            const isActive = groupedFilter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onFilterChange(tab.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors shrink-0',
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[9px] font-extrabold',
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-600'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Proposals List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {proposals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
            Nenhuma proposta encontrada para os filtros atuais.
          </div>
        ) : (
          proposals.map((proposal) => {
            const isSelected = selectedProposalId === proposal.id;
            const statusInfo = getStatusInfo(proposal.status);
            const lead = proposal.lead;
            const version = proposal.version;

            return (
              <div
                key={proposal.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectProposal(proposal)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectProposal(proposal);
                  }
                }}
                className={cn(
                  'group relative cursor-pointer rounded-xl border p-3.5 text-left transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-50/25 ring-1 ring-blue-500 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                )}
              >
                {/* Header row: Reference & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                    {proposal.reference}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border',
                      statusInfo.bg,
                      statusInfo.text,
                      statusInfo.border
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusInfo.dot)} />
                    {statusInfo.label}
                  </span>
                </div>

                {/* Lead Name */}
                <h3 className="mt-1 text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                  {lead?.name || 'Comprador sem nome'}
                </h3>

                {/* Subtitle / Version title */}
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {version?.title || 'Proposta comercial'}
                </p>

                {/* Meta row: Location & Value */}
                <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100/80">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[140px]">
                    {(lead?.city || lead?.state) ? (
                      <>
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {[lead.city, lead.state].filter(Boolean).join(' - ')}
                        </span>
                      </>
                    ) : (
                      <span>Sem localização</span>
                    )}
                  </div>

                  <span className="font-extrabold text-slate-900 text-xs">
                    {proposal.total_cents ? formatBrlCurrency(proposal.total_cents) : 'A calcular'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
