'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para detecção de abertura do teclado virtual em navegadores mobile (iOS Safari / Android Chrome).
 * Permite que a navegação inferior compacta recolha suavemente enquanto o usuário digita,
 * impedindo que a barra cubra o teclado ou campos de formulário.
 */
export function useVirtualKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Estratégia 1: VisualViewport API (padrão moderno para navegadores móveis)
    const viewport = window.visualViewport;

    const handleViewportResize = () => {
      if (!viewport) return;
      // Quando o teclado virtual abre, a altura do visualViewport diminui significativamente (>150px)
      const heightDifference = window.innerHeight - viewport.height;
      const isShrunk = heightDifference > 150;
      setIsKeyboardOpen(isShrunk);
    };

    if (viewport) {
      viewport.addEventListener('resize', handleViewportResize);
      viewport.addEventListener('scroll', handleViewportResize);
    }

    // Estratégia 2: Fallback por foco em elementos interativos de texto em telas touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const handleFocusIn = (e: FocusEvent) => {
      if (!isTouchDevice) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isTextInput =
        target.tagName === 'INPUT' &&
        !['button', 'submit', 'checkbox', 'radio', 'range', 'color', 'file'].includes(
          (target as HTMLInputElement).type
        );
      const isTextArea = target.tagName === 'TEXTAREA';
      const isContentEditable = target.isContentEditable;

      if (isTextInput || isTextArea || isContentEditable) {
        // Se viewport não deu sinal, ativa se a tela for menor que md
        if (window.innerWidth < 768) {
          setIsKeyboardOpen(true);
        }
      }
    };

    const handleFocusOut = () => {
      if (!isTouchDevice) return;
      // Pequeno timeout para evitar flash se o foco passar de um input para outro
      setTimeout(() => {
        const activeEl = document.activeElement as HTMLElement | null;
        const stillInInput =
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.isContentEditable);
        if (!stillInInput) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportResize);
        viewport.removeEventListener('scroll', handleViewportResize);
      }
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return { isKeyboardOpen };
}
