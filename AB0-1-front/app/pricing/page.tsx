import type { Metadata } from 'next';

import PricingPage from '@/components/pricing/PricingPage';

export const metadata: Metadata = {
  title: 'Planos e Precos | Avalia Solar',
  description:
    'Compare os planos Gratuito, Pro e Enterprise da Avalia Solar e entenda quais recursos de vitrine, conversao, analytics e integracao cada nivel libera.',
};

export default function PricingRoutePage() {
  return <PricingPage />;
}
