'use client';

import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import { getStatusInfo, formatBrlCurrency } from '@/lib/proposals/domain';
import { cn } from '@/lib/utils';

interface Distribution {
  id: number;
  status: string;
  assigned_at?: string;
  lead: MarketplaceProposal['lead'];
}

interface LeadDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  distribution: Distribution | null;
  proposal: MarketplaceProposal | null;
  onOpenProposal: (proposalOrDist: { proposal?: MarketplaceProposal; distributionId?: number }) => void;
}

export function LeadDetailsDrawer({
  isOpen,
  onClose,
  distribution,
  proposal,
  onOpenProposal,
}: LeadDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'messages' | 'history'>('summary');

  if (!isOpen || (!distribution && !proposal)) return null;

  const lead = proposal?.lead || distribution?.lead;
  const status = proposal ? proposal.status : distribution?.status || 'received';
  const statusInfo = getStatusInfo(status);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-details-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
          <h2 id="lead-details-title" className="text-base font-black text-slate-950">
            Detalhes do lead
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lead Identity Summary Card */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm">
              {getInitials(lead?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-base font-black text-slate-950">
                  {lead?.name || 'Lead sem nome'}
                </h3>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold',
                    statusInfo.bg,
                    statusInfo.text,
                    statusInfo.border
                  )}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {lead?.product_vertical || 'Solução energética'} ·{' '}
                {lead?.city && lead?.state ? `${lead.city}, ${lead.state}` : 'Local não informado'}
              </p>
              <p className="text-[11px] text-slate-400">
                Recebido em {formatDate(distribution?.assigned_at || proposal?.created_at)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors',
                activeTab === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              Resumo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors',
                activeTab === 'messages' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              Mensagens
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors',
                activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              Histórico
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'summary' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Informações do lead
                </h4>
                <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Nome</span>
                    <span className="font-bold text-slate-900">{lead?.name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
                    <span className="font-medium text-slate-500">E-mail</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {lead?.email || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
                    <span className="font-medium text-slate-500">Telefone</span>
                    <span className="font-bold text-slate-900">{lead?.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
                    <span className="font-medium text-slate-500">Local</span>
                    <span className="font-bold text-slate-900">
                      {lead?.city ? `${lead.city} - ${lead.state || ''}` : 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
                    <span className="font-medium text-slate-500">Categoria</span>
                    <span className="font-bold text-slate-900">
                      {lead?.product_vertical || 'Energia Solar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Última proposta */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Última proposta
                </h4>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-slate-500">Status</span>
                    <span className="font-bold text-slate-900">{statusInfo.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 py-2">
                    <span className="font-medium text-slate-500">Atualizada em</span>
                    <span className="font-bold text-slate-900">
                      {formatDate(proposal?.version?.published_at || proposal?.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
                    <span className="font-medium text-slate-500">Valor estimado</span>
                    <span className="font-bold text-blue-700">
                      {formatBrlCurrency(proposal?.total_cents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="flex min-h-[180px] flex-col items-center justify-center text-center p-6 text-slate-500">
              <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium">Nenhuma mensagem direta aberta para este lead.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                As conversas são iniciadas quando a proposta for publicada ou em negociação.
              </p>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Histórico do lead
              </h4>
              <div className="space-y-3">
                <div className="flex gap-3 text-xs">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                  <div>
                    <p className="font-bold text-slate-900">Lead distribuído à empresa</p>
                    <p className="text-slate-400 text-[11px]">
                      {formatDate(distribution?.assigned_at)}
                    </p>
                  </div>
                </div>
                {proposal && (
                  <div className="flex gap-3 text-xs">
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-900">
                        Proposta vinculada ({proposal.reference})
                      </p>
                      <p className="text-slate-400 text-[11px]">{formatDate(proposal.created_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row gap-2 border-t border-slate-100 p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Ver todas as propostas
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProposal({ proposal: proposal || undefined, distributionId: distribution?.id });
            }}
            className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            {proposal ? 'Abrir proposta' : 'Criar proposta'}
          </button>
        </div>
      </div>
    </div>
  );
}
