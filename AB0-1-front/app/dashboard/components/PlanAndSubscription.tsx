'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { billingApi, type BillingPlan, type BillingSubscription } from '@/lib/api/billing';
import { fetchApiSafe } from '@/lib/api-client';
import type { BillingPeriod } from '@/lib/pricing/billing';
import {
  featureLabel, formatBillingDate, isFeatureEnabled, parseBillingStatus,
  parseCompanyEntitlements, type CompanyEntitlements,
} from '@/lib/billing/plan-overview';
import { PlanSelector } from '@/components/billing/PlanSelector';

type BillingAccess = 'available' | 'not-configured' | 'restricted' | 'unavailable';

type Props = {
  companyId: string;
  onOpenPlans?: () => void;
  onSelectPlan?: (plan: BillingPlan, period: BillingPeriod) => void;
  isCheckoutLoading?: boolean;
};

type BillingData = {
  entitlements: CompanyEntitlements | null;
  subscription: BillingSubscription | null;
  billingAccess: BillingAccess;
  plans: BillingPlan[];
  plansError: boolean;
  usage: Record<string, number>;
};

function httpStatus(error: unknown): number | null {
  if (error && typeof error === 'object' && 'status' in error && typeof error.status === 'number') {
    return error.status;
  }
  return null;
}

function parseUsage(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, usage]) => typeof usage === 'number' && Number.isFinite(usage) && usage >= 0)
  ) as Record<string, number>;
}

export default function PlanAndSubscription({
  companyId, onOpenPlans, onSelectPlan, isCheckoutLoading = false,
}: Props) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('twelve_months');
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const id = Number(companyId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError('Identificador de empresa inválido.');
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setData(null);
    setError(null);
    setActionError(null);
    setLoading(true);

    const load = async () => {
      const [entitlementResult, subscriptionResult, plansResult] = await Promise.allSettled([
        fetchApiSafe<unknown>(`company_dashboard/subscription?company_id=${id}`, { retries: 0, cacheTtlMs: 0 }),
        billingApi.getSubscription(id),
        billingApi.getPlans(),
      ]);
      if (cancelled) return;

      const plans = plansResult.status === 'fulfilled' && Array.isArray(plansResult.value)
        ? plansResult.value.filter(plan => plan && Number.isSafeInteger(plan.id) && plan.id > 0)
        : [];

      let billingAccess: BillingAccess = 'not-configured';
      let subscription: BillingSubscription | null = null;
      if (subscriptionResult.status === 'fulfilled') {
        subscription = subscriptionResult.value;
        billingAccess = subscription ? 'available' : 'not-configured';
      } else {
        billingAccess = httpStatus(subscriptionResult.reason) === 403 ? 'restricted' : 'unavailable';
      }

      const entitlements = entitlementResult.status === 'fulfilled'
        ? parseCompanyEntitlements(entitlementResult.value)
        : null;
      const response = entitlementResult.status === 'fulfilled'
        ? entitlementResult.value as Record<string, unknown>
        : null;

      // A falha de entitlements nao deve ocultar o catalogo publico de planos.
      // Nunca supor plano gratuito, assinatura cancelada ou autorizacao de compra.
      if (entitlementResult.status === 'rejected') {
        const status = httpStatus(entitlementResult.reason);
        setError(status === 403 ? 'Você não tem permissão para visualizar este painel.' :
          status === 401 ? 'Sua sessão expirou. Entre novamente para consultar o plano.' :
          'Não foi possível consultar os recursos da empresa. Tente novamente.');
      } else if (!entitlements) {
        setError('O servidor retornou um contrato de planos inválido. Nenhuma informação foi presumida.');
      }

      setData({
        entitlements,
        subscription,
        billingAccess,
        plans,
        plansError: plansResult.status === 'rejected',
        usage: parseUsage(response?.usage),
      });
      setLoading(false);
    };

    void load();
    return () => { cancelled = true; };
  }, [companyId, revision]);

  const retry = useCallback(() => setRevision(value => value + 1), []);

  const features = useMemo(() =>
    Object.entries(data?.entitlements?.features || {})
      .filter(([, entry]) => entry.state !== 'hidden')
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, 'pt-BR')),
    [data?.entitlements]
  );

  const enabledCount = features.filter(([, entry]) => isFeatureEnabled(entry)).length;
  const visibleFeatures = showAllFeatures ? features : features.slice(0, 12);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    setActionError(null);
    try {
      const { portal_url: portalUrl } = await billingApi.createPortalSession(Number(companyId), window.location.href);
      const url = new URL(portalUrl);
      if (url.protocol !== 'https:' || !(url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com'))) {
        throw new Error('O provedor retornou um endereço de faturamento inválido.');
      }
      window.location.assign(url.toString());
    } catch (reason) {
      setActionError(httpStatus(reason) === 403
        ? 'Somente um proprietário autorizado pode gerenciar pagamentos.'
        : reason instanceof Error ? reason.message : 'Não foi possível abrir o portal de faturamento.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div aria-label="Carregando plano e assinatura" className="space-y-5">
        <Skeleton className="h-44 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !data?.entitlements) {
    return (
      <div className="space-y-6 pb-8">
        <Alert className="rounded-lg border-red-200 bg-red-50 text-red-900" role="alert">
          <AlertTitle>Não foi possível carregar os recursos da empresa</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>{error || 'As informações estão temporariamente indisponíveis.'}</p>
            <Button type="button" variant="outline" onClick={retry} className="rounded-sm">Tentar novamente</Button>
          </AlertDescription>
        </Alert>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Você ainda pode consultar os planos públicos abaixo. A contratação fica indisponível neste painel até a confirmação do plano atual.</p>
          <PlanSelector
            plans={data?.plans || []}
            currentTier={data?.subscription?.plan?.slug || ''}
            billingPeriod={billingPeriod}
            onBillingPeriodChange={setBillingPeriod}
            onSelectPlan={() => undefined}
            pending={false}
            disabled
          />
        </div>
      </div>
    );
  }

  const { entitlements, subscription, billingAccess, plans, usage } = data;
  const planTier = entitlements.plan.tier;
  const planName = entitlements.plan.name || (planTier === 'free' ? 'Gratuito' : planTier.toUpperCase());
  const status = subscription
    ? parseBillingStatus(subscription.status)
    : planTier === 'free' && billingAccess === 'not-configured'
      ? 'Gratuito'
      : 'Não confirmado';
  const endDate = subscription ? formatBillingDate(subscription.current_period_end) : null;
  const cancellable = Boolean(subscription && billingAccess === 'available' && subscription.can_manage_billing === true);

  return (
    <div className="space-y-7 pb-8">
      <div className="border-b border-[hsl(var(--dashboard-border))] pb-5">
        <p className="text-xs font-semibold text-[hsl(var(--dashboard-accent))]">Conta empresarial / Assinatura</p>
        <h2 className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))]">Plano e Assinatura</h2>
        <p className="mt-1 max-w-2xl text-xs text-[hsl(var(--dashboard-muted))]">Veja seus recursos, compare opções e gerencie o plano da empresa com segurança.</p>
      </div>

      <Card className="overflow-hidden rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] shadow-xs">
        <div className="h-1 w-full bg-[hsl(var(--dashboard-accent))]" aria-hidden="true" />
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-[hsl(var(--dashboard-border))] pb-6">
          <div>
            <p className="mb-1 text-xs font-medium text-[hsl(var(--dashboard-muted))]">Plano atual</p>
            <CardTitle aria-label={`Plano atual: ${planName}`} className="text-2xl lg:text-3xl font-bold tracking-tight text-[hsl(var(--dashboard-ink))]">{planName}</CardTitle>
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">O acesso aos recursos segue as permissões efetivas da empresa.</p>
          </div>
          <Badge variant="outline" className="rounded-md border-[hsl(var(--dashboard-border))] px-3 py-1 text-xs text-[hsl(var(--dashboard-ink))]">{status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[hsl(var(--dashboard-muted))]">Vigência do período atual</dt>
              <dd className="mt-1 font-semibold text-[hsl(var(--dashboard-ink))]">{endDate || (planTier === 'free' ? 'Sem vencimento' : 'Não disponível')}</dd>
            </div>
            <div>
              <dt className="text-xs text-[hsl(var(--dashboard-muted))]">Cobrança</dt>
              <dd className="mt-1 font-semibold text-[hsl(var(--dashboard-ink))]">{subscription?.cancel_at_period_end
                ? 'Cancelamento programado'
                : billingAccess === 'restricted' ? 'Acesso restrito'
                  : billingAccess === 'available' ? 'Consulte o portal Stripe'
                    : planTier === 'free' ? 'Sem cobrança' : 'Detalhes não disponíveis'}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
            {cancellable && (
              <Button variant="outline" className="min-h-10 rounded-lg border-[hsl(var(--dashboard-border))] text-xs font-medium text-[hsl(var(--dashboard-ink))] hover:bg-[hsl(var(--dashboard-surface))]"
                disabled={portalLoading} onClick={() => void openBillingPortal()}>
                {portalLoading ? 'Abrindo...' : 'Gerenciar pagamento'}
              </Button>
            )}
            {onOpenPlans && (
              <Button className="min-h-10 rounded-lg bg-[hsl(var(--dashboard-accent))] text-white text-xs font-medium hover:bg-[hsl(var(--dashboard-accent))/0.9]"
                onClick={onOpenPlans}>Ver opções de upgrade</Button>
            )}
            <Button asChild variant="ghost" className="min-h-10 rounded-lg text-xs font-medium text-[hsl(var(--dashboard-accent))]">
              <Link href="/pricing">Ver condições comerciais</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {billingAccess === 'restricted' && (
        <Alert className="rounded-lg border-slate-200 bg-slate-50">
          <AlertTitle>Gerenciamento de pagamentos restrito</AlertTitle>
          <AlertDescription>Um proprietário autorizado pode consultar a assinatura comercial e gerenciar pagamentos. Os recursos disponíveis do plano continuam visíveis abaixo.</AlertDescription>
        </Alert>
      )}
      {billingAccess === 'unavailable' && (
        <Alert className="rounded-lg border-amber-200 bg-amber-50">
          <AlertTitle>Faturamento temporariamente indisponível</AlertTitle>
          <AlertDescription>Os recursos do plano foram carregados, mas os detalhes de cobrança não puderam ser consultados. Nenhuma alteração foi efetuada. <button type="button" onClick={retry} className="font-semibold underline">Tentar novamente</button>.</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert className="rounded-lg border-red-200 bg-red-50" role="alert">
          <AlertTitle>Não foi possível concluir a operação</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="features-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="features-heading" className="text-lg font-semibold tracking-tight text-[hsl(var(--dashboard-ink))]">Recursos do seu plano</h3>
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">Dados do motor de permissões; não são estimativas de consumo.</p>
          </div>
          <p className="text-xs font-medium text-[hsl(var(--dashboard-muted))]">{enabledCount} recursos habilitados</p>
        </div>
        <Card className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] shadow-xs">
          <CardContent className="p-0">
            {visibleFeatures.length ? (
              <div className="divide-y divide-[hsl(var(--dashboard-border))]">
                {visibleFeatures.map(([key, entry]) => {
                  const enabled = isFeatureEnabled(entry);
                  const isLimit = typeof entry.value === 'number';
                  const consumed = usage[key];
                  const hasUsage = isLimit && Number.isFinite(consumed) && consumed >= 0;
                  const limit = isLimit ? Number(entry.value) : null;
                  return (
                    <div key={key} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[hsl(var(--dashboard-ink))]">{featureLabel(key)}</p>
                        {isLimit && (
                          <div className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">
                            Limite do plano: {limit} {hasUsage ? `· Utilizado: ${consumed}` : '· Consumo não disponível'}
                          </div>
                        )}
                        {isLimit && hasUsage && limit !== null && limit > 0 && (
                          <Progress className="mt-2 h-1.5 max-w-xs bg-[hsl(var(--dashboard-surface))]" value={Math.min(100, Math.round((consumed / limit) * 100))} />
                        )}
                      </div>
                      <div className="text-xs font-medium sm:text-right">
                        <span className={enabled ? 'text-[hsl(var(--dashboard-accent))] font-semibold' : 'text-[hsl(var(--dashboard-muted))]'}>
                          {entry.state === 'unavailable' ? 'Consulta indisponível' : enabled ? isLimit ? 'Disponível' : 'Incluído' : entry.state === 'locked' ? 'Disponível no upgrade' : 'Indisponível'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="p-6 text-xs text-[hsl(var(--dashboard-muted))]">Nenhum recurso foi informado para esta empresa.</p>}
            {features.length > 12 && (
              <div className="border-t border-[hsl(var(--dashboard-border))] p-4 text-center">
                <Button variant="ghost" onClick={() => setShowAllFeatures(value => !value)}
                  className="rounded-lg text-xs font-medium text-[hsl(var(--dashboard-accent))]">
                  {showAllFeatures ? 'Mostrar menos recursos' : `Ver todos os ${features.length} recursos`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div id="comparar-planos" className="scroll-mt-24 border-t border-slate-200 pt-7">
        {data.plansError && (
          <Alert className="mb-4 rounded-lg border-amber-200 bg-amber-50">
            <AlertTitle>Catálogo de planos indisponível</AlertTitle>
            <AlertDescription>Não foi possível consultar os planos públicos. <button className="font-semibold underline" type="button" onClick={retry}>Tentar novamente</button>.</AlertDescription>
          </Alert>
        )}
        <PlanSelector
          plans={plans}
          currentTier={planTier}
          billingPeriod={billingPeriod}
          onBillingPeriodChange={setBillingPeriod}
          onSelectPlan={(plan, period) => onSelectPlan?.(plan, period)}
          pending={isCheckoutLoading}
          disabled={!onSelectPlan || billingAccess === 'restricted' ||
            billingAccess === 'unavailable' || subscription?.can_manage_billing === false}
        />
      </div>
    </div>
  );
}
