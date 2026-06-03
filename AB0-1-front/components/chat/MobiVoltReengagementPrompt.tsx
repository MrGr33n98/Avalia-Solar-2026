'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { track } from '@/lib/analytics/lazy';

interface MobiVoltReengagementPromptProps {
  isVisible: boolean;
  onContinue: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onReset?: () => void;
  variant?: 'idle_30s' | 'idle_60s' | 'after_companies';
}

export default function MobiVoltReengagementPrompt({
  isVisible,
  onContinue,
  onMinimize,
  onClose,
  onReset,
  variant = 'idle_30s'
}: MobiVoltReengagementPromptProps) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const getMessage = () => {
    switch (variant) {
      case 'idle_30s':
        return {
          title: 'Ainda precisa de ajuda?',
          subtitle: 'Estou aqui para te ajudar a encontrar as melhores empresas.',
          primaryAction: 'Sim, continuar',
          showCompare: true,
          showQuote: true
        };
      case 'idle_60s':
        return {
          title: 'Quer continuar ou encerrar?',
          subtitle: 'Posso minimizar o chat ou encerrar esta conversa.',
          primaryAction: 'Continuar',
          showCompare: false,
          showQuote: false
        };
      case 'after_companies':
        return {
          title: 'Quer comparar ou pedir orçamento?',
          subtitle: 'Vi que você viu algumas empresas. Posso te ajudar a decidir.',
          primaryAction: 'Comparar empresas',
          showCompare: true,
          showQuote: true
        };
      default:
        return {
          title: 'Precisa de mais alguma coisa?',
          subtitle: 'Estou disponível para continuar te ajudando.',
          primaryAction: 'Continuar',
          showCompare: false,
          showQuote: false
        };
    }
  };

  const message = getMessage();

  const handleContinue = useCallback(() => {
    track('mobivolt_reengagement_continue_clicked', { variant });
    onContinue();
  }, [onContinue, variant]);

  const handleMinimize = useCallback(() => {
    track('mobivolt_reengagement_minimize_clicked', { variant });
    onMinimize();
  }, [onMinimize, variant]);

  const handleClose = useCallback(() => {
    track('mobivolt_session_closed', { variant });
    onClose();
  }, [onClose, variant]);

  const handleReset = useCallback(() => {
    if (onReset) {
      track('mobivolt_session_reset_initiated', {});
      setShowConfirmReset(true);
    }
  }, [onReset]);

  const confirmReset = useCallback(() => {
    track('mobivolt_session_reset_confirmed', {});
    onReset?.();
    setShowConfirmReset(false);
  }, [onReset]);

  const cancelReset = useCallback(() => {
    track('mobivolt_session_reset_cancelled', {});
    setShowConfirmReset(false);
  }, []);

  if (!isVisible) return null;

  if (showConfirmReset) {
    return (
      <div className="p-4 space-y-3 animate-in fade-in zoom-in-95">
        <div className="text-center space-y-2">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
            Deseja apagar esta conversa?
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Ao apagar, o histórico visível será removido. Dados técnicos mínimos podem ser mantidos para segurança e LGPD.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={confirmReset}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
          >
            Apagar conversa
          </button>
          <button
            onClick={cancelReset}
            className="w-full bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium py-2.5 rounded-lg text-xs transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
      <div className="text-center space-y-1">
        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
          {message.title}
        </h4>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {message.subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleContinue}
          className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
        >
          {message.primaryAction}
        </button>

        {message.showCompare && (
          <button
            onClick={() => {
              track('mobivolt_reengagement_compare_clicked', { variant });
              handleContinue();
            }}
            className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-semibold py-2.5 rounded-lg text-xs transition-colors"
          >
            Comparar empresas
          </button>
        )}

        {message.showQuote && (
          <button
            onClick={() => {
              track('mobivolt_reengagement_quote_clicked', { variant });
              handleContinue();
            }}
            className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-semibold py-2.5 rounded-lg text-xs transition-colors"
          >
            Pedir orçamento
          </button>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
          <button
            onClick={handleMinimize}
            className="bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium py-2 rounded-lg text-xs transition-colors"
          >
            Minimizar
          </button>
          {onReset && (
            <button
              onClick={handleReset}
              className="bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 font-medium py-2 rounded-lg text-xs transition-colors"
            >
              Apagar conversa
            </button>
          )}
        </div>

        <button
          onClick={handleClose}
          className="w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors underline pt-1"
        >
          Encerrar atendimento
        </button>
      </div>
    </div>
  );
}
