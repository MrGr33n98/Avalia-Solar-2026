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
                "clay-card w-full max-w-[21rem] overflow-hidden pointer-events-auto",
                "p-5 md:p-6 relative flex flex-col items-center text-center"
              )}
            >
              {/* Close Button */}
              {canDismiss && (
                <button
                  onClick={handleClose}
                  className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-muted smooth-transition group"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </button>
              )}

              {/* Icon Stack/Visual Element */}
              <div className="relative mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 clay-convex">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-lg border border-accent/30 bg-accent/20 shadow-lg backdrop-blur-md"
                >
                  <Zap className="h-3 w-3 text-accent" />
                </motion.div>
              </div>

              {/* Content */}
              <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground md:text-2xl">
                {title}
              </h2>
              
              <p className="mb-5 max-w-[24ch] text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
                {description}
              </p>

              {/* Benefits Grid (Subtle) */}
              <div className="mb-5 grid w-full grid-cols-2 gap-2.5">
                <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span>Scores Reais</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
                  <Heart className="h-4 w-4 text-destructive" />
                  <span>Favoritos</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={handleLogin}
                  className="clay-btn-primary px-4 py-3 text-base tracking-wide smooth-transition active:scale-95"
                >
                  {primaryActionLabel}
                </button>

                {showSecondaryAction && (
                  <button
                    onClick={handleStayLoggedOut}
                    className="text-xs font-medium text-muted-foreground smooth-transition underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {secondaryActionLabel}
                  </button>
                )}
              </div>

              {/* Trust Footer */}
              <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground/50">
                PLATAFORMA TRUST AS A SERVICE • 2026
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
