'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { leadsWizardApi } from '@/lib/api-client';

type WizardCompany = {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
  rating_avg?: number | null;
  reviews_count?: number | null;
  rating_count?: number | null;
  verified?: boolean | null;
  featured?: boolean | null;
  logo_url?: string | null;
};

type WizardFormState = {
  productVertical: string;
  projectProfile: string;
  quoteType: string;
  systemSizeChoice: string;
  billValue: string;
  monthlyKwh: string;
  decisionTimeline: string;
  addressFull: string;
  fullName: string;
  email: string;
  phone: string;
  consent: boolean;
};

const TOTAL_STEPS = 8;
const INITIAL_FORM: WizardFormState = {
  productVertical: '',
  projectProfile: '',
  quoteType: '',
  systemSizeChoice: '',
  billValue: '',
  monthlyKwh: '',
  decisionTimeline: '',
  addressFull: '',
  fullName: '',
  email: '',
  phone: '',
  consent: false
};

export default function QuoteWizardModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormState>(INITIAL_FORM);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [preferredCompanyId, setPreferredCompanyId] = useState<number | undefined>(undefined);
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [companies, setCompanies] = useState<WizardCompany[]>([]);

  const progressValue = useMemo(
    () => Math.min(100, Math.round((step / TOTAL_STEPS) * 100)),
    [step]
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      setPreferredCompanyId(detail.preferredCompanyId);
      resetWizard();
      setOpen(true);
    };
    window.addEventListener('open-quote-wizard', handler as EventListener);
    return () => window.removeEventListener('open-quote-wizard', handler as EventListener);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetWizard = () => {
    setStep(1);
    setForm(INITIAL_FORM);
    setLeadId(null);
    setOtpCode('');
    setError(null);
    setSubmitting(false);
    setResendCooldown(0);
    setCompanies([]);
  };

  const updateForm = (patch: Partial<WizardFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const computeSystemSizeBand = () => {
    if (form.systemSizeChoice !== 'unknown') {
      return form.systemSizeChoice;
    }
    const bill = parseNumber(form.billValue);
    const kwh = parseNumber(form.monthlyKwh);
    if ((kwh && kwh >= 1200) || (bill && bill >= 1000)) {
      return '8 kWp ou mais';
    }
    return 'Ate 7 kWp';
  };

  const handleNext = async () => {
    setError(null);

    if (step === 1 && !form.productVertical) {
      setError('Selecione uma opcao para continuar.');
      return;
    }
    if (step === 2 && !form.projectProfile) {
      setError('Selecione o tipo de projeto.');
      return;
    }
    if (step === 3 && !form.quoteType) {
      setError('Selecione o tipo de orcamento.');
      return;
    }
    if (step === 4) {
      if (!form.systemSizeChoice) {
        setError('Selecione o tamanho do sistema.');
        return;
      }
      if (form.systemSizeChoice === 'unknown' && !form.billValue) {
        setError('Informe a media da conta de luz.');
        return;
      }
    }
    if (step === 5 && !form.decisionTimeline) {
      setError('Selecione quando pretende decidir.');
      return;
    }
    if (step === 6 && !form.addressFull.trim()) {
      setError('Informe o endereco da instalacao.');
      return;
    }
    if (step === 7) {
      if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
        setError('Preencha nome, email e telefone.');
        return;
      }
      if (!form.consent) {
        setError('O consentimento e obrigatorio.');
        return;
      }

      setSubmitting(true);
      try {
        const payload = {
          lead: {
            product_vertical: form.productVertical,
            project_profile: form.projectProfile,
            quote_type: form.quoteType,
            system_size_band: computeSystemSizeBand(),
            bill_value: form.billValue || null,
            monthly_kwh: form.monthlyKwh || null,
            decision_timeline: form.decisionTimeline,
            address_full: form.addressFull,
            full_name: form.fullName,
            email: form.email,
            phone: form.phone,
            consent: form.consent
          },
          preferred_company_id: preferredCompanyId
        };

        const response = await leadsWizardApi.create(payload);
        setLeadId(response.lead_id);
        setResendCooldown(60);
        setStep(8);
      } catch (err: any) {
        setError(err?.message || 'Nao foi possivel iniciar o orcamento.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!leadId) {
      setError('Lead nao encontrado.');
      return;
    }
    if (otpCode.length < 6) {
      setError('Informe o codigo completo.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await leadsWizardApi.verifyOtp(leadId, otpCode);
      setCompanies(response.companies || []);
      setStep(9);
    } catch (err: any) {
      setError(err?.message || 'Codigo invalido.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    if (!leadId) return;
    if (resendCooldown > 0) return;

    setSubmitting(true);
    try {
      await leadsWizardApi.resendOtp(leadId);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err?.message || 'Nao foi possivel reenviar o codigo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetWizard();
        }
      }}
    >
      <DialogContent className="max-w-xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto z-[10000]">
        <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
          <p className="text-sm font-semibold">Ja ajudamos muitos clientes na sua regiao</p>
        </div>

        <div className="px-6 pt-4">
          <Progress value={progressValue} className="h-1.5 bg-green-100" />
        </div>

        <div className="px-6 py-4 space-y-4">
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">O que voce deseja comparar?</h2>
                <p className="text-sm text-muted-foreground">Escolha uma opcao.</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <OptionButton
                  selected={form.productVertical === 'Energia Solar e/ou Baterias'}
                  onClick={() => updateForm({ productVertical: 'Energia Solar e/ou Baterias' })}
                >
                  Energia Solar e/ou Baterias
                </OptionButton>
                <OptionButton
                  selected={form.productVertical === 'Bombas de Calor'}
                  onClick={() => updateForm({ productVertical: 'Bombas de Calor' })}
                >
                  Bombas de Calor
                </OptionButton>
                <OptionButton
                  selected={form.productVertical === 'Carregadores Veiculares (EV)'}
                  onClick={() => updateForm({ productVertical: 'Carregadores Veiculares (EV)' })}
                >
                  Carregadores Veiculares (EV)
                </OptionButton>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Tipo de projeto</h2>
                <p className="text-sm text-muted-foreground">Selecione o perfil.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Residencial', 'Condominio', 'Comercial'].map((value) => (
                  <OptionButton
                    key={value}
                    selected={form.projectProfile === value}
                    onClick={() => updateForm({ projectProfile: value })}
                  >
                    {value}
                  </OptionButton>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Tipo de orcamento</h2>
                <p className="text-sm text-muted-foreground">Escolha uma opcao.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Energia Solar', 'Solar + Bateria', 'Apenas Bateria'].map((value) => (
                  <OptionButton
                    key={value}
                    selected={form.quoteType === value}
                    onClick={() => updateForm({ quoteType: value })}
                  >
                    {value}
                  </OptionButton>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Tamanho do sistema</h2>
                <p className="text-sm text-muted-foreground">Voce sabe o tamanho ideal?</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <OptionButton
                  selected={form.systemSizeChoice === 'Ate 7 kWp'}
                  onClick={() => updateForm({ systemSizeChoice: 'Ate 7 kWp' })}
                >
                  Ate 7 kWp
                </OptionButton>
                <OptionButton
                  selected={form.systemSizeChoice === '8 kWp ou mais'}
                  onClick={() => updateForm({ systemSizeChoice: '8 kWp ou mais' })}
                >
                  8 kWp ou mais
                </OptionButton>
                <OptionButton
                  selected={form.systemSizeChoice === 'unknown'}
                  onClick={() => updateForm({ systemSizeChoice: 'unknown' })}
                >
                  Nao sei
                </OptionButton>
              </div>

              {form.systemSizeChoice === 'unknown' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <Label htmlFor="billValue">Media da conta de luz (R$)</Label>
                    <Input
                      id="billValue"
                      value={form.billValue}
                      onChange={(e) => updateForm({ billValue: e.target.value })}
                      placeholder="Ex: 420"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyKwh">Consumo medio (kWh/mes) - opcional</Label>
                    <Input
                      id="monthlyKwh"
                      value={form.monthlyKwh}
                      onChange={(e) => updateForm({ monthlyKwh: e.target.value })}
                      placeholder="Ex: 850"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Quando pretende decidir?</h2>
                <p className="text-sm text-muted-foreground">Selecione o prazo.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Agora', 'Em ate 6 meses', 'Mais de 6 meses'].map((value) => (
                  <OptionButton
                    key={value}
                    selected={form.decisionTimeline === value}
                    onClick={() => updateForm({ decisionTimeline: value })}
                  >
                    {value}
                  </OptionButton>
                ))}
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Endereco da instalacao</h2>
                <p className="text-sm text-muted-foreground">Informe o endereco completo.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressFull">Endereco</Label>
                <Input
                  id="addressFull"
                  value={form.addressFull}
                  onChange={(e) => updateForm({ addressFull: e.target.value })}
                  placeholder="Rua, numero - Cidade/UF"
                />
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Dados do responsavel</h2>
                <p className="text-sm text-muted-foreground">Precisamos de alguns dados para contato.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => updateForm({ fullName: e.target.value })}
                    placeholder="Digite seu nome"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    placeholder="voce@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    placeholder="DDD + numero"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="consent"
                    checked={form.consent}
                    onCheckedChange={(value) => updateForm({ consent: Boolean(value) })}
                  />
                  <Label htmlFor="consent" className="text-sm text-muted-foreground leading-snug">
                    Sim, aceito receber contato de ate 3 empresas para orcamento.
                  </Label>
                </div>
              </div>
            </>
          )}

          {step === 8 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Verificacao por SMS</h2>
                <p className="text-sm text-muted-foreground">Digite o codigo enviado para seu telefone.</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || submitting}
                >
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar codigo'}
                </Button>
              </div>
            </>
          )}

          {step === 9 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Pronto! Seu orcamento esta em andamento.</h2>
                <p className="text-sm text-muted-foreground">Estas sao as empresas selecionadas.</p>
              </div>
              <div className="space-y-3">
                {companies.length === 0 && (
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Nenhuma empresa encontrada no momento.
                  </div>
                )}
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {company.logo_url ? (
                        <Image
                          src={company.logo_url}
                          alt={company.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">Logo</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{company.name}</p>
                        {company.verified && (
                          <span className="text-xs text-green-600 border border-green-200 rounded-full px-2 py-0.5">
                            Verificada
                          </span>
                        )}
                        {company.featured && (
                          <span className="text-xs text-blue-600 border border-blue-200 rounded-full px-2 py-0.5">
                            Destaque
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(company.city || '-') + (company.state ? ` - ${company.state}` : '')}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">{company.rating_avg?.toFixed?.(1) || '0.0'}</p>
                      <p>{company.reviews_count || 0} avaliacoes</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {step <= TOTAL_STEPS && (
          <div className="px-6 pb-6 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 || submitting}>
              Voltar
            </Button>
            {step < 8 && (
              <Button type="button" onClick={handleNext} disabled={submitting}>
                Avancar
              </Button>
            )}
            {step === 8 && (
              <Button type="button" onClick={handleVerifyOtp} disabled={submitting}>
                Validar codigo
              </Button>
            )}
          </div>
        )}

        {step === 9 && (
          <div className="px-6 pb-6 flex items-center justify-end">
            <Button type="button" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const OptionButton = ({
  selected,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) => (
  <button
    type="button"
    className={cn(
      'w-full rounded-md border px-3 py-2 text-sm font-medium transition-colors',
      selected ? 'border-green-500 bg-green-50 text-green-700' : 'border-border bg-background text-foreground hover:bg-muted',
      className
    )}
    aria-pressed={selected}
    {...props}
  />
);

const parseNumber = (value: string) => {
  if (!value) return 0;
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};
