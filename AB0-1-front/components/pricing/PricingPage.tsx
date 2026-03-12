import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Lock,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  pricingFaqs,
  pricingFeatureGroups,
  pricingPlans,
  type Availability,
  type PlanSlug,
} from '@/lib/pricing/catalog';

const availabilityLabel: Record<Availability, string> = {
  included: 'Incluido',
  not_included: 'Nao incluido',
  contact_sales: 'Comercial',
};

const availabilityStyles: Record<Availability, string> = {
  included: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20',
  not_included: 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-400/20',
  contact_sales: 'bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/20',
};

const planAccent: Record<PlanSlug, string> = {
  free: 'from-slate-200 via-white to-slate-100',
  pro: 'from-brand-blue/20 via-cyan-100 to-white',
  enterprise: 'from-slate-900 via-slate-800 to-slate-700',
};

const planIcon = {
  free: Building2,
  pro: Zap,
  enterprise: ShieldCheck,
};

const AvailabilityCell = ({ value }: { value: Availability }) => {
  if (value === 'included') {
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${availabilityStyles[value]}`}>
        <Check className="h-3.5 w-3.5" />
        {availabilityLabel[value]}
      </span>
    );
  }

  if (value === 'contact_sales') {
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${availabilityStyles[value]}`}>
        <Lock className="h-3.5 w-3.5" />
        {availabilityLabel[value]}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${availabilityStyles[value]}`}>
      <X className="h-3.5 w-3.5" />
      {availabilityLabel[value]}
    </span>
  );
};

export default function PricingPage() {
  return (
    <main className="relative overflow-hidden bg-[linear-gradient(180deg,#f7f9fc_0%,#ffffff_22%,#f5f8ff_100%)]">
      <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(0,86,210,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(0,194,255,0.14),transparent_34%)]" />

      <section className="relative border-b border-slate-200/70 pt-16 pb-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <Badge className="clay-precision-chip mb-5 rounded-full px-4 py-1.5 text-[10px] tracking-[0.22em]" variant="outline">
              Planos e Entitlements
            </Badge>
            <h1 className="text-balance text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Precos pensados para presenca, conversao e operacao comercial madura.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-xl">
              O gratuito garante presenca minima. O Pro transforma o perfil em vitrine comercial.
              O Enterprise adiciona inteligencia, integracao e governanca operacional.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="clay-btn-primary h-12 rounded-full px-8">
                <Link href="/register">
                  Comecar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="clay-chip h-12 rounded-full border-slate-200 bg-white/90 px-8">
                <Link href="/contact">Falar com vendas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-5 xl:grid-cols-3">
            {pricingPlans.map((plan) => {
              const Icon = planIcon[plan.slug];

              return (
                <Card
                  key={plan.slug}
                  className={[
                    'clay-precision overflow-hidden rounded-[2rem] border-slate-200/70 bg-white/90',
                    plan.featured ? 'ring-2 ring-brand-blue/20 shadow-[0_24px_60px_-34px_rgba(0,86,210,0.35)]' : '',
                  ].join(' ')}
                >
                  <div className={`h-2 w-full bg-gradient-to-r ${planAccent[plan.slug]}`} />
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_14px_32px_-22px_rgba(15,23,42,0.6)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-black tracking-tight">{plan.name}</CardTitle>
                            <p className="text-sm text-slate-500">{plan.billingNote}</p>
                          </div>
                        </div>
                        {plan.badge ? (
                          <Badge className="rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-blue">
                            {plan.badge}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black tracking-tight text-slate-950">{plan.priceLabel}</div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{plan.audience}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm leading-relaxed text-slate-600">{plan.summary}</p>
                    <ul className="space-y-3">
                      {plan.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-3 text-sm text-slate-700">
                          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      size="lg"
                      variant={plan.featured ? 'default' : 'outline'}
                      className={[
                        'h-12 w-full rounded-full',
                        plan.featured ? 'clay-btn-primary border-0' : 'clay-chip border-slate-200 bg-white',
                      ].join(' ')}
                    >
                      <Link href={plan.ctaHref}>
                        {plan.ctaLabel}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-white/70 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8 max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Comparativo de recursos</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              O desenho comercial do V1 parte de uma regra clara: o plano pago compra mais conversao
              e menos distracao competitiva dentro do marketplace.
            </p>
          </div>

          <div className="space-y-6">
            {pricingFeatureGroups.map((group) => (
              <Card key={group.id} className="clay-precision rounded-[1.75rem] border-slate-200/70 bg-white/95">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-black tracking-tight">{group.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-[920px] w-full border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                          <th className="pb-2 pr-6">Funcionalidade</th>
                          <th className="pb-2 pr-4">Gratuito</th>
                          <th className="pb-2 pr-4">Pro</th>
                          <th className="pb-2">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row) => (
                          <tr key={row.key} className="align-top">
                            <td className="rounded-2xl bg-slate-50 px-4 py-4 pr-6">
                              <div className="font-semibold text-slate-950">{row.label}</div>
                              <div className="mt-1 text-sm leading-relaxed text-slate-500">{row.description}</div>
                            </td>
                            <td className="px-2 py-4"><AvailabilityCell value={row.availability.free} /></td>
                            <td className="px-2 py-4"><AvailabilityCell value={row.availability.pro} /></td>
                            <td className="px-2 py-4"><AvailabilityCell value={row.availability.enterprise} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto grid gap-6 px-4 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="clay-precision rounded-[2rem] border-slate-200/70 bg-slate-950 text-white">
            <CardHeader>
              <CardTitle className="text-2xl font-black tracking-tight">Como isso sera controlado no produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-slate-300">
              <p><strong className="text-white">Plano:</strong> define o entitlement canonico em <code>features_json</code>.</p>
              <p><strong className="text-white">Dashboard:</strong> mostra a feature como <code>enabled</code>, <code>locked</code> ou <code>hidden</code>.</p>
              <p><strong className="text-white">Perfil publico:</strong> renderiza ou suprime CTA, pricing, banner, prova social e blocos competitivos conforme o plano.</p>
              <p><strong className="text-white">Backend:</strong> aplica enforcement real para que blur seja UX de upsell, nao seguranca falsa.</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {pricingFaqs.map((faq) => (
              <Card key={faq.question} className="clay-precision rounded-[1.75rem] border-slate-200/70 bg-white/95">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-black tracking-tight">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-slate-600">{faq.answer}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
