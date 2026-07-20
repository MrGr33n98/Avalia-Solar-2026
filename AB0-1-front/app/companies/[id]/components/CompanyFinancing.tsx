'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Banknote,
  Sparkles,
  AlertCircle,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Company, CompanyFinancingOffer, CompanyFinancingPartner, FinancingOption } from '@/lib/api';
import { companiesApiSafe } from '@/lib/api-client';
import { useCalculatorInput } from '@/lib/analytics/hooks/useIntentTracking';
import { simulateFinancing, AmortizationType } from '@/lib/financing';
import { cn } from '@/lib/utils';
import { FinancialInstitutionDropdown } from '@/components/financing/FinancialInstitutionDropdown';
import { FinancialInstitution } from '@/lib/api';

type Props = {
  company?: Company;
  companyId?: number;
};

const formatCurrency = (value: number, currency: string = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);

const clamp = (value: number, min?: number | null, max?: number | null) => {
  let result = value;
  if (typeof min === 'number') result = Math.max(min, result);
  if (typeof max === 'number') result = Math.min(max, result);
  return result;
};

export default function CompanyFinancing({ company, companyId }: Props) {
  const [companyData, setCompanyData] = useState<Company | null>(company || null);
  const trackingCompanyId = companyData?.id ?? companyId ?? company?.id ?? '';
  const { trackSimulation } = useCalculatorInput(trackingCompanyId);

  useEffect(() => {
    if (company) {
      setCompanyData(company);
      return;
    }
    if (!companyId) return;
    companiesApiSafe
      .getById(companyId)
      .then((data: any) => {
        if (data?.company) {
          setCompanyData(data.company as Company);
        } else {
          setCompanyData(data as Company);
        }
      })
      .catch(() => {});
  }, [company, companyId]);

  const profile = companyData?.financing_profile;
  const partners = (companyData?.financing_partners || []).filter((p) => p.active !== false);
  const offers = (companyData?.financing_offers || []).filter((o) => o.active !== false);
  const currency = profile?.currency || 'BRL';

  const [amount, setAmount] = useState<number>(
    profile?.default_amount_cents ? profile.default_amount_cents / 100 : 50000,
  );
  const [downPayment, setDownPayment] = useState<number>(profile?.default_down_payment_percent ?? 20);
  const [termMonths, setTermMonths] = useState<number>(profile?.default_term_months ?? 60);
  const [interest, setInterest] = useState<number>(profile?.default_interest_rate_monthly ?? 1.2);
  const [amortization, setAmortization] = useState<AmortizationType>(
    (profile?.amortization_type as AmortizationType) || 'price',
  );
  const [graceMonths, setGraceMonths] = useState<number>(0);
  const [selectedInstitution, setSelectedInstitution] = useState<FinancialInstitution | null>(null);

  useEffect(() => {
    if (!profile) return;
    setAmount(profile.default_amount_cents ? profile.default_amount_cents / 100 : 50000);
    setDownPayment(profile.default_down_payment_percent ?? 20);
    setTermMonths(profile.default_term_months ?? 60);
    setInterest(profile.default_interest_rate_monthly ?? 1.2);
    setAmortization((profile.amortization_type as AmortizationType) || 'price');
  }, [profile]);

  const simulation = useMemo(
    () =>
      simulateFinancing({
        amount,
        downPaymentPercent: downPayment,
        termMonths,
        interestRateMonthly: interest,
        graceMonths: profile?.grace_months_enabled ? graceMonths : 0,
        amortizationType: amortization,
      }),
    [amount, downPayment, termMonths, interest, graceMonths, amortization, profile?.grace_months_enabled],
  );

  const applyOffer = (offer: CompanyFinancingOffer | FinancingOption, institution?: FinancialInstitution) => {
    const o = offer as any;
    const term = o.term_months || o.max_term_months;
    const rate = o.interest_rate_monthly || o.interest_rate_percent;
    const minDown = o.min_down_payment_percent || o.minimum_down_payment_percentage;
    const grace = o.grace_months || o.grace_period_months;
    const amort = o.amortization_type || o.amortization_system;

    if (term) setTermMonths(term);
    if (rate) setInterest(rate);
    if (minDown) setDownPayment(minDown);
    if (amort) setAmortization(amort as AmortizationType);
    if (grace) setGraceMonths(grace);
    
    if (institution) setSelectedInstitution(institution);

    if (trackingCompanyId) {
      trackSimulation(amount, term ?? termMonths);
    }
  };

  const trackCurrentSimulation = useCallback(
    (nextAmount: number = amount, nextTermMonths: number = termMonths) => {
      if (!trackingCompanyId) return;
      trackSimulation(nextAmount, nextTermMonths);
    },
    [amount, termMonths, trackSimulation, trackingCompanyId]
  );

  const ctaUrl =
    profile?.cta_url ||
    (companyData as any)?.whatsapp_url ||
    companyData?.whatsapp ||
    companyData?.website;
  const ctaLabel = profile?.cta_label || 'Falar com especialista';

  const microBanner = selectedInstitution?.banners?.find(
    (b) => b.position === 'financing_simulator_micro_banner' && b.active
  );

  if (!companyData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {microBanner && microBanner.image_url && (
        <a 
          href={microBanner.link_url || microBanner.link || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full overflow-hidden rounded-lg shadow-sm hover:shadow-md transition border border-primary/20"
        >
          <img 
            src={microBanner.image_url} 
            alt={microBanner.title || 'Banner Patrocinado'} 
            className="w-full h-auto max-h-[120px] object-cover"
          />
        </a>
      )}

      <Card className="border-none shadow-lg bg-card/70 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                {profile?.title || 'Simule seu financiamento solar'}
              </CardTitle>
              <CardDescription className="text-base">
                {profile?.subtitle ||
                  'Defina o valor do projeto, entrada e prazo para ver a parcela estimada em tempo real.'}
              </CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {profile?.status === 'published' ? 'Publicado' : 'Rascunho'}
                </Badge>
                {profile?.show_fee_inputs && (
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Taxas customizáveis
                  </Badge>
                )}
                {profile?.grace_months_enabled && (
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    Carência habilitada
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {currency}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-3">
              <label className="text-sm font-medium text-muted-foreground">Instituição Financeira</label>
              <FinancialInstitutionDropdown 
                onSelectOption={applyOffer} 
              />
            </div>
            
            <div className="grid gap-3">
              <label className="text-sm font-medium text-muted-foreground">Valor do projeto</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(clamp(Number(e.target.value || 0), profile?.min_amount_cents ? profile.min_amount_cents / 100 : undefined, profile?.max_amount_cents ? profile.max_amount_cents / 100 : undefined))}
                onBlur={() => trackCurrentSimulation()}
                min={profile?.min_amount_cents ? profile.min_amount_cents / 100 : 1000}
                max={profile?.max_amount_cents ? profile.max_amount_cents / 100 : undefined}
                className="h-11"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Entrada ({downPayment.toFixed(0)}%)</span>
                <span>{formatCurrency((amount * downPayment) / 100, currency)}</span>
              </div>
              <Slider
                value={[downPayment]}
                min={profile?.min_down_payment_percent ?? 0}
                max={profile?.max_down_payment_percent ?? 80}
                step={1}
                onValueChange={(v) => setDownPayment(v[0])}
                onValueCommit={() => trackCurrentSimulation()}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Prazo</span>
                <span>{termMonths} meses</span>
              </div>
              <Slider
                value={[termMonths]}
                min={profile?.min_term_months ?? 12}
                max={profile?.max_term_months ?? 120}
                step={1}
                onValueChange={(v) => setTermMonths(v[0])}
                onValueCommit={(value) => trackCurrentSimulation(amount, value[0])}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Taxa mensal</span>
                <span>{interest.toFixed(2)}%</span>
              </div>
              <Input
                type="number"
                value={interest}
                step={0.01}
                disabled={!profile?.show_fee_inputs}
                onChange={(e) => setInterest(Number(e.target.value || 0))}
                onBlur={() => trackCurrentSimulation()}
              />
            </div>

            {profile?.grace_months_enabled && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Carência</span>
                  <span>{graceMonths} meses</span>
                </div>
                <Slider
                  value={[graceMonths]}
                  min={0}
                  max={profile?.max_grace_months ?? 12}
                  step={1}
                  onValueChange={(v) => setGraceMonths(v[0])}
                  onValueCommit={() => trackCurrentSimulation()}
                />
              </div>
            )}

            <Tabs
              value={amortization}
              onValueChange={(v) => {
                setAmortization(v as AmortizationType);
                trackCurrentSimulation();
              }}
            >
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="price">Price</TabsTrigger>
                <TabsTrigger value="sac">SAC</TabsTrigger>
              </TabsList>
              <TabsContent value="price" className="text-sm text-muted-foreground">
                Parcelas fixas ao longo do prazo.
              </TabsContent>
              <TabsContent value="sac" className="text-sm text-muted-foreground">
                Parcelas decrescentes com amortização linear.
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                label="Parcela estimada"
                value={formatCurrency(simulation.monthlyPayment, currency)}
                highlight
              />
              <SummaryCard label="Valor financiado" value={formatCurrency(simulation.financedAmount, currency)} />
              <SummaryCard label="Total em juros" value={formatCurrency(simulation.totalInterest, currency)} />
              <SummaryCard label="Custo total" value={formatCurrency(simulation.totalPaid, currency)} />
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              {profile?.disclaimer && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                  <AlertDescription className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <span>{profile.disclaimer}</span>
                  </AlertDescription>
                </Alert>
              )}

              {ctaUrl && (
                <Button className="h-11 gap-2" asChild>
                  <a href={ctaUrl} target="_blank" rel="noreferrer">
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {offers.length > 0 && (
        <Card className="border-none shadow-lg bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              Ofertas recomendadas
            </CardTitle>
            <CardDescription>Use presets para acelerar a simulação.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {offers.map((offer) => (
              <button
                key={offer.id}
                onClick={() => applyOffer(offer)}
                className="text-left rounded-lg border bg-card/60 p-4 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{offer.name}</span>
                    <span className="text-xs text-muted-foreground">{offer.notes}</span>
                  </div>
                  {offer.offer_type && <Badge variant="outline">{offer.offer_type}</Badge>}
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  {offer.term_months && <div>Prazo: {offer.term_months} meses</div>}
                  {offer.interest_rate_monthly && <div>Taxa: {offer.interest_rate_monthly}% a.m.</div>}
                  {offer.min_down_payment_percent && <div>Entrada mínima: {offer.min_down_payment_percent}%</div>}
                  {offer.grace_months && <div>Carência: {offer.grace_months} meses</div>}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-primary text-sm font-semibold">
                  Aplicar oferta <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {partners.length > 0 && profile?.show_bank_logos !== false && (
        <Card className="border-none shadow-lg bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Bancos e parceiros
            </CardTitle>
            <CardDescription>Instituições que oferecem condições preferenciais.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {partners.map((partner: CompanyFinancingPartner) => (
              <div
                key={partner.id}
                className="rounded-lg border bg-card/60 p-4 flex items-center gap-3 hover:border-primary/40 transition"
              >
                <div className="h-12 w-12 rounded-md border bg-white flex items-center justify-center overflow-hidden">
                  {partner.logo_url ? (
                    <Image
                      src={partner.logo_url}
                      alt={partner.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{partner.name}</span>
                    {partner.badge && <Badge variant="secondary">{partner.badge}</Badge>}
                  </div>
                  {partner.partner_type && <p className="text-xs text-muted-foreground">{partner.partner_type}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 shadow-sm bg-card/60',
        highlight && 'border-primary/40 shadow-primary/10 bg-primary/5',
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}
