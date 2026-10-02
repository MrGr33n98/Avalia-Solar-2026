'use client';

import { useEffect } from 'react';

import { openQuoteWizard } from '@/lib/quote-wizard';

export default function QuoteWizardLauncher({
  preferredCompanyId,
  source = 'quote-wizard-route',
}: {
  preferredCompanyId?: number;
  source?: string;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      openQuoteWizard({ preferredCompanyId, source });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [preferredCompanyId, source]);

  return (
    <button
      type="button"
      onClick={() => openQuoteWizard({ preferredCompanyId, source: `${source}-button` })}
      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
    >
      Abrir diagnóstico solar
    </button>
  );
}
