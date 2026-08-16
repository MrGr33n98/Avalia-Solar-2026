import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PricingPage = dynamic(() => import('@/components/pricing/PricingPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] animate-pulse bg-slate-50" aria-label="Carregando planos" />
  ),
});
const PricingIntentTracker = dynamic(
  () => import('@/components/pricing/PricingIntentTracker').then((mod) => mod.PricingIntentTracker),
  {
    ssr: false,
  }
);

export const metadata: Metadata = {
  title: 'Planos e Preços | Avalia Solar',
  description:
    'Compare os planos Gratuito, Essencial, Pro e Enterprise da Avalia Solar e escolha os recursos ideais para sua empresa.',
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
