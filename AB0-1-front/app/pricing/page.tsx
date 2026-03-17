import type { Metadata } from 'next';
import { Suspense } from 'react';

import PricingPage from '@/components/pricing/PricingPage';
import { PricingIntentTracker } from '@/components/pricing/PricingIntentTracker';

export const metadata: Metadata = {
  title: 'Planos e Precos | Avalia Solar',
  description:
    'Compare os planos Gratuito, Pro e Enterprise da Avalia Solar e entenda quais recursos de vitrine, conversao, analytics e integracao cada nivel libera.',
};

export default function PricingRoutePage() {
  return (
    <>
      <PricingPage />
      {/* Intent tracking: exit intent, scroll depth, time on page, plan CTAs */}
      <Suspense fallback={null}>
        <PricingIntentTracker />
      </Suspense>
    </>
  );
}
