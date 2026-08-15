'use client';

import { QuoteCTA } from '@/components/quote/QuoteCTA';

export function HomeConversionCTA() {
  return (
    <QuoteCTA context="hero" source="home_bottom_banner" shortLabel="Orçamento" className="w-full rounded-none border-[#FFC82C] bg-[#FFC82C] text-[#070B16] hover:bg-[#FFD65A] hover:text-[#070B16] lg:w-auto" />
  );
}
