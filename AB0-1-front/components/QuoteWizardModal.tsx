'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { track } from '@/lib/analytics/lazy';
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, ArrowLeft } from 'lucide-react';

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

  const progressValue = useMemo(() => Math.min(100, Math.round((step / TOTAL_STEPS) * 100)), [step]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      setPreferredCompanyId(detail.preferredCompanyId);
      resetWizard();
      setOpen(true);
      track('Wizard Opened', { source: 'external_trigger' });
    };
    window.addEventListener('open-quote-wizard', handler as EventListener);
    return () => window.removeEventListener('open-quote-wizard', handler as EventListener);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetWizard = () => {
    setStep(1); setForm(INITIAL_FORM); setLeadId(null); setOtpCode('');
    setError(null); setSubmitting(false); setResendCooldown(0);
    setCompanies([]); setVerificationHint('');
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
            ...form,
            system_size_band: computeSystemSizeBand(),
            bill_value: form.billValue || null,
            monthly_kwh: form.monthlyKwh || null,
            full_name: form.fullName, // Adjust keys for API if needed
          },
          preferred_company_id: preferredCompanyId
        };
        const response = await leadsWizardApi.create(payload as any);
        setLeadId(response.lead_id);
        setVerificationHint(response.email_hint || form.email);
        setResendCooldown(60);
        setStep(8);
      } catch (err: any) {
        setError(err?.message || 'Erro ao iniciar orçãmento.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
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
        setStep(9);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro na validação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetWizard(); }}>
      <DialogContent className="max-w-xl p-0 overflow-hidden max-h-[90vh] flex flex-col z-[10000] rounded-2xl border-none">
        {/* Progress Header */}
        <div className="bg-slate-900 text-white px-6 py-4">
          <div className="flex items-center justify-between mb-3">
             <DialogTitle className="text-xs font-black uppercase tracking-widest text-slate-400">
               {step < 9 ? `Etapa ${step} de ${TOTAL_STEPS}` : 'Concluído'}
             </DialogTitle>
             <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% SEGURO
             </div>
          </div>
          <Progress value={progressValue} className="h-1.5 bg-slate-800" />
        </div>

        <div className="px-6 py-8 md:px-10 space-y-6 flex-grow overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6">
              <WizardHeading title="O que você deseja comparar?" subtitle="Selecione a solução ideal para você." />
              <div className="grid grid-cols-1 gap-3">
                {['Energia Solar e/ou Baterias', 'Bombas de Calor', 'Carregadores Veiculares (EV)'].map(v => (
                  <OptionButton key={v} selected={form.productVertical === v} onClick={() => { updateForm({ productVertical: v }); handleNext(); }}>
                    {v}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <WizardHeading title="Qual o tipo de projeto?" subtitle="Selecione o perfil da instalação." />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Residencial', 'Condominio', 'Comercial'].map(v => (
                  <OptionButton key={v} selected={form.projectProfile === v} onClick={() => { updateForm({ projectProfile: v }); handleNext(); }}>
                    {v}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <WizardHeading title="Tipo de Orçamento" subtitle="Escolha o que deseja cotar." />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Energia Solar', 'Solar + Bateria', 'Apenas Bateria'].map(v => (
                  <OptionButton key={v} selected={form.quoteType === v} onClick={() => { updateForm({ quoteType: v }); handleNext(); }}>
                    {v}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <WizardHeading title="Tamanho do Sistema" subtitle="Você já sabe a potência necessária?" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <Input value={form.billValue} onChange={(e) => updateForm({ billValue: e.target.value })} placeholder="Ex: 420" className="h-11 rounded-xl" />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <WizardHeading title="Quando pretende decidir?" subtitle="Ajude as empresas a priorizarem seu contato." />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Agora', 'Em ate 6 meses', 'Mais de 6 meses'].map(v => (
                  <OptionButton key={v} selected={form.decisionTimeline === v} onClick={() => { updateForm({ decisionTimeline: v }); handleNext(); }}>
                    {v}
                  </OptionButton>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <WizardHeading title="Onde será a instalação?" subtitle="Informe o endereço completo." />
              <div className="space-y-1.5">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Endereço Completo</Label>
                <Input value={form.addressFull} onChange={(e) => updateForm({ addressFull: e.target.value })} placeholder="Rua, número - Cidade/UF" className="h-12 rounded-xl" />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <WizardHeading title="Seus Dados de Contato" subtitle="Quase lá! Como as empresas podem falar com você?" />
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
              <WizardHeading title="Validação de Segurança" subtitle={`Digitie o código enviado para ${verificationHint || form.email}`} center />
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
                         {c.rating_avg?.toFixed(1) || '0.0'}
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
        <div className="px-6 pb-6 md:px-10 flex items-center justify-between border-t pt-6 bg-slate-50/50">
          {step <= TOTAL_STEPS ? (
            <>
              <Button variant="ghost" className="font-bold text-slate-400 hover:text-slate-900" onClick={handleBack} disabled={step === 1 || submitting}>
                <ArrowLeft className="w-4 h-4 mr-2" /> VOLTAR
              </Button>
              {step < 8 ? (
                <Button onClick={handleNext} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 font-black px-8 h-12 rounded-xl shadow-lg shadow-blue-100">
                  AVANÇAR <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleVerifyOtp} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 font-black px-8 h-12 rounded-xl shadow-lg">
                  VALIDAR AGORA
                </Button>
              )}
            </>
          ) : (
            <Button onClick={() => setOpen(false)} className="w-full h-12 bg-slate-900 font-black rounded-xl">CONCLUÍDO</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const WizardHeading = ({ title, subtitle, center }: { title: string; subtitle: string; center?: boolean }) => (
  <div className={cn("space-y-1", center && "text-center")}>
    <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-tight uppercase">{title}</h2>
    <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
  </div>
);

const OptionButton = ({ selected, children, ...props }: any) => (
  <button type="button" className={cn(
    'w-full rounded-2xl border-2 px-4 py-4 text-sm font-black transition-all text-left uppercase tracking-tight',
    selected ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md scale-[1.02]' : 'border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50'
  )} aria-pressed={selected} {...props}>
    <div className="flex items-center justify-between">
      {children}
      {selected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
    </div>
  </button>
);

const parseNumber = (v: string) => {
  if (!v) return 0;
  const n = Number(v.replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
