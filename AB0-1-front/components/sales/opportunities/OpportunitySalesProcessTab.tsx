'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ListChecks,
  Settings,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getStageChecklist,
  getOpportunityChecklistState,
  setOpportunityChecklistItem,
} from '@/components/sales/pipeline/stageChecklistUtils';
import { salesApi } from '@/lib/api/sales/client';
import { toast } from 'sonner';

interface OpportunitySalesProcessTabProps {
  opp: any;
  activePipeline: any;
  onStageChange?: (newStageKey: string) => void;
}

export default function OpportunitySalesProcessTab({
  opp,
  activePipeline,
  onStageChange,
}: OpportunitySalesProcessTabProps) {
  const currentStageKey = opp.stage?.key || opp.stage_key || 'prospect';
  const currentStageName = opp.stage?.name || opp.stage_key || 'Prospecção';
  const pipelineKey = activePipeline?.key || 'sales';

  // Checklist da etapa atual
  const [checklist, setChecklist] = useState<string[]>([]);
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const items = getStageChecklist(pipelineKey, currentStageKey);
    setChecklist(items);
    if (opp?.id) {
      setCheckedState(getOpportunityChecklistState(opp.id, currentStageKey));
    }
  }, [pipelineKey, currentStageKey, opp?.id]);

  const toggleCheck = (item: string) => {
    if (!opp?.id) return;
    const nextVal = !checkedState[item];
    const updated = setOpportunityChecklistItem(opp.id, currentStageKey, item, nextVal);
    setCheckedState(updated);
  };

  const totalItems = checklist.length;
  const completedCount = checklist.filter((item) => checkedState[item]).length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Lista de etapas do pipeline
  const stagesList = activePipeline?.stages || [];
  const currentIndex = stagesList.findIndex(
    (s: any) => s.key === currentStageKey || s.name === currentStageName
  );
  const nextStage =
    currentIndex >= 0 && currentIndex < stagesList.length - 1
      ? stagesList[currentIndex + 1]
      : null;

  const handleAdvanceStage = async () => {
    if (!nextStage || !opp?.id) return;
    try {
      await salesApi.updateOpportunity(opp.id, {
        stage_key: nextStage.key,
      });
      toast.success(`Oportunidade avançada para '${nextStage.name}'!`);
      if (onStageChange) onStageChange(nextStage.key);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao avançar etapa.';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* CARD DA ETAPA ATUAL E SEU CHECKLIST INTERATIVO */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 space-y-3">
          {/* Header da Etapa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                  #{currentIndex >= 0 ? currentIndex + 1 : 1}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Etapa Atual: {currentStageName}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pipeline: <strong>{activePipeline?.name || 'Avalia Solar B2B'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] font-semibold"
              >
                <TrendingUp className="w-3 h-3 mr-1 text-sky-600" />
                {opp.stage?.probability ?? opp.probability ?? 20}% prob.
              </Badge>

              <Link
                href="/dashboard/sales/settings/pipelines"
                className="text-[11px] text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1 font-semibold ml-2"
                title="Configurar etapas e diretrizes nas Configurações do CRM"
              >
                <Settings className="w-3 h-3 text-sky-600" />
                <span>Configurar etapas ↗</span>
              </Link>
            </div>
          </div>

          {/* Barra de Progresso do Checklist */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-sky-600" />
                Checklist do Processo de Venda
              </span>
              <span className="font-medium text-slate-500">
                {completedCount} de {totalItems} concluídas ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Lista de Checkboxes do Processo de Venda */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2">
            {checklist.length === 0 ? (
              <p className="text-slate-400 italic text-[11px]">
                Nenhuma diretriz de validação configurada para esta etapa.
              </p>
            ) : (
              checklist.map((item, idx) => {
                const isChecked = !!checkedState[item];
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-2.5 text-slate-800 font-medium cursor-pointer p-1.5 rounded hover:bg-white/80 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(item)}
                      className="accent-emerald-600 h-4 w-4 rounded border-slate-300 cursor-pointer"
                    />
                    <span
                      className={`text-[11px] transition-all ${
                        isChecked
                          ? 'line-through text-slate-400 font-normal'
                          : 'text-slate-800 font-semibold'
                      }`}
                    >
                      {item}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {/* Botão de Avançar Etapa (se houver próxima etapa) */}
          {nextStage && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Próxima fase:{' '}
                <strong className="text-slate-700">{nextStage.name}</strong>
              </span>

              <Button
                size="sm"
                onClick={handleAdvanceStage}
                className="h-7 text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 font-semibold"
              >
                <span>Avançar para {nextStage.name}</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
