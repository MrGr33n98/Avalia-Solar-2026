'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Zap, Heart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

interface IdentityBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSecondaryAction?: () => void;
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  showSecondaryAction?: boolean;
  canDismiss?: boolean;
  trackAnalytics?: boolean;
}

export default function IdentityBridgeModal({
  isOpen,
  onClose,
  onLogin,
  onSecondaryAction,
  title = "Bem-vindo ao Avalia Solar!",
  description = "Acesse scores de confiança completos, compare instaladores certificados e salve seus orçamentos favoritos, tudo em um só lugar.",
  primaryActionLabel = "Entrar ou Criar Conta Grátis",
  secondaryActionLabel = "Continuar sem login",
  showSecondaryAction = true,
  canDismiss = true,
  trackAnalytics = true,
}: IdentityBridgeModalProps) {
  // PostHog Tracking for Modal Lifetime
  useEffect(() => {
    if (isOpen && trackAnalytics) {
      track('identity_bridge_modal_opened', {
        title,
        source_page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      });
    }
  }, [isOpen, title, trackAnalytics]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (trackAnalytics) {
      track('identity_bridge_modal_closed', {
        method: 'close_button',
        source_page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      });
    }
    onClose();
  };

  const handleLogin = () => {
    if (trackAnalytics) {
      track('identity_bridge_conversion_click', {
        title,
        source_page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      });
    }
    onLogin();
  };

  const handleStayLoggedOut = () => {
    if (trackAnalytics) {
      track('identity_bridge_modal_closed', {
        method: 'stay_logged_out',
        source_page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      });
    }
    if (onSecondaryAction) {
      onSecondaryAction();
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={canDismiss ? handleClose : undefined}
            className="fixed inset-0 z-50 bg-as-slate-950/40 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "pointer-events-auto relative flex w-full max-w-[26rem] flex-col items-center overflow-hidden rounded-lg border border-slate-200 bg-white px-6 py-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:px-7 md:py-7"
              )}
            >
              {/* Close Button */}
              {canDismiss && (
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Icon Stack/Visual Element */}
              <div className="relative mb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
                </div>
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 shadow-sm"
                >
                  <Zap className="h-3 w-3 text-emerald-600" />
                </motion.div>
              </div>

              {/* Content */}
              <h2 className="mb-3 max-w-[12ch] text-[1.85rem] font-black tracking-tight text-slate-950 md:text-[2.15rem] md:leading-[1.05]">
                {title}
              </h2>
              
              <p className="mb-5 max-w-[22ch] text-sm leading-7 text-slate-500 md:text-[0.98rem]">
                {description}
              </p>

              {/* Benefits Grid (Subtle) */}
              <div className="mb-5 grid w-full grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-600">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span>Scores Reais</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-600">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span>Favoritos</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={handleLogin}
                  className="h-12 w-full rounded-md bg-blue-600 px-4 text-[15px] font-bold tracking-wide text-white shadow-[0_10px_30px_rgba(37,99,235,0.32)] transition-colors hover:bg-blue-700 active:scale-[0.99]"
                >
                  {primaryActionLabel}
                </button>

                {showSecondaryAction && (
                  <button
                    onClick={handleStayLoggedOut}
                    className="text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
                  >
                    {secondaryActionLabel}
                  </button>
                )}
              </div>

              {/* Trust Footer */}
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                PLATAFORMA TRUST AS A SERVICE • 2026
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
