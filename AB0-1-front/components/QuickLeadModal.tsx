'use client';

import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { leadsWizardApi } from '@/lib/api-client';
import { track } from '@/lib/analytics/lazy';
import { Zap, ShieldCheck, Clock, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

type QuickLeadOpenDetail = {
  preferredCompanyId?: number;
  source?: string;
  decisionContext?: Record<string, unknown>;
};

export default function QuickLeadModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: OTP, 3: Success
  const [preferredCompanyId, setPreferredCompanyId] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationHint, setVerificationHint] = useState('');
  const [decisionContext, setDecisionContext] = useState<Record<string, unknown>>({});
  const [matchedCompanies, setMatchedCompanies] = useState<Array<{ id: number; name: string }>>([]);
  const [matchingStatus, setMatchingStatus] = useState<'idle' | 'processing' | 'matched' | 'unmatched'>('idle');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    zipcode: '',
    city: '',
    state: '',
    consent: false,
    nickname: '' // Honeypot
  });

  const resetQuickLead = useCallback(() => {
    setStep(1);
    setPreferredCompanyId(undefined);
    setSubmitting(false);
    setError(null);
    setLeadId(null);
    setOtpCode('');
    setResendCooldown(0);
    setVerificationHint('');
    setDecisionContext({});
    setMatchedCompanies([]);
    setMatchingStatus('idle');
    setIdempotencyKey(crypto.randomUUID());
    setForm({
      fullName: '',
      email: '',
      phone: '',
      zipcode: '',
      city: '',
      state: '',
      consent: false,
      nickname: '',
    });
  }, []);

  const handleOpenRequest = useCallback((detail: QuickLeadOpenDetail) => {
    resetQuickLead();
    setPreferredCompanyId(detail.preferredCompanyId);
    setDecisionContext(detail.decisionContext || {});
    setOpen(true);
    track('Quick Lead Opened', { source: detail.source });
  }, [resetQuickLead]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = ((event as CustomEvent<QuickLeadOpenDetail>).detail || {}) as QuickLeadOpenDetail;
      handleOpenRequest(detail);
    };
    window.addEventListener('open-quick-lead', handler as EventListener);
    return () => window.removeEventListener('open-quick-lead', handler as EventListener);
  }, [handleOpenRequest]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName || !form.email || !form.phone) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('Informe um e-mail válido.');
      return;
    }

    if (!form.consent) {
      setError('Você precisa aceitar os termos.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        lead: {
          full_name: form.fullName,
          email: form.email,
          phone: form.phone,
          zipcode: form.zipcode,
          city: form.city,
          state: form.state,
          consent: form.consent,
          nickname: form.nickname,
          product_vertical: 'Energia Solar',
          project_profile: 'Residencial',
          quote_type: 'Energia Solar',
          system_size_band: 'Ate 7 kWp',
          decision_timeline: 'Agora',
          address_full: form.zipcode ? `CEP: ${form.zipcode}` : 'Não informado'
        },
        preferred_company_id: preferredCompanyId,
        decision_context: decisionContext,
        source: decisionContext.source || 'organic',
      };

      const response = await leadsWizardApi.create(payload, idempotencyKey);
      setLeadId(response.lead_id);
      setVerificationHint(response.email_hint || form.email);
      setResendCooldown(60);
      setStep(2);
      track('Quick Lead Created', { lead_id: response.lead_id });
    } catch (err: unknown) {
      setError(getWizardErrorMessage(err, 'Erro ao enviar solicitação.'));
    } finally {
      setSubmitting(false);
    }
  };

  const startPolling = useCallback((id: number) => {
    setMatchingStatus('processing');
    let attempts = 0;
    const maxAttempts = 10;
    const intervalTime = 2000;

    const poll = async () => {
      try {
        const result = await leadsWizardApi.result(id);
        const mStatus = result?.matching?.status || 'processing';
        const companies = Array.isArray(result?.companies) ? result.companies : [];
        setMatchedCompanies(companies);

        if (mStatus === 'matched') {
          setMatchingStatus('matched');
          return;
        } else if (mStatus === 'unmatched') {
          setMatchingStatus('unmatched');
          return;
        }

        attempts += 1;
        if (attempts >= maxAttempts) {
          setMatchingStatus('unmatched');
          return;
        }

        setTimeout(poll, intervalTime);
      } catch (err) {
        attempts += 1;
        if (attempts >= maxAttempts) {
          setMatchingStatus('unmatched');
          return;
        }
        setTimeout(poll, intervalTime);
      }
    };

    poll();
  }, []);

  const handleVerifyOtp = async () => {
    setError(null);
    if (!leadId) return;
    if (otpCode.length < 6) {
      setError('Informe o código completo.');
      return;
    }

    setSubmitting(true);
    try {
      await leadsWizardApi.verifyEmailCode(leadId, otpCode);
      setStep(3);
      track('Quick Lead Verified', { lead_id: leadId });
      startPolling(leadId);
    } catch (err: unknown) {
      setError(getWizardErrorMessage(err, 'Código inválido.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!leadId || resendCooldown > 0) return;
    setSubmitting(true);
    try {
      await leadsWizardApi.resendEmailCode(leadId);
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(getWizardErrorMessage(err, 'Erro ao reenviar.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden z-[10000] rounded-2xl border-none">
        {/* Header - Impact & Empathy */}
        <div className="bg-blue-600 px-6 py-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Zap className="h-24 w-24 fill-current" />
          </div>
          <DialogTitle className="text-2xl font-black flex items-center gap-2 tracking-tight">
            Solicitar Orçamento Grátis
          </DialogTitle>
          <DialogDescription className="text-blue-100 mt-1 font-medium leading-relaxed">
            Conectamos você às melhores empresas solares em poucos minutos. 100% gratuito e sem compromisso.
          </DialogDescription>
        </div>

        <div className="p-5 md:p-6 bg-white">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="hidden" aria-hidden="true">
                  <Input tabIndex={-1} autoComplete="off" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quick-name" className="text-xs font-black text-slate-400 uppercase tracking-widest">Nome Completo *</Label>
                  <Input id="quick-name" required placeholder="Seu nome completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-11 rounded-xl border-slate-200" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="quick-email" className="text-xs font-black text-slate-400 uppercase tracking-widest">E-mail *</Label>
                    <Input id="quick-email" type="email" required placeholder="seu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quick-phone" className="text-xs font-black text-slate-400 uppercase tracking-widest">WhatsApp *</Label>
                    <Input id="quick-phone" required placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 rounded-xl border-slate-200" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="quick-zip" className="text-xs font-black text-slate-400 uppercase tracking-widest">CEP (Localização)</Label>
                  <Input id="quick-zip" placeholder="00000-000" value={form.zipcode} onChange={(e) => setForm({ ...form, zipcode: e.target.value })} className="h-11 rounded-xl border-slate-200" />
                </div>

                <div className="flex items-start gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Checkbox id="quick-consent" checked={form.consent} onCheckedChange={(val) => setForm({ ...form, consent: Boolean(val) })} className="mt-1" />
                  <Label htmlFor="quick-consent" className="text-[11px] text-slate-500 font-bold leading-relaxed cursor-pointer uppercase tracking-tight">
                    Aceito receber orçamentos de empresas parceiras. Sua privacidade é nossa prioridade.
                  </Label>
                </div>
              </div>

              {error && <div className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{error}</div>}

              <Button type="submit" disabled={submitting} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-100 transition-all hover:scale-[1.02]">
                {submitting ? 'Enviando...' : 'SOLICITAR AGORA'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {/* Trust Signals */}
              <div className="flex items-center justify-center gap-4 pt-2">
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                   <ShieldCheck className="h-3 w-3 text-emerald-500" />
                   SEGURO
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                   <Clock className="h-3 w-3 text-blue-500" />
                   RÁPIDO
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                   <Lock className="h-3 w-3 text-slate-400" />
                   PROTEGIDO
                 </div>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-900">Verifique seu E-mail</h3>
                <p className="text-sm text-slate-500 font-medium">Enviamos um código para <strong>{verificationHint}</strong></p>
              </div>
              
              <div className="flex flex-col items-center gap-6">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-12 w-10 md:w-12 rounded-xl border-slate-200 text-lg font-bold" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                <Button onClick={handleVerifyOtp} disabled={submitting} className="w-full h-12 rounded-xl bg-blue-600 font-bold">
                  {submitting ? 'Verificando...' : 'VALIDAR CÓDIGO'}
                </Button>

                <button onClick={handleResend} disabled={resendCooldown > 0 || submitting} className="text-xs font-bold text-slate-400 hover:text-blue-600 disabled:opacity-50">
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Não recebeu? Reenviar código'}
                </button>
              </div>
              {error && <div className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 text-center">{error}</div>}
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center space-y-6">
              {matchingStatus === 'processing' ? (
                <>
                  <div className="mx-auto h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                    <Clock className="h-10 w-10 text-blue-600 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-950 tracking-tight">Buscando empresas...</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      Estamos buscando empresas compatíveis com seu projeto. Por favor, aguarde alguns instantes.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-950 tracking-tight">Solicitação Enviada!</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      {matchingStatus === 'matched' && matchedCompanies.length > 0
                        ? `Encontramos ${matchedCompanies.length} empresa${matchedCompanies.length === 1 ? '' : 's'} compatível${matchedCompanies.length === 1 ? '' : 'eis'} para seu projeto.`
                        : 'Recebemos sua solicitação e estamos buscando empresas compatíveis com seu projeto.'}
                    </p>
                  </div>
                </>
              )}
              <Button onClick={() => setOpen(false)} disabled={matchingStatus === 'processing'} className="w-full h-12 rounded-xl bg-slate-900 font-bold hover:scale-105 transition-all disabled:opacity-50">
                FECHAR E CONTINUAR
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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
  phone: 'WhatsApp',
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
