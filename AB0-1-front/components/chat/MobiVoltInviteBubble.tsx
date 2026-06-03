'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { track } from '@/lib/analytics/lazy';

interface MobiVoltInviteBubbleProps {
  onActionSelect: (action: InviteAction) => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export type InviteActionKind = 'message' | 'qualification';

export interface InviteAction {
  label: string;
  kind: InviteActionKind;
  message?: string;
  vertical?: 'solar' | 'electric_mobility';
}

const DEFAULT_ACTIONS: InviteAction[] = [
  { label: '☀️ Energia Solar', kind: 'qualification', vertical: 'solar' },
  { label: '🔌 Mobilidade Elétrica', kind: 'qualification', vertical: 'electric_mobility' },
  { label: '⭐ Ver avaliações', kind: 'message', message: 'Quero ver avaliações de empresas bem avaliadas.' },
  { label: '📊 Comparar empresas', kind: 'message', message: 'Quero comparar empresas para escolher com mais segurança.' },
  { label: '💰 Pedir orçamento', kind: 'qualification', vertical: 'solar' },
  { label: '✍️ Explicar o que preciso', kind: 'message', message: 'Quero explicar brevemente o que preciso.' }
];

const INVITE_DELAY_MS = 3000;
const HIGHLIGHT_DELAY_MS = 5000;
const REENGAGEMENT_DELAY_MS = 15000;

export default function MobiVoltInviteBubble({
  onActionSelect,
  onDismiss,
  isVisible
}: MobiVoltInviteBubbleProps) {
  const [highlighted, setHighlighted] = useState(false);
  const [showReengagement, setShowReengagement] = useState(false);
  const inviteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reengageTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleActionClick = useCallback((action: InviteAction) => {
    track('mobivolt_invite_action_clicked', {
      action_label: action.label,
      action_kind: action.kind,
      vertical: action.vertical
    });
    onActionSelect(action);
  }, [onActionSelect]);

  const handleDismiss = useCallback(() => {
    track('mobivolt_invite_dismissed', {});
    onDismiss();
  }, [onDismiss]);

  // Timer para mostrar o convite após 3 segundos
  useEffect(() => {
    if (!isVisible) return;

    inviteTimerRef.current = setTimeout(() => {
      track('mobivolt_invite_shown', {});
    }, INVITE_DELAY_MS);

    return () => {
      if (inviteTimerRef.current) clearTimeout(inviteTimerRef.current);
    };
  }, [isVisible]);

  // Timer para destacar botões após 5 segundos sem interação
  useEffect(() => {
    if (!isVisible) return;

    highlightTimerRef.current = setTimeout(() => {
      setHighlighted(true);
      track('mobivolt_invite_highlighted', {});
    }, HIGHLIGHT_DELAY_MS);

    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, [isVisible]);

  // Timer para reengajamento leve após 15 segundos
  useEffect(() => {
    if (!isVisible) return;

    reengageTimerRef.current = setTimeout(() => {
      setShowReengagement(true);
      track('mobivolt_reengagement_shown', { delay_seconds: 15 });
    }, REENGAGEMENT_DELAY_MS);

    return () => {
      if (reengageTimerRef.current) clearTimeout(reengageTimerRef.current);
    };
  }, [isVisible]);

  const handleContinue = useCallback(() => {
    setShowReengagement(false);
    track('mobivolt_reengagement_continue_clicked', {});
  }, []);

  const handleNotNow = useCallback(() => {
    setShowReengagement(false);
    handleDismiss();
    track('mobivolt_reengagement_not_now_clicked', {});
  }, [handleDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[max(5rem,var(--safe-area-inset-bottom))] right-4 sm:right-6 z-40 max-w-[calc(100vw-2rem)] sm:max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
      {/* Balão de Convite Principal */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
        {/* Header com avatar e mensagem */}
        <div className="p-4 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-brand-blue/20 bg-white">
              <img
                src="/images/mobivolt-ai-avaliasolar.png"
                alt="MobiVolt AI"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                Olá! Precisa de ajuda?
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                Posso ajudar você a encontrar empresas de energia solar ou mobilidade elétrica, comparar avaliações e pedir orçamento com segurança.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            {DEFAULT_ACTIONS.map((action, index) => (
              <button
                key={action.label}
                onClick={() => handleActionClick(action)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 group ${
                  highlighted && index < 2
                    ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 hover:bg-brand-blue/10 dark:hover:bg-brand-blue/15 animate-pulse'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-750 hover:border-brand-blue/50'
                }`}
                style={{
                  animationDelay: highlighted && index < 2 ? `${index * 150}ms` : '0ms'
                }}
              >
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt de Reengajamento (após 15s) */}
        {showReengagement && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-brand-blue/5 dark:bg-zinc-800/50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
              Posso te ajudar a encontrar empresas bem avaliadas perto de você?
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleContinue}
                className="flex-1 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                Sim, continuar
              </button>
              <button
                onClick={handleNotNow}
                className="flex-1 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                Não agora
              </button>
            </div>
          </div>
        )}

        {/* Botão de Dispensar */}
        <div className="px-4 pb-3 pt-1">
          <button
            onClick={handleDismiss}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors underline"
          >
            Não mostrar novamente nesta sessão
          </button>
        </div>
      </div>
    </div>
  );
}
