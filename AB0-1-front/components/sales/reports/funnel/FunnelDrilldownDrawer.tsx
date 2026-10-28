'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  Mail,
  DollarSign,
  Building,
  User,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ApiOpportunity } from '@/lib/api/sales/types';
import { cn } from '@/lib/utils';

export type FunnelTargetDetail =
  | { type: 'stage'; stageId: number; stageName: string }
  | { type: 'advanced'; fromStageName: string; toStageName: string; count: number }
  | { type: 'remain'; stageId: number; stageName: string }
  | { type: 'already'; stageId: number; stageName: string }
  | { type: 'won'; stageId: number; stageName: string }
  | { type: 'lost'; stageId: number; stageName: string }
  | { type: 'cancelled'; stageId: number; stageName: string };

interface FunnelDrilldownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  target: FunnelTargetDetail | null;
  opportunities: ApiOpportunity[];
  loading?: boolean;
}

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

export default function FunnelDrilldownDrawer({
  isOpen,
  onClose,
  target,
  opportunities,
  loading = false,
}: FunnelDrilldownDrawerProps) {
  if (!target) return null;

  // Filter opportunities based on drilldown target
  const filteredOpps = opportunities.filter((opp) => {
    if (target.type === 'stage' || target.type === 'remain') {
      return (
        opp.stage?.id === target.stageId ||
        opp.stage?.name === target.stageName
      );
    }
    if (target.type === 'won') {
      return (
        (opp.stage?.id === target.stageId || opp.stage?.name === target.stageName) &&
        opp.status === 'won'
      );
    }
    if (target.type === 'lost') {
      return (
        (opp.stage?.id === target.stageId || opp.stage?.name === target.stageName) &&
        opp.status === 'lost'
      );
    }
    if (target.type === 'cancelled') {
      return (
        (opp.stage?.id === target.stageId || opp.stage?.name === target.stageName) &&
        opp.status === 'cancelled'
      );
    }
    // For 'advanced' or others, return opportunities matching either or all
    return true;
  });

  const getTitle = () => {
    switch (target.type) {
      case 'stage':
        return `Leads no Estágio: ${target.stageName}`;
      case 'advanced':
        return `Leads que Avançaram: ${target.fromStageName} ➔ ${target.toStageName}`;
      case 'remain':
        return `Leads Retidos em: ${target.stageName}`;
      case 'already':
        return `Leads Pré-existentes em: ${target.stageName}`;
      case 'won':
        return `Oportunidades Ganhas em: ${target.stageName}`;
      case 'lost':
        return `Oportunidades Perdidas em: ${target.stageName}`;
      case 'cancelled':
        return `Oportunidades Canceladas em: ${target.stageName}`;
      default:
        return 'Detalhamento de Oportunidades';
    }
  };

  const totalValue = filteredOpps.reduce((acc, o) => acc + (o.value_cents || 0), 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Layers className="w-4 h-4" />
              </span>
              <SheetTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {getTitle()}
              </SheetTitle>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-2">
              <span>{filteredOpps.length} {filteredOpps.length === 1 ? 'oportunidade' : 'oportunidades'}</span>
              <span>•</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{fmtBRL(totalValue)}</span>
            </div>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400 font-mono">
              Carregando oportunidades da fatia...
            </div>
          ) : filteredOpps.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-mono space-y-1">
              <p>Nenhuma oportunidade encontrada nesta fatia específica.</p>
              <p className="text-[11px] text-slate-400">Tente alternar o pipeline ou intervalo de datas.</p>
            </div>
          ) : (
            filteredOpps.map((opp) => (
              <div
                key={opp.id}
                className="group p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-2xs space-y-2"
              >
                {/* Title & Value */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/dashboard/sales/opportunities/${opp.id}`}
                      className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      <span>{opp.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    {opp.account && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{opp.account.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {fmtBRL(opp.value_cents || 0)}
                    </span>
                    <div className="mt-0.5">
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.2 rounded-xs font-mono uppercase tracking-wider',
                          opp.status === 'won'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                            : opp.status === 'lost'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        )}
                      >
                        {opp.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Stage */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{opp.contact_name || 'Sem contato'}</span>
                  </div>
                  <div className="text-slate-400">
                    Estágio: <span className="text-slate-700 dark:text-slate-300 font-semibold">{opp.stage?.name || '—'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <Link
                    href={`/dashboard/sales/opportunities/${opp.id}`}
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-medium rounded-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Ver Oportunidade 360</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
