'use client';

import { CTAPrimaryButton } from '@/components/ui/CTAPrimaryButton';
import { openQuoteWizard } from '@/lib/quote-wizard';

export function HomeConversionCTA() {
  return (
    <CTAPrimaryButton
      label="Pedir orçamento gratuito"
      className="h-auto w-full rounded-none border-[#FFC82C] bg-[#FFC82C] px-8 py-4 text-base font-semibold text-[#070B16] shadow-none hover:border-[#FFD65A] hover:bg-[#FFD65A] lg:w-auto"
      onClick={() => openQuoteWizard({ source: 'home_bottom_banner' })}
    />
  );
}
