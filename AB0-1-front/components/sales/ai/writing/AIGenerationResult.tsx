'use client';

import React from 'react';
import { Check, Cpu, RotateCcw, Sparkles } from 'lucide-react';
import type { CrmAiGenerationResponse, CrmAiSubjectOption } from '@/lib/api/sales/aiTypes';
import AIClaimWarnings from './AIClaimWarnings';

interface AIGenerationResultProps {
  generation: CrmAiGenerationResponse;
  onApplyDraft: (payload: {
    subject?: string;
    preheader?: string;
    body_html?: string;
    body_text?: string;
  }) => void;
  onApplySubjectOnly?: (option: CrmAiSubjectOption) => void;
  onDiscard: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

export default function AIGenerationResult({
  generation,
  onApplyDraft,
  onApplySubjectOnly,
  onDiscard,
  canUndo,
  onUndo,
}: AIGenerationResultProps) {
  const { result, warnings, missing_fields, resolved_model, usage, fallback_used } = generation;
  const subjects = result.subjects || [];

  return (
    <div className="bg-white border border-indigo-200 rounded-xl p-3.5 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Sugestão Gerada (Revisão Humana Obrigatória)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
            <Cpu className="w-3 h-3 text-indigo-600" />
            {resolved_model}
          </span>
          {fallback_used && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
              Fallback
            </span>
          )}
          <span>{usage.latency_ms} ms</span>
        </div>
      </div>

      <AIClaimWarnings warnings={warnings} missingFields={missing_fields} />

      {subjects.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-600 block">
            Opções de Assunto & Preheader (clique para aplicar assunto):
          </span>
          <div className="space-y-1">
            {subjects.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 truncate">{opt.subject}</div>
                  {opt.preheader && (
                    <div className="text-[11px] text-slate-500 truncate">{opt.preheader}</div>
                  )}
                </div>
                {onApplySubjectOnly && (
                  <button
                    type="button"
                    onClick={() => onApplySubjectOnly(opt)}
                    className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-white border border-indigo-200 rounded hover:bg-indigo-50 shrink-0"
                  >
                    Usar assunto
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(result.body_text || result.body_html) && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-600 block">
            Prévia do Corpo Sugerido:
          </span>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 max-h-44 overflow-y-auto whitespace-pre-wrap">
            {result.body_text || result.body_html}
          </div>
        </div>
      )}

      {result.rationale && (
        <div className="text-[11px] text-slate-500 italic">
          Justificativa factual: {result.rationale}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onApplyDraft({
                subject: result.subject || subjects[0]?.subject,
                preheader: result.preheader || subjects[0]?.preheader,
                body_html: result.body_html,
                body_text: result.body_text,
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            <Check className="w-3.5 h-3.5" />
            Inserir no Rascunho
          </button>

          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Desfazer última inserção
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onDiscard}
          className="px-2.5 py-1 text-xs text-slate-500 hover:text-rose-600"
        >
          Descartar sugestão
        </button>
      </div>
    </div>
  );
}

