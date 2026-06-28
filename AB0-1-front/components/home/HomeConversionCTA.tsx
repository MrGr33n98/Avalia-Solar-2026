'use client';

import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { openQuoteWizard } from '@/lib/quote-wizard';

export function HomeConversionCTA() {
  return (
    <CTAPrimaryButton 
      label="Pedir orçamento gratuito" 
      className="h-12 w-full bg-amber-400 px-7 text-base font-extrabold text-slate-950 hover:bg-amber-300 md:w-auto" 
      onClick={() => openQuoteWizard({ source: 'home_bottom_banner' })}
    />
  );
}
