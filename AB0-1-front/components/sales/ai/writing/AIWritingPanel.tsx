'use client';

import React, { useState } from 'react';
import { AlertCircle, Loader2, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import { createAiGeneration, submitAiGenerationFeedback } from '@/lib/api/sales/ai';
import type {
  CrmAiFeature,
  CrmAiGenerationResponse,
  CrmAiSubjectOption,
} from '@/lib/api/sales/aiTypes';
import AIContextSelector from './AIContextSelector';
import AIGenerationResult from './AIGenerationResult';

export interface DraftSnapshot {
  subject: string;
  preheader?: string;
  body: string;
}

interface AIWritingPanelProps {
  contactId?: number | null;
  contactLabel?: string | null;
  accountId?: number | null;
  accountLabel?: string | null;
  opportunityId?: number | null;
  opportunityLabel?: string | null;
  currentSubject: string;
  currentPreheader?: string;
  currentBody: string;
  onApplyToDraft: (next: { subject?: string; preheader?: string; body?: string }) => void;
  preferPlainText?: boolean;
}

export default function AIWritingPanel({
  contactId,
  contactLabel,
  accountId,
  accountLabel,
  opportunityId,
  opportunityLabel,
  currentSubject,
  currentPreheader = '',
  currentBody,
  onApplyToDraft,
  preferPlainText = false,
}: AIWritingPanelProps) {
  const [tone, setTone] = useState<'consultivo' | 'direto' | 'executivo' | 'followup'>(
    'consultivo'
  );
  const [length, setLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [instructions, setInstructions] = useState('');
  const [loadingFeature, setLoadingFeature] = useState<CrmAiFeature | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<CrmAiGenerationResponse | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<DraftSnapshot | null>(null);

  const runGeneration = async (feature: CrmAiFeature, customAction?: string) => {
    setLoadingFeature(feature);
    setError(null);
    try {
      const response = await createAiGeneration({
        feature,
        action: customAction || feature,
        instructions:
          instructions.trim() ||
          (feature === 'email_first_touch'
            ? 'Gerar primeiro contato consultivo B2B com foco em diagnóstico energético solar.'
            : feature === 'email_rewrite'
            ? 'Melhorar clareza, concisão e chamada para ação preservando os fatos.'
            : 'Gerar 3 opções de assunto e preheader profissionais.'),
        context: {
          contact_id: contactId || undefined,
          account_id: accountId || undefined,
          opportunity_id: opportunityId || undefined,
        },
        draft: {
          subject: currentSubject,
          preheader: currentPreheader,
          body_html: currentBody,
        },
        options: {
          tone,
          length,
          language: 'pt-BR',
          variants: 3,
        },
      });
      setGeneration(response);
    } catch (err: unknown) {
      setError(
        (err instanceof Error ? err.message : null) ||
          'Falha ao consultar o CRM AI Studio (OpenRouter). Seu rascunho atual foi preservado.'
      );
    } finally {
      setLoadingFeature(null);
    }
  };

  const handleApplyDraft = async (payload: {
    subject?: string;
    preheader?: string;
    body_html?: string;
    body_text?: string;
  }) => {
    setPreviousSnapshot({
      subject: currentSubject,
      preheader: currentPreheader,
      body: currentBody,
    });

    const nextBody = preferPlainText
      ? payload.body_text || payload.body_html?.replace(/<[^>]+>/g, '') || currentBody
      : payload.body_html || payload.body_text || currentBody;

    onApplyToDraft({
      subject: payload.subject || currentSubject,
      preheader: payload.preheader ?? currentPreheader,
      body: nextBody,
    });

    if (generation?.id) {
      try {
        await submitAiGenerationFeedback(generation.id, { decision: 'accepted' });
      } catch {
        // Non-blocking feedback
      }
    }
  };

  const handleApplySubjectOnly = async (option: CrmAiSubjectOption) => {
    setPreviousSnapshot({
      subject: currentSubject,
      preheader: currentPreheader,
      body: currentBody,
    });

    onApplyToDraft({
      subject: option.subject,
      preheader: option.preheader ?? currentPreheader,
    });

    if (generation?.id) {
      try {
        await submitAiGenerationFeedback(generation.id, {
          decision: 'edited',
          notes: 'Aplicou apenas assunto sugerido',
        });
      } catch {
        // Non-blocking
      }
    }
  };

  const handleDiscard = async () => {
    if (generation?.id) {
      try {
        await submitAiGenerationFeedback(generation.id, { decision: 'rejected' });
      } catch {
        // Non-blocking
      }
    }
    setGeneration(null);
  };

  const handleUndo = () => {
    if (!previousSnapshot) return;
    onApplyToDraft({
      subject: previousSnapshot.subject,
      preheader: previousSnapshot.preheader,
      body: previousSnapshot.body,
    });
    setPreviousSnapshot(null);
  };

  return (
    <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              AI Writing Studio (OpenRouter)
            </h4>
            <p className="text-[11px] text-slate-500">
              Gera sugestões para o rascunho. Nunca envia e-mails nem altera destinatários sozinho.
            </p>
          </div>
        </div>

        {previousSnapshot && (
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <RotateCcw className="w-3 h-3" />
            Desfazer alteração IA
          </button>
        )}
      </div>

      <AIContextSelector
        contactId={contactId}
        contactLabel={contactLabel}
        accountId={accountId}
        accountLabel={accountLabel}
        opportunityId={opportunityId}
        opportunityLabel={opportunityLabel}
        sourcesUsed={generation?.sources_used}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Tom comercial</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as 'consultivo' | 'direto' | 'executivo' | 'followup')}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800"
          >
            <option value="consultivo">Consultivo & Técnico</option>
            <option value="direto">Direto & Objetivo</option>
            <option value="executivo">Executivo (C-Level)</option>
            <option value="followup">Follow-up Cordial</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">Extensão</label>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'detailed')}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800"
          >
            <option value="short">Curto (até 80 palavras)</option>
            <option value="medium">Médio (100–160 palavras)</option>
            <option value="detailed">Detalhado</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Instrução adicional (opcional)
          </label>
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ex: focar em redução de demanda contratada..."
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={Boolean(loadingFeature)}
          onClick={() => runGeneration('email_first_touch', 'generate_first_touch')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
        >
          {loadingFeature === 'email_first_touch' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Gerar 1º Contato
        </button>

        <button
          type="button"
          disabled={Boolean(loadingFeature) || !currentBody.trim()}
          onClick={() => runGeneration('email_rewrite', 'rewrite_draft')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-md disabled:opacity-50"
        >
          {loadingFeature === 'email_rewrite' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          Reescrever Rascunho
        </button>

        <button
          type="button"
          disabled={Boolean(loadingFeature)}
          onClick={() => runGeneration('subject_options', 'generate_subjects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md disabled:opacity-50"
        >
          {loadingFeature === 'subject_options' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          )}
          Gerar 3 Assuntos
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {generation && (
        <AIGenerationResult
          generation={generation}
          onApplyDraft={handleApplyDraft}
          onApplySubjectOnly={handleApplySubjectOnly}
          onDiscard={handleDiscard}
          canUndo={Boolean(previousSnapshot)}
          onUndo={handleUndo}
        />
      )}
    </div>
  );
}

