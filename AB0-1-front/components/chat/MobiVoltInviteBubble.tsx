'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/lazy';
import { getFloatingWidgetZIndex, WIDGET_POSITION_CLASSES } from '@/lib/floating-widgets-positioning';

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
  icon3d?: string;
}

const DEFAULT_ACTIONS: InviteAction[] = [
  {
    label: 'Energia Solar',
    kind: 'qualification',
    vertical: 'solar',
    icon3d: '/3d-refined/A10_paineis-solares-256.webp'
  },
  {
    label: 'Mobilidade Elétrica',
    kind: 'qualification',
    vertical: 'electric_mobility',
    icon3d: '/3d-refined/D06_veiculos-eletricos-256.webp'
  },
  {
    label: 'Ver avaliações',
    kind: 'message',
    message: 'Quero ver avaliações de empresas bem avaliadas.',
    icon3d: '/3d-refined/I03_selos-verdes-e-certificacoes-256.webp'
  },
  {
    label: 'Comparar empresas',
    kind: 'message',
    message: 'Quero comparar empresas para escolher com mais segurança.',
    icon3d: '/3d-refined/H04_tendencias-de-mercado-256.webp'
  },
  {
    label: 'Pedir orçamento',
    kind: 'qualification',
    vertical: 'solar',
    icon3d: '/3d-refined/A06_financiamento-de-energia-solar-256.webp'
  },
  {
    label: 'Explicar o que preciso',
    kind: 'message',
    message: 'Quero explicar brevemente o que preciso.',
    icon3d: '/3d-refined/F04_simulacao-e-projeto-solar-256.webp'
  }
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
    <div 
      className={cn(
        'fixed right-4 animate-in slide-in-from-bottom-5 fade-in duration-300',
        'max-w-[320px] sm:max-w-[360px]',
        WIDGET_POSITION_CLASSES.mobivolt
      )}
      style={{
        zIndex: getFloatingWidgetZIndex('mobivolt')
      }}
    >
      {/* Balão de Convite Principal */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
        {/* Header com avatar e mensagem */}
        <div className="p-4 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-brand-blue/20 bg-brand-blue">
              <Image
                src="/assets/chat-widget-avalia-solar.png"
                alt="Avalia Solar"
                width={40}
                height={40}
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
                className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all duration-200 group flex items-center justify-between ${
                  highlighted && index < 2
                    ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 hover:bg-brand-blue/10 dark:hover:bg-brand-blue/15 animate-pulse'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-750 hover:border-brand-blue/50'
                }`}
                style={{
                  animationDelay: highlighted && index < 2 ? `${index * 150}ms` : '0ms'
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {action.icon3d && (
                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                      <Image
                        src={action.icon3d}
                        alt=""
                        width={24}
                        height={24}
                        className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                    {action.label}
                  </span>
                </div>
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
