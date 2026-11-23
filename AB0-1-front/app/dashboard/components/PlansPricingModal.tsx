'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { billingApi, type BillingPlan, type PlanSlug } from '@/lib/api/billing';
import type { BillingPeriod } from '@/lib/pricing/billing';
import { PlanSelector } from '@/components/billing/PlanSelector';

export type { PlanSlug } from '@/lib/api/billing';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanTier?: string;
  onSelectPlan?: (plan: BillingPlan, period: BillingPeriod) => void;
  isLoadingCheckout?: boolean;
};

/** Reused across paywall entry points. Commercial IDs come only from the public Plans API. */
export function PlansPricingModal({
  open, onOpenChange, currentPlanTier = 'free', onSelectPlan, isLoadingCheckout = false,
}: Props) {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [period, setPeriod] = useState<BillingPeriod>('twelve_months');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setPlans([]);
    billingApi.getPlans().then(data => {
      if (cancelled) return;
      setPlans(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (!cancelled) setError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, attempt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-24px)] max-w-6xl overflow-y-auto rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xl sm:p-8">
        <DialogHeader className="border-b border-[hsl(var(--dashboard-border))] pb-5 text-left">
          <p className="text-xs font-semibold text-[hsl(var(--dashboard-accent))]">Avalia Solar / Planos empresariais</p>
          <DialogTitle className="mt-2 text-2xl font-semibold tracking-tight text-[hsl(var(--dashboard-ink))] sm:text-3xl">
            Escolha o plano ideal para sua empresa
          </DialogTitle>
          <DialogDescription className="max-w-3xl text-xs leading-6 text-[hsl(var(--dashboard-muted))]">
            Compare os planos oficiais e contrate com segurança. Os recursos são aplicados conforme o plano autorizado pelo servidor.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div aria-label="Carregando planos" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map(value => <Skeleton key={value} className="h-80 rounded-lg" />)}
          </div>
        ) : (
          <>
            {error && (
              <Alert className="rounded-lg border-amber-200 bg-amber-50">
                <AlertDescription>
                  Não foi possível consultar os planos.
                  <Button type="button" variant="link" className="ml-1 text-blue-700"
                    onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button>
                </AlertDescription>
              </Alert>
            )}
            <PlanSelector
              plans={plans}
              currentTier={currentPlanTier}
              billingPeriod={period}
              onBillingPeriodChange={setPeriod}
              onSelectPlan={(plan, billingPeriod) => onSelectPlan?.(plan, billingPeriod)}
              pending={isLoadingCheckout}
              disabled={!onSelectPlan}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
