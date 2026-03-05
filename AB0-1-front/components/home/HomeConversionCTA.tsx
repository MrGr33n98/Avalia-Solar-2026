'use client';

import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { openQuoteWizard } from '@/lib/quote-wizard';

export function HomeConversionCTA() {
  return (
    <CTAPrimaryButton 
      label="Fazer Orçamento Grátis" 
      className="h-14 px-10 text-lg" 
      onClick={() => openQuoteWizard({ source: 'home_bottom_banner' })}
    />
  );
}
