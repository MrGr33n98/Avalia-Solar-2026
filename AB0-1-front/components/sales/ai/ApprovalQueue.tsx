'use client';

import { useState } from 'react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShieldAlert, Clock, AlertTriangle, Moon, Building2, User, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApprovalRequest, ApprovalRiskTier } from '@/lib/api/mcp/approvals';

interface ApprovalQueueProps {
  approvals: ApprovalRequest[];
  selectedUuid: string | null;
  onSelect: (uuid: string) => void;
  isLoading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ApprovalQueue({
  approvals,
  selectedUuid,
  onSelect,
  isLoading,
  activeTab,
  onTabChange,
}: ApprovalQueueProps) {
  const getRiskBadge = (tier: ApprovalRiskTier) => {
    switch (tier) {
      case 'r4':
        return {
          label: 'R4 CRITICAL',
          className: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
        };
      case 'r3':
        return {
          label: 'R3 HIGH',
          className: 'bg-orange-100 text-orange-800 border-orange-200 font-semibold',
        };
      case 'r2':
        return {
          label: 'R2 MEDIUM',
          className: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'r1':
        return {
          label: 'R1 LOW',
          className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'r0':
      default:
        return {
          label: 'R0 SAFE',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const formatExpires = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isPast(date)) return 'Expirado';
      return `Expira em ${formatDistanceToNow(date, { locale: ptBR })}`;
    } catch {
      return dateStr;
    }
  };

  const formatAge = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { locale: ptBR, addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden">
      {/* Queue Filters */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => onTabChange('pending')}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
            activeTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          )}
        >
          Pendentes
        </button>
        <button
          type="button"
          onClick={() => onTabChange('high_risk')}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
            activeTab === 'high_risk'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          )}
        >
          Alto Risco (R3/R4)
        </button>
        <button
          type="button"
          onClick={() => onTabChange('expiring')}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
            activeTab === 'expiring'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          )}
        >
          Expirando
        </button>
        <button
          type="button"
          onClick={() => onTabChange('snoozed')}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
            activeTab === 'snoozed'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          )}
        >
          Adiados (Snooze)
        </button>
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          )}
        >
          Histórico
        </button>
      </div>

      {/* Queue List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading && (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-2.5 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-4 bg-slate-200 rounded w-16" />
                </div>
                <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && approvals.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center justify-center h-64 text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-700">Fila limpa!</p>
            <p className="text-xs text-slate-500 mt-0.5">Nenhuma solicitação aguardando aprovação no momento.</p>
          </div>
        )}

        {!isLoading &&
          approvals.map((req) => {
            const isSelected = selectedUuid === req.request_uuid;
            const riskBadge = getRiskBadge(req.risk_tier);
            const isExpired = req.status === 'expired' || isPast(new Date(req.expires_at));

            return (
              <div
                key={req.request_uuid}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(req.request_uuid)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(req.request_uuid);
                  }
                }}
                className={cn(
                  'p-3.5 transition-all text-left w-full cursor-pointer hover:bg-slate-50 relative focus:outline-none focus:ring-1 focus:ring-indigo-500',
                  isSelected && 'bg-indigo-50/70 border-l-4 border-indigo-600 shadow-xs'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 font-mono">{req.tool_name}</span>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wider',
                        riskBadge.className
                      )}
                    >
                      {riskBadge.label}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 shrink-0">{formatAge(req.requested_at)}</span>
                </div>

                {/* Agent & Requester Info */}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-600">
                  <span className="font-mono text-indigo-700 text-[11px] font-medium truncate max-w-[140px]">
                    {req.agent_id}
                  </span>

                  {req.tenant_name && (
                    <span className="flex items-center gap-1 text-slate-500 text-[11px] truncate max-w-[130px]">
                      <Building2 className="w-3 h-3 shrink-0" />
                      {req.tenant_name}
                    </span>
                  )}
                </div>

                {/* Expiration & Status Indicators */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100/80">
                  <div className="flex items-center gap-1.5">
                    {req.snoozed ? (
                      <span className="flex items-center gap-1 text-purple-600 font-medium">
                        <Moon className="w-3 h-3" />
                        Adiado
                      </span>
                    ) : isExpired ? (
                      <span className="flex items-center gap-1 text-rose-600 font-medium">
                        <XCircle className="w-3 h-3" />
                        Expirado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700 font-medium">
                        <Clock className="w-3 h-3" />
                        {formatExpires(req.expires_at)}
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      req.status === 'approved' && 'bg-emerald-100 text-emerald-800',
                      req.status === 'executed' && 'bg-blue-100 text-blue-800',
                      req.status === 'rejected' && 'bg-rose-100 text-rose-800',
                      req.status === 'pending' && 'bg-amber-100 text-amber-800',
                      req.status === 'expired' && 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
