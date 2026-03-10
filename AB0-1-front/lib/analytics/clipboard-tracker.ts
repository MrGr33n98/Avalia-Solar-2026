'use client';

import { trackCopyClipboard } from './micro-interactions';

export const initClipboardTracking = () => {
  if (typeof window === 'undefined') return;

  document.addEventListener('copy', (e) => {
    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();
    if (!text) return;

    // Detect data types
    let textType = 'unknown';
    
    if (/^\d{14}$/.test(text.replace(/\D/g, ''))) {
      textType = 'cnpj';
    } else if (/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(text)) {
      textType = 'phone';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      textType = 'email';
    }

    trackCopyClipboard(textType, text);
  });
};
