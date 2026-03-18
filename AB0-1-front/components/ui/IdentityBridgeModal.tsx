'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Zap, Heart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { track } from '@/lib/analytics';

interface IdentityBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  title?: string;
  description?: string;
}

export default function IdentityBridgeModal({
  isOpen,
  onClose,
  onLogin,
  title = "Bem-vindo ao Avalia Solar!",
  description = "Acesse scores de confiança completos, compare instaladores certificados e salve seus orçamentos favoritos, tudo em um só lugar."
}: IdentityBridgeModalProps) {
  // PostHog Tracking for Modal Lifetime
  useEffect(() => {
    if (isOpen) {
      track('identity_bridge_modal_opened', {
        title,
        source_page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      });
    }
  }, [isOpen, title]);

  const handleClose = () => {
    track('identity_bridge_modal_closed', {
      method: 'close_button',
      source_page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
    onClose();
  };

  const handleLogin = () => {
    track('identity_bridge_conversion_click', {
      title,
      source_page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
    onLogin();
  };

  const handleStayLoggedOut = () => {
    track('identity_bridge_modal_closed', {
      method: 'stay_logged_out',
      source_page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
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
            onClick={handleClose}
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
                "clay-card w-full max-w-md overflow-hidden pointer-events-auto",
                "p-8 md:p-10 relative flex flex-col items-center text-center"
              )}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted smooth-transition group"
                aria-label="Fechar"
              >
                <X className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              </button>

              {/* Icon Stack/Visual Element */}
              <div className="relative mb-8">
                <div className="h-20 w-20 flex items-center justify-center bg-primary/10 rounded-2xl clay-convex">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute -top-2 -right-2 h-8 w-8 bg-accent/20 rounded-lg flex items-center justify-center backdrop-blur-md border border-accent/30 shadow-lg"
                >
                  <Zap className="h-4 w-4 text-accent" />
                </motion.div>
              </div>

              {/* Content */}
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">
                {title}
              </h2>
              
              <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
                {description}
              </p>

              {/* Benefits Grid (Subtle) */}
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span>Scores Reais</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  <Heart className="h-4 w-4 text-destructive" />
                  <span>Favoritos</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={handleLogin}
                  className="clay-btn-primary py-4 px-6 text-lg tracking-wide smooth-transition active:scale-95"
                >
                  Entrar ou Criar Conta Grátis
                </button>
                
                <button
                  onClick={handleStayLoggedOut}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium smooth-transition underline-offset-4 hover:underline"
                >
                  Continuar sem login
                </button>
              </div>

              {/* Trust Footer */}
              <p className="mt-8 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold">
                PLATAFORMA TRUST AS A SERVICE • 2026
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
