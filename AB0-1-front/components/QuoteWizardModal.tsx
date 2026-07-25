'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { leadsWizardApi } from '@/lib/api-client';
import { trackWizardStart, trackWizardContactSubmitted, trackLeadSuccess } from '@/lib/analytics/consolidated';
import {
  useBillValueIntent,
  useQuoteWizardTracking,
} from '@/lib/analytics/hooks/useIntentTracking';
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, ArrowLeft, Star } from 'lucide-react';
import { toast } from 'sonner';

type WizardCompany = {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
  rating_avg?: number | null;
  reviews_count?: number | null;
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
  nickname: string;
};

const TOTAL_STEPS = 8;
const INITIAL_FORM: WizardFormState = {
  productVertical: '', projectProfile: '', quoteType: '', systemSizeChoice: '',
  billValue: '', monthlyKwh: '', decisionTimeline: '', addressFull: '',
  fullName: '', email: '', phone: '', consent: false, nickname: ''
};

type QuoteWizardOpenDetail = {
  preferredCompanyId?: number;
  source?: string;
  categoryId?: number;
};

const STEP_KICKERS: Record<number, string> = {
  1: '01 - Categoria',
  2: '02 - Perfil',
  3: '03 - Orcamento',
  4: '04 - Sistema',
  5: '05 - Prazo',
  6: '06 - Endereco',
  7: '07 - Contato',
  8: '08 - Validacao',
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
  const [verificationHint, setVerificationHint] = useState('');
  const formatRating = (rating: unknown) => {
    const parsed = Number(rating ?? 0);
    return Number.isFinite(parsed) ? parsed.toFixed(1) : '0.0';
  };

  // Intent tracking hooks
  const companyIdForTracking = preferredCompanyId ?? 0;
  const { trackStep, trackAbandonment, trackSubmission, resetTracking } =
    useQuoteWizardTracking(companyIdForTracking);
  const { trackBillValue } = useBillValueIntent(companyIdForTracking);

  const progressValue = useMemo(() => Math.min(100, Math.round((step / TOTAL_STEPS) * 100)), [step]);

  const resetWizard = useCallback(() => {
    setStep(1); setForm(INITIAL_FORM); setLeadId(null); setOtpCode('');
    setError(null); setSubmitting(false); setResendCooldown(0);
    setCompanies([]); setVerificationHint('');
    resetTracking();
  }, [resetTracking]);

  const handleOpenRequest = useCallback((detail: QuoteWizardOpenDetail) => {
    setPreferredCompanyId(detail.preferredCompanyId);
    resetWizard();
    setOpen(true);
    trackWizardStart('main_quote_wizard', detail.source || 'external_trigger', detail.categoryId);
  }, [resetWizard]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = ((event as CustomEvent<QuoteWizardOpenDetail>).detail || {}) as QuoteWizardOpenDetail;
      handleOpenRequest(detail);
    };
    window.addEventListener('open-quote-wizard', handler as EventListener);
    return () => window.removeEventListener('open-quote-wizard', handler as EventListener);
  }, [handleOpenRequest]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!leadId || resendCooldown > 0) return;
    setSubmitting(true);
    try {
      await leadsWizardApi.resendEmailCode(leadId);
      setResendCooldown(60);
      toast.success('Código reenviado com sucesso!');
    } catch (err: unknown) {
      setError(getWizardErrorMessage(err, 'Erro ao reenviar código.'));
      toast.error('Não foi possível reenviar o código.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (patch: Partial<WizardFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const computeSystemSizeBand = () => {
    if (form.systemSizeChoice !== 'unknown') return form.systemSizeChoice;
    const bill = parseNumber(form.billValue);
    const kwh = parseNumber(form.monthlyKwh);
    return ((kwh && kwh >= 1200) || (bill && bill >= 1000)) ? '8 kWp ou mais' : 'Ate 7 kWp';
  };

  const handleNext = async () => {
    setError(null);
    if (step === 1 && !form.productVertical) return setError('Selecione uma opção.');
    if (step === 2 && !form.projectProfile) return setError('Selecione o perfil.');
    if (step === 3 && !form.quoteType) return setError('Selecione o tipo.');
    if (step === 4) {
      if (!form.systemSizeChoice) return setError('Selecione o tamanho.');
      if (form.systemSizeChoice === 'unknown' && !form.billValue) return setError('Informe a conta de luz.');
    }
    if (step === 5 && !form.decisionTimeline) return setError('Selecione o prazo.');
    if (step === 6 && !form.addressFull.trim()) return setError('Informe o endereço.');
    if (step === 7) {
      if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) return setError('Preencha os dados.');
      if (!isValidEmail(form.email)) return setError('E-mail inválido.');
      if (!form.consent) return setError('O consentimento é obrigatório.');

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
            address_full: form.addressFull.trim(),
            full_name: form.fullName,
            email: form.email,
            phone: form.phone,
            consent: form.consent,
            nickname: form.nickname
          },
          preferred_company_id: preferredCompanyId
        };
        const response = await leadsWizardApi.create(payload);
        setLeadId(response.lead_id);
        setVerificationHint(response.email_hint || form.email);
        setResendCooldown(60);
        trackWizardContactSubmitted(String(response.lead_id), preferredCompanyId || '');
        trackStep(8, TOTAL_STEPS, { action: 'lead_created', product_vertical: form.productVertical });
        setStep(8);
      } catch (err: unknown) {
        setError(getWizardErrorMessage(err, 'Erro ao iniciar orçamento.'));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Rastreia progressão de etapa
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    trackStep(nextStep, TOTAL_STEPS, {
      product_vertical: form.productVertical || undefined,
      decision_timeline: form.decisionTimeline || undefined,
    });
    setStep(nextStep);
  };

  const handleBack = () => { setError(null); setStep((prev) => Math.max(prev - 1, 1)); };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!leadId || otpCode.length < 6) return setError('Código inválido.');
    setSubmitting(true);
    try {
      const response = await leadsWizardApi.verifyEmailCode(leadId, otpCode);
      if (response && response.companies) {
        setCompanies(response.companies);
        trackSubmission(true, leadId);
        trackLeadSuccess({
          lead_id: String(leadId),
          company_id: preferredCompanyId,
          category: form.productVertical,
          city: form.addressFull,
        });
        setStep(9);
      }
    } catch (err: unknown) {
      trackSubmission(false, leadId);
      setError(getWizardErrorMessage(err, 'Erro na validação.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && step < 9 && step > 1) {
          // Wizard fechado antes de completar — abandono
          trackAbandonment(step, TOTAL_STEPS);
        }
        setOpen(v);
        if (!v) resetWizard();
      }}
    >
      <DialogContent
        overlayClassName="bg-black/65 backdrop-blur-md"
        className={cn(
          'z-[10000] flex max-h-[90dvh] max-w-xl flex-col overflow-hidden border-none p-0 rounded-2xl md:rounded-2xl bg-white shadow-2xl',
          'max-md:left-1/2 max-md:top-1/2 max-md:translate-x-[-50%] max-md:translate-y-[-50%] max-md:w-[min(calc(100vw-32px),420px)]',
          'max-md:max-h-[min(72dvh,720px)]',
          'max-md:grid max-md:grid-rows-[auto_minmax(0,1fr)_auto]',
          'max-md:gap-0 max-md:border max-md:border-slate-200 max-md:bg-white',
          'max-md:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45),0_12px_30px_-6px_rgba(0,0,0,0.15)]',
          '[&>button]:max-md:right-3 [&>button]:max-md:top-3 [&>button]:max-md:rounded-full [&>button]:max-md:border [&>button]:max-md:border-slate-200 [&>button]:max-md:bg-white [&>button]:max-md:opacity-100 [&>button]:max-md:shadow-md [&>button]:max-md:p-2'
        )}
      >
        {/* Progress Header */}
        <div className="bg-[#0B1B36] px-4 py-3 md:px-6 md:py-4 text-white rounded-t-2xl pt-[calc(0.5rem+var(--sat))] safe-x">
          <div className="mb-2 md:mb-3 flex items-center justify-between gap-3">
             <DialogTitle className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.18em] text-white/72">
               {step < 9 ? `Etapa ${step} de ${TOTAL_STEPS}` : 'Concluído'}
             </DialogTitle>
             <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] text-[#22C55E]">
                <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />
                100% SEGURO
             </div>
          </div>
          <Progress value={progressValue} className="h-1.5 rounded-full bg-[#19315E]" />
        </div>

        <div className="flex-grow overflow-y-auto px-4 py-4 md:px-10 md:py-8 overscroll-contain safe-x">
          {step === 1 && (
            <div className="space-y-5 md:space-y-6">
              <WizardHeading kicker={STEP_KICKERS[1]} title="O que você deseja comparar?" subtitle="Selecione a solução ideal para você." />
              <div className="grid grid-cols-1 gap-2 md:gap-3">
                {['Energia Solar e/ou Baterias', 'Bombas de Calor', 'Carregadores Veiculares (EV)'].map(v => (
                  <OptionButton key={v} selected={form.productVertical === v} onClick={() => { updateForm({ productVertical: v }); handleNext(); }}>
                    {v}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 md:space-y-6">
              <WizardHeading kicker={STEP_KICKERS[2]} title="Qual o tipo de projeto?" subtitle="Selecione o perfil da instalação." />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
                {['Residencial', 'Condominio', 'Comercial'].map(v => (
                  <OptionButton key={v} selected={form.projectProfile === v} onClick={() => { updateForm({ projectProfile: v }); handleNext(); }}>
                    {v}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 md:space-y-6">
              <WizardHeading kicker={STEP_KICKERS[3]} title="Tipo de Orçamento" subtitle="Escolha o que deseja cotar." />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
                {['Energia Solar', 'Solar + Bateria', 'Apenas Bateria'].map(v => (
                  <OptionButton key={v} selected={form.quoteType === v} onClick={() => { updateForm({ quoteType: v }); handleNext(); }}>
                    {v}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 md:space-y-6">
              <WizardHeading kicker={STEP_KICKERS[4]} title="Tamanho do Sistema" subtitle="Você já sabe a potência necessária?" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
                {['Ate 7 kWp', '8 kWp ou mais', 'unknown'].map(v => (
                  <OptionButton key={v} selected={form.systemSizeChoice === v} onClick={() => updateForm({ systemSizeChoice: v })}>
                    {v === 'unknown' ? 'Não sei' : v}
                  </OptionButton>
                ))}
              </div>
              {form.systemSizeChoice === 'unknown' && (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Média da conta de luz (R$)</Label>
                    <Input
                      value={form.billValue}
                      onChange={(e) => {
                        updateForm({ billValue: e.target.value });
                        trackBillValue(e.target.value);
                      }}
                      placeholder="Ex: 420"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5 md:space-y-6">
              <WizardHeading kicker={STEP_KICKERS[5]} title="Quando pretende decidir?" subtitle="Ajude as empresas a priorizarem seu contato." />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
                {['Agora', 'Em ate 6 meses', 'Mais de 6 meses'].map(v => (
                  <OptionButton key={v} selected={form.decisionTimeline === v} onClick={() => { updateForm({ decisionTimeline: v }); handleNext(); }}>
                    {v}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5 md:space-y-6">
              <WizardHeading kicker={STEP_KICKERS[6]} title="Onde será a instalação?" subtitle="Informe o endereço completo." />
              <div className="space-y-1.5">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Endereço Completo</Label>
                <Input value={form.addressFull} onChange={(e) => updateForm({ addressFull: e.target.value })} placeholder="Rua, número - Cidade/UF" className="h-12 rounded-xl" />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5 md:space-y-6">
              <WizardHeading kicker={STEP_KICKERS[7]} title="Seus Dados de Contato" subtitle="Quase lá! Como as empresas podem falar com você?" />
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nome Completo</Label>
                  <Input value={form.fullName} onChange={(e) => updateForm({ fullName: e.target.value })} placeholder="Seu nome" className="h-11 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} placeholder="voce@email.com" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Telefone</Label>
                    <Input value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} placeholder="(00) 00000-0000" className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Checkbox checked={form.consent} onCheckedChange={(v) => updateForm({ consent: Boolean(v) })} className="mt-1" />
                  <Label className="text-xs text-slate-500 font-bold leading-relaxed cursor-pointer uppercase tracking-tight">
                    Aceito receber orçamentos de até 3 empresas verificadas.
                  </Label>
                </div>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-8 py-4 text-center">
              <WizardHeading kicker={STEP_KICKERS[8]} title="Validação de Segurança" subtitle={`Digitie o código enviado para ${verificationHint || form.email}`} center />
              <div className="flex flex-col items-center gap-6">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-10 md:w-12 rounded-xl border-slate-200 text-lg font-bold" />)}
                  </InputOTPGroup>
                </InputOTP>
                <button onClick={handleResend} disabled={resendCooldown > 0 || submitting} className="text-xs font-bold text-slate-400 hover:text-blue-600">
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">Sucesso! Orçamento Iniciado.</h2>
                <p className="text-sm text-slate-500 font-medium">Estas empresas entrarão em contato com você:</p>
              </div>
              <div className="space-y-3">
                {companies.map(c => (
                  <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                      {c.logo_url ? <Image src={c.logo_url} alt={c.name} width={48} height={48} className="object-cover" /> : <Zap className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 truncate uppercase tracking-tight">{c.name}</p>
                      <p className="text-xs text-slate-500 font-bold">{(c.city || '-') + (c.state ? `, ${c.state}` : '')}</p>
                    </div>
                    <div className="text-right">
                       <div className="flex items-center gap-1 text-slate-900 font-black">
                         <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                         {formatRating(c.rating_avg)}
                       </div>
                       <p className="text-[10px] text-slate-400 font-black">{c.reviews_count || 0} AVALIAÇÕES</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 md:px-10 md:pt-5 md:pb-5 rounded-b-2xl safe-x pb-[calc(0.75rem+var(--sab))]">
          {step <= TOTAL_STEPS ? (
            <>
              <Button variant="ghost" className="h-12 min-h-[48px] rounded-xl px-3 text-xs font-black tracking-[0.16em] text-[#0B1B36] hover:bg-slate-50 hover:text-[#1268E8] disabled:text-slate-300" onClick={handleBack} disabled={step === 1 || submitting}>
                <ArrowLeft className="w-4 h-4 mr-2" /> VOLTAR
              </Button>
              {step < 8 ? (
                <Button onClick={handleNext} disabled={submitting} className="h-12 min-h-[48px] rounded-xl border border-[#1268E8] bg-[#1268E8] px-5 text-xs font-black tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] hover:bg-[#0F56C6] active:scale-[0.98]">
                  AVANÇAR <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleVerifyOtp} disabled={submitting} className="h-12 min-h-[48px] rounded-xl border border-[#1268E8] bg-[#1268E8] px-5 text-xs font-black tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] hover:bg-[#0F56C6] active:scale-[0.98]">
                  VALIDAR AGORA
                </Button>
              )}
            </>
          ) : (
            <Button onClick={() => setOpen(false)} className="h-12 min-h-[48px] w-full rounded-xl bg-[#0B1B36] text-xs font-black tracking-[0.16em] shadow-lg active:scale-[0.98]">CONCLUÍDO</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const WizardHeading = ({
  title,
  subtitle,
  center,
  kicker,
}: {
  title: string;
  subtitle: string;
  center?: boolean;
  kicker?: string;
}) => (
  <div className={cn("space-y-1", center && "text-center")}>
    {kicker ? (
      <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.18em] text-[#1268E8]">{kicker}</p>
    ) : null}
    <h2 className="text-[18px] md:text-[24px] font-[800] leading-[1.15] tracking-[-0.02em] text-[#0B1B36] uppercase">{title}</h2>
    <p className="max-w-[32ch] text-[13px] md:text-[14px] leading-[1.4] text-slate-500 font-medium">{subtitle}</p>
  </div>
);

type OptionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  children: ReactNode;
};

const OptionButton = ({ selected, children, className, ...props }: OptionButtonProps) => (
  <button type="button" className={cn(
    'w-full border px-3 md:px-4 min-h-[48px] py-2 md:py-3 text-left text-[12px] md:text-[14px] font-[700] uppercase tracking-tight transition-all active:scale-[0.98]',
    'rounded-xl border-slate-200 bg-white text-[#0B1B36] shadow-sm',
    selected 
      ? 'border-[#1268E8] bg-blue-50/70 text-[#0B1B36] ring-2 ring-blue-500/10 shadow-md' 
      : 'hover:border-blue-300 hover:bg-slate-50 hover:shadow',
    className
  )} aria-pressed={selected} {...props}>
    <div className="flex items-center justify-between">
      {children}
      {selected && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
    </div>
  </button>
);

const parseNumber = (v: string) => {
  if (!v) return 0;
  const n = Number(v.replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const FIELD_LABELS: Record<string, string> = {
  company_id: 'Empresa selecionada',
  product_vertical: 'Vertical do projeto',
  project_profile: 'Perfil do projeto',
  quote_type: 'Tipo de orçamento',
  system_size_band: 'Tamanho do sistema',
  decision_timeline: 'Prazo de decisão',
  address_full: 'Endereço completo',
  name: 'Nome completo',
  email: 'E-mail',
  phone: 'Telefone',
  consent_at: 'Consentimento'
};

const normalizeFieldMessage = (message: string) => {
  if (message === 'is required') return 'é obrigatório.';
  return message;
};

type WizardApiError = {
  message?: string;
  details?: {
    fields?: Record<string, unknown>;
  };
};

const getWizardErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as WizardApiError;
  const fields = apiError.details?.fields;
  if (fields && typeof fields === 'object') {
    const [field, messages] = Object.entries(fields)[0] || [];
    if (field) {
      const label = FIELD_LABELS[field] || field;
      const firstMessage = Array.isArray(messages) ? messages[0] : messages;
      if (typeof firstMessage === 'string' && firstMessage.trim().length > 0) {
        return `${label}: ${normalizeFieldMessage(firstMessage)}`;
      }
    }
  }

  if (typeof apiError.message === 'string' && !apiError.message.includes('validation_failed')) {
    return apiError.message;
  }

  return fallback;
};
