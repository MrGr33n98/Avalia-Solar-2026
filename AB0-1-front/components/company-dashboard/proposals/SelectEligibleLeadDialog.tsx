'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Loader2,
  UserCheck,
  Building2,
  MapPin,
  Zap,
  DollarSign,
  AlertCircle,
  FilePlus2,
} from 'lucide-react';
import type { MarketplaceProposal } from '@/lib/api';
import { formatBrlCurrency } from '@/lib/proposals/domain';
import { cn } from '@/lib/utils';

interface Distribution {
  id: number;
  status: string;
  assigned_at?: string;
  lead: MarketplaceProposal['lead'];
}

interface SelectEligibleLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  distributions: Distribution[];
  existingProposals: MarketplaceProposal[];
  onConfirm: (distributionId: number) => Promise<void>;
  isCreating: boolean;
}

export function SelectEligibleLeadDialog({
  isOpen,
  onClose,
  distributions,
  existingProposals,
  onConfirm,
  isCreating,
}: SelectEligibleLeadDialogProps) {
  const [selectedDistId, setSelectedDistId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtrar distribuições elegíveis (que ainda não têm proposta criada)
  const eligibleDistributions = distributions.filter(
    (dist) => !existingProposals.some((p) => p.lead_distribution_id === dist.id)
  );

  const selectedDist = distributions.find((d) => d.id === selectedDistId);

  const handleConfirm = async () => {
    if (!selectedDistId) {
      setError('Selecione uma oportunidade elegível para prosseguir.');
      return;
    }
    setError(null);
    try {
      await onConfirm(selectedDistId);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível criar a proposta para este lead.';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-lead-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <div>
              <h2 id="select-lead-dialog-title" className="text-base font-bold text-slate-900">
                Criar Nova Proposta
              </h2>
              <p className="text-xs text-slate-500">
                Selecione a oportunidade recebida para a qual deseja elaborar a proposta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {eligibleDistributions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <UserCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Nenhum lead pendente de proposta
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Todas as oportunidades distribuídas para a sua empresa já possuem uma proposta vinculada.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Oportunidades elegíveis ({eligibleDistributions.length})
              </label>

              <div className="grid gap-2 sm:grid-cols-1">
                {eligibleDistributions.map((dist) => {
                  const lead = dist.lead;
                  const isSelected = selectedDistId === dist.id;

                  return (
                    <div
                      key={dist.id}
                      onClick={() => setSelectedDistId(dist.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDistId(dist.id);
                        }
                      }}
                      className={cn(
                        'group cursor-pointer rounded-xl border p-4 text-left transition-all',
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-100 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                              {lead?.name || 'Comprador sem nome informado'}
                            </span>
                            {lead?.project_profile && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                {lead.project_profile}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                            {(lead?.city || lead?.state) && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {[lead.city, lead.state].filter(Boolean).join(' - ')}
                              </span>
                            )}

                            {lead?.monthly_kwh != null && lead.monthly_kwh > 0 && (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <Zap className="h-3.5 w-3.5 text-amber-500" />
                                {lead.monthly_kwh} kWh/mês
                              </span>
                            )}

                            {lead?.bill_value != null && lead.bill_value > 0 && (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                                Conta: {formatBrlCurrency(lead.bill_value * 100)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center h-5">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedDistId(dist.id)}
                            className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedDistId || isCreating}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Criando proposta...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Criar proposta para este lead</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
