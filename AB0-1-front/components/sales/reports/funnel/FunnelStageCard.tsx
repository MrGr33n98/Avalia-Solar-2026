'use client';

import React from 'react';
import { Clock, CheckCircle2, XCircle, Ban, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FunnelStageData {
  id?: number;
  stage: string;
  position?: number;
  count: number;
  valor?: number;
  value_cents?: number;
  conversion_rate_from_prev?: number;
  drop_off_rate?: number;
  already_count?: number;
  remain_count?: number;
  added_count?: number;
  average_time_days?: number;
  advanced_count?: number;
  conversion_rate?: number;
  closed_count?: number;
  closed_rate?: number;
  won_count?: number;
  won_rate?: number;
  lost_count?: number;
  lost_rate?: number;
  cancelled_count?: number;
  cancelled_rate?: number;
}

export type FunnelClickAction =
  | { type: 'stage'; stageId: number; stageName: string }
  | { type: 'already'; stageId: number; stageName: string }
  | { type: 'remain'; stageId: number; stageName: string }
  | { type: 'won'; stageId: number; stageName: string }
  | { type: 'lost'; stageId: number; stageName: string }
  | { type: 'cancelled'; stageId: number; stageName: string };

interface FunnelStageCardProps {
  stage: FunnelStageData;
  index: number;
  isFirst: boolean;
  maxMetric: number;
  measure: 'value' | 'quantity';
  isSelected?: boolean;
  selectedAction?: string | null;
  onActionClick: (action: FunnelClickAction) => void;
}

function fmtBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
}

export default function FunnelStageCard({
  stage,
  index,
  isFirst,
  maxMetric,
  measure,
  isSelected = false,
  selectedAction = null,
  onActionClick,
}: FunnelStageCardProps) {
  const stageId = stage.id || index + 1;
  const valCents = stage.value_cents || (stage.valor || 0) * 100;
  const metricVal = measure === 'value' ? valCents : stage.count;
  
  // Calculate block width proportionally (IBM Carbon stepped block)
  const ratio = maxMetric > 0 ? metricVal / maxMetric : 0.5;
  const widthPercent = Math.max(Math.min(Math.round(ratio * 100), 100), 28);

  const alreadyCnt = stage.already_count ?? 0;
  const remainCnt = stage.remain_count ?? stage.count;
  const avgDays = stage.average_time_days ?? 4.4;
  const addedCnt = stage.added_count ?? stage.count;

  const closedCnt = stage.closed_count ?? 0;
  const closedRate = stage.closed_rate ?? 0;
  const wonCnt = stage.won_count ?? 0;
  const wonRate = stage.won_rate ?? 0;
  const lostCnt = stage.lost_count ?? 0;
  const lostRate = stage.lost_rate ?? 0;
  const cancelledCnt = stage.cancelled_count ?? 0;
  const cancelledRate = stage.cancelled_rate ?? 0;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 items-center py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">
      {/* ─────────────────────────────────────────────────────────────
          COLUNA 1: CICLO & VELOCIDADE (Esquerda - 3 colunas)
          ───────────────────────────────────────────────────────────── */}
      <div className="md:col-span-3 space-y-1.5 pr-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {stage.stage}
          </h3>
        </div>

        {/* Retenção: Already vs Remain */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <button
            type="button"
            onClick={() => onActionClick({ type: 'already', stageId, stageName: stage.stage })}
            className={cn(
              'hover:text-blue-600 transition-colors cursor-pointer underline-offset-2 hover:underline',
              selectedAction === `already-${stageId}` && 'text-blue-600 font-bold underline'
            )}
            title="Leads já presentes no estágio antes do período"
          >
            <span className="tabular-nums font-bold text-slate-700 dark:text-slate-300">{alreadyCnt}</span> already
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onActionClick({ type: 'remain', stageId, stageName: stage.stage })}
            className={cn(
              'hover:text-blue-600 transition-colors cursor-pointer underline-offset-2 hover:underline',
              selectedAction === `remain-${stageId}` && 'text-blue-600 font-bold underline'
            )}
            title="Leads ativos retidos neste estágio"
          >
            <span className="tabular-nums font-bold text-slate-700 dark:text-slate-300">{remainCnt}</span> remain
          </button>
        </div>

        {/* Velocidade de vendas (Average time in stage) */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Average time in stage:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            {avgDays} dias
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          COLUNA 2: BLOCO DO FUNIL ESCALONADO (Centro - 6 colunas)
          ───────────────────────────────────────────────────────────── */}
      <div className="md:col-span-6 flex flex-col items-center justify-center px-2">
        {/* Top badge if first stage (Nutshell '4 added') */}
        {isFirst && (
          <div className="mb-1.5 flex items-center justify-center">
            <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-mono rounded-xs font-semibold">
              <span className="tabular-nums font-bold">{addedCnt}</span> added
            </span>
          </div>
        )}

        {/* Proportional Central Funnel Box (IBM Carbon Style) */}
        <div
          onClick={() => onActionClick({ type: 'stage', stageId, stageName: stage.stage })}
          style={{ width: `${widthPercent}%` }}
          className={cn(
            'group relative py-3.5 px-4 text-center rounded-xs border transition-all cursor-pointer shadow-2xs select-none',
            isSelected
              ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-600 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-xs'
          )}
          title={`Clique para inspecionar todos os leads da etapa ${stage.stage}`}
        >
          {measure === 'quantity' ? (
            <div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums tracking-tight group-hover:text-blue-600 transition-colors">
                {stage.count}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {stage.count === 1 ? 'lead' : 'leads'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {fmtBRL(valCents)}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums tracking-tight group-hover:text-blue-600 transition-colors">
                {fmtBRL(valCents)}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {stage.count} {stage.count === 1 ? 'oportunidade' : 'oportunidades'}
              </div>
            </div>
          )}

          {/* Micro indicator on hover */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          COLUNA 3: OUTCOME / DESFECHO DO ESTÁGIO (Direita - 3 colunas)
          ───────────────────────────────────────────────────────────── */}
      <div className="md:col-span-3 pl-2">
        <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xs p-2.5 font-mono text-xs space-y-1">
          {/* Closed Total Header */}
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200/60 dark:border-slate-800 pb-1 text-[11px]">
            <span>
              <span className="tabular-nums">{closedRate}%</span> {closedCnt} closed
            </span>
          </div>

          {/* Won Sub-row */}
          <button
            type="button"
            onClick={() => onActionClick({ type: 'won', stageId, stageName: stage.stage })}
            className={cn(
              'w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer pt-0.5',
              selectedAction === `won-${stageId}` && 'text-emerald-600 font-bold'
            )}
            title="Oportunidades ganhas originadas nesta etapa"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Won</span>
            </span>
            <span className="tabular-nums">
              {wonRate}% <span className="font-bold text-slate-700 dark:text-slate-300">({wonCnt})</span>
            </span>
          </button>

          {/* Lost Sub-row */}
          <button
            type="button"
            onClick={() => onActionClick({ type: 'lost', stageId, stageName: stage.stage })}
            className={cn(
              'w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer',
              selectedAction === `lost-${stageId}` && 'text-rose-600 font-bold'
            )}
            title="Oportunidades perdidas nesta etapa"
          >
            <span className="flex items-center gap-1.5">
              <XCircle className="w-3 h-3 text-rose-500" />
              <span>Lost</span>
            </span>
            <span className="tabular-nums">
              {lostRate}% <span className="font-bold text-slate-700 dark:text-slate-300">({lostCnt})</span>
            </span>
          </button>

          {/* Cancelled Sub-row */}
          <button
            type="button"
            onClick={() => onActionClick({ type: 'cancelled', stageId, stageName: stage.stage })}
            className={cn(
              'w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer',
              selectedAction === `cancelled-${stageId}` && 'text-slate-800 font-bold'
            )}
            title="Oportunidades canceladas/descartadas nesta etapa"
          >
            <span className="flex items-center gap-1.5">
              <Ban className="w-3 h-3 text-slate-400" />
              <span>Cancelled</span>
            </span>
            <span className="tabular-nums">
              {cancelledRate}% <span className="font-bold text-slate-600 dark:text-slate-400">({cancelledCnt})</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
