'use client';

import Link from 'next/link';
import type { BillingPlan, PlanSlug } from '@/lib/api/billing';
import type { BillingPeriod } from '@/lib/pricing/billing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { featureLabel, PLAN_RANK, referencePrice } from '@/lib/billing/plan-overview';

type Props = {
  plans: BillingPlan[];
  currentTier: string;
  billingPeriod: BillingPeriod;
  onBillingPeriodChange: (period: BillingPeriod) => void;
  onSelectPlan: (plan: BillingPlan, period: BillingPeriod) => void;
  pending: boolean;
  disabled?: boolean;
};

function enabledFeatures(plan: BillingPlan): string[] {
  return Object.entries(plan.features || {})
    .filter(([, value]) =>
      value === true ||
      (typeof value === 'number' && value > 0) ||
      (typeof value === 'object' && value !== null && (value.state === 'enabled' || value.state === 'limited'))
    )
    .slice(0, 5)
    .map(([key]) => featureLabel(key));
}

/** Same portable plan chooser in account dashboard and upgrade modal. No decorative icons. */
export function PlanSelector({
  plans, currentTier, billingPeriod, onBillingPeriodChange, onSelectPlan, pending, disabled = false,
}: Props) {
  const unique = new Map<PlanSlug, BillingPlan>();
  for (const plan of plans) {
    if (!(plan.slug in PLAN_RANK)) continue;
    const slug = plan.slug;
    if (!unique.has(slug)) unique.set(slug, plan);
  }
  const entries = [...unique.values()].sort((a, b) => PLAN_RANK[a.slug] - PLAN_RANK[b.slug]);
  const currentRank = currentTier in PLAN_RANK ? PLAN_RANK[currentTier as PlanSlug] : -1;

  return (
    <section aria-labelledby="plan-selector-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 id="plan-selector-heading" className="text-xl font-semibold tracking-tight text-[hsl(var(--dashboard-ink))]">Compare os planos</h3>
          <p className="mt-1 max-w-xl text-sm text-[hsl(var(--dashboard-muted))]">Escolha o período de contratação. Valores mensais, quando exibidos, são apenas equivalências.</p>
        </div>
        <Tabs value={billingPeriod} onValueChange={value => onBillingPeriodChange(value as BillingPeriod)}>
          <TabsList aria-label="Período de contratação" className="h-11 rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] p-1">
            <TabsTrigger value="six_months" className="h-9 rounded-md px-4 text-sm">6 meses</TabsTrigger>
            <TabsTrigger value="twelve_months" className="h-9 rounded-md px-4 text-sm">12 meses</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {entries.length === 0 ? (
        <Card className="rounded-xl border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] shadow-none">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-[hsl(var(--dashboard-muted))]">O catálogo de planos não está disponível no momento. Nenhuma contratação foi iniciada.</p>
            <Button asChild variant="outline" className="rounded-lg"><Link href="/pricing">Consultar planos públicos</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {entries.map(plan => {
            const selected = plan.slug === currentTier;
            const lower = PLAN_RANK[plan.slug] < currentRank;
            const noPurchase = selected || lower || plan.slug === 'free';
            const price = referencePrice(plan, billingPeriod);
            const features = enabledFeatures(plan);
            const featured = plan.slug === 'pro';
            const cta = selected
              ? 'Plano atual'
              : lower ? 'Gerenciar no faturamento'
                : plan.slug === 'free' ? 'Plano gratuito'
                  : plan.slug === 'enterprise' ? 'Solicitar proposta'
                    : 'Selecionar plano';
            return (
              <Card key={plan.id} className={`flex min-w-0 flex-col rounded-xl shadow-none transition-colors ${featured ? 'border-[hsl(var(--dashboard-accent))]' : 'border-[hsl(var(--dashboard-border))]'}`}>
                <CardHeader className="min-h-[125px] border-b border-[hsl(var(--dashboard-border))] px-5 pb-4 pt-5">
                  <div className="mb-2 flex min-h-6 flex-wrap items-center gap-2">
                    {selected && <Badge variant="outline" className="rounded-md border-[hsl(var(--dashboard-accent))]/30 text-[hsl(var(--dashboard-accent))]">Seu plano</Badge>}
                    {featured && <Badge className="rounded-md bg-[hsl(var(--dashboard-accent))] text-white hover:bg-[hsl(var(--dashboard-accent))]">Pro</Badge>}
                  </div>
                  <CardTitle className="text-xl font-semibold tracking-tight text-[hsl(var(--dashboard-ink))]">{plan.name}</CardTitle>
                  <p className="line-clamp-3 text-xs leading-5 text-[hsl(var(--dashboard-muted))]">{plan.summary || 'Conheça as condições e recursos deste plano.'}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5 px-5 pb-5 pt-5">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-[hsl(var(--dashboard-ink))]">{price.total}</p>
                    <p className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">{price.note}</p>
                    {price.equivalent && <p className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">Equivalente a {price.equivalent}/mês</p>}
                  </div>
                  <div className="flex-1 border-t border-slate-100 pt-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recursos do catálogo</p>
                    {features.length > 0 ? (
                      <ul className="space-y-2 text-xs leading-5 text-slate-700">
                        {features.map(name => <li key={name} className="border-l-2 border-blue-200 pl-2">{name}</li>)}
                      </ul>
                    ) : (
                      <p className="text-xs leading-5 text-slate-600">Consulte o comparativo público de recursos e limites.</p>
                    )}
                  </div>
                  <Button
                    className="min-h-11 w-full rounded-sm bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
                    variant={selected || lower || plan.slug === 'free' ? 'outline' : 'default'}
                    onClick={() => onSelectPlan(plan, billingPeriod)}
                    disabled={disabled || pending || noPurchase}
                    aria-label={`${cta}: ${plan.name}`}
                  >
                    {pending ? 'Aguarde...' : cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-xs leading-5 text-slate-500">
        Valores de referência iguais aos do site público. O valor definitivo e a disponibilidade do período são confirmados no checkout seguro.
        A liberação dos recursos depende das permissões efetivas da assinatura.
      </p>
      <Link href="/pricing" className="inline-block text-sm font-medium text-blue-700 underline-offset-4 hover:underline">
        Ver comparação completa e condições comerciais
      </Link>
    </section>
  );
}
