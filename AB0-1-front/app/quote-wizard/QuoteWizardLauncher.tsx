'use client';

import { useEffect } from 'react';

import { openQuoteWizard } from '@/lib/quote-wizard';

export default function QuoteWizardLauncher() {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      openQuoteWizard({ source: 'quote-wizard-route' });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <button
      type="button"
      onClick={() => openQuoteWizard({ source: 'quote-wizard-route-button' })}
      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
    >
      Abrir diagnóstico solar
    </button>
  );
}

