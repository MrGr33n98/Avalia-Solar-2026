'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { companiesApiSafe, leadsWizardApi } from '@/lib/api-client';
import { CategoryMotionIcon } from './categories/CategoryMotionIcon';
import {
  trackWizardStart,
  trackWizardContactSubmitted,
  trackLeadSuccess,
} from '@/lib/analytics/consolidated';
import {
  useBillValueIntent,
  useQuoteWizardTracking,
} from '@/lib/analytics/hooks/useIntentTracking';
import { normalizeWizardError } from '@/src/modules/leadWizard/errors/normalizeWizardError';
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, ArrowLeft, Star, MapPin, ChevronDown, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
  zipcode: string;
  addressFull: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  city: string;
  state: string;
  fullName: string;
  email: string;
  phone: string;
  preferredChannel: string;
  notes: string;
  consent: boolean;
  nickname: string;
};

const TOTAL_STEPS = 4;
const INITIAL_FORM: WizardFormState = {
  productVertical: '',
  projectProfile: '',
  quoteType: '',
  systemSizeChoice: '',
  billValue: '',
  monthlyKwh: '',
  decisionTimeline: '',
  zipcode: '',
  addressFull: '',
  addressStreet: '',
  addressNumber: '',
  addressComplement: '',
  city: '',
  state: '',
  fullName: '',
  email: '',
  phone: '',
  preferredChannel: 'WhatsApp',
  notes: '',
  consent: false,
  nickname: '',
};

type QuoteWizardOpenDetail = {
  preferredCompanyId?: number;
  source?: string;
  categoryId?: number;
  decisionContext?: Record<string, unknown>;
};

const STEP_KICKERS: Record<number, string> = {
  1: 'Empresa e contexto',
  2: 'Dados do local',
  3: 'Detalhes do consumo',
  4: 'Contato e preferências',
  5: 'Verificação',
};

export default function QuoteWizardModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormState>(INITIAL_FORM);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [preferredCompanyId, setPreferredCompanyId] = useState<number | undefined>(undefined);
  const [preferredCompany, setPreferredCompany] = useState<WizardCompany | null>(null);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [decisionContext, setDecisionContext] = useState<Record<string, unknown>>({});
  const [source, setSource] = useState('external_trigger');
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [companies, setCompanies] = useState<WizardCompany[]>([]);
  const [verificationHint, setVerificationHint] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const { user } = useAuth();
  const formatRating = (rating: unknown) => {
    const parsed = Number(rating ?? 0);
    return Number.isFinite(parsed) ? parsed.toFixed(1) : '0.0';
  };

  // Intent tracking hooks
  const companyIdForTracking = preferredCompanyId ?? 0;
  const { trackStep, trackAbandonment, trackSubmission, resetTracking } =
    useQuoteWizardTracking(companyIdForTracking);
  const { trackBillValue } = useBillValueIntent(companyIdForTracking);

  const progressValue = useMemo(
    () => Math.min(100, Math.round((step / TOTAL_STEPS) * 100)),
    [step]
  );

  const resetWizard = useCallback(() => {
    setStep(1);
    setForm(INITIAL_FORM);
    setLeadId(null);
    setOtpCode('');
    setCategoryId(undefined);
    setDecisionContext({});
    setSource('external_trigger');
    setError(null);
    setSubmitting(false);
    setResendCooldown(0);
    setCompanies([]);
    setVerificationHint('');
    setIdempotencyKey(crypto.randomUUID());
    resetTracking();
  }, [resetTracking]);

  const handleOpenRequest = useCallback(
    (detail: QuoteWizardOpenDetail) => {
      resetWizard();
      setPreferredCompanyId(detail.preferredCompanyId);
      setCategoryId(detail.categoryId);
      setDecisionContext(detail.decisionContext || {});
      setSource(detail.source || 'external_trigger');
      setOpen(true);
      trackWizardStart('main_quote_wizard', detail.source || 'external_trigger', detail.categoryId);
    },
    [resetWizard]
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = ((event as CustomEvent<QuoteWizardOpenDetail>).detail ||
        {}) as QuoteWizardOpenDetail;
      delete (window as Window & { __avaliaPendingQuoteWizard?: QuoteWizardOpenDetail })
        .__avaliaPendingQuoteWizard;
      handleOpenRequest(detail);
    };
    window.addEventListener('open-quote-wizard', handler as EventListener);
    const pending = (window as Window & { __avaliaPendingQuoteWizard?: QuoteWizardOpenDetail })
      .__avaliaPendingQuoteWizard;
    if (pending) {
      delete (window as Window & { __avaliaPendingQuoteWizard?: QuoteWizardOpenDetail })
        .__avaliaPendingQuoteWizard;
      handleOpenRequest(pending);
    }
    return () => window.removeEventListener('open-quote-wizard', handler as EventListener);
  }, [handleOpenRequest]);

  useEffect(() => {
    if (!open || !user) return;
    setForm((previous) => ({
      ...previous,
      fullName: previous.fullName || user.name || '',
      email: previous.email || user.email || '',
      phone: previous.phone || user.phone || '',
      city: previous.city || user.city || '',
      state: previous.state || user.state || '',
    }));
  }, [open, user]);

  useEffect(() => {
    if (!open || !preferredCompanyId) return;
    let active = true;
    companiesApiSafe.getById(preferredCompanyId).then((company) => {
      if (!active || !company) return;
      setPreferredCompany({
        id: Number(company.id),
        name: company.name,
        city: company.city,
        state: company.state,
        logo_url: company.logo_url,
      });
    });
    return () => {
      active = false;
    };
  }, [open, preferredCompanyId]);

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
      setError(normalizeWizardError(err, 'Erro ao reenviar código.').message);
      toast.error('Não foi possível reenviar o código.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (patch: Partial<WizardFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const computeSystemSizeBand = () => {
    if (form.systemSizeChoice !== 'unknown') return form.systemSizeChoice;
    const bill = parseNumber(form.billValue);
    const kwh = parseNumber(form.monthlyKwh);
    return (kwh && kwh >= 1200) || (bill && bill >= 1000) ? '8 kWp ou mais' : 'Ate 7 kWp';
  };
  const buildAddressFull = () => {
    const street = [form.addressStreet.trim(), form.addressNumber.trim()]
      .filter(Boolean)
      .join(', ');
    const locality = [form.city.trim(), form.state.trim()].filter(Boolean).join('/');
    return [street, form.addressComplement.trim(), locality, form.zipcode.trim()]
      .filter(Boolean)
      .join(' - ');
  };

  const lookupZipcode = async () => {
    const zipcode = form.zipcode.replace(/\D/g, '');
    if (zipcode.length !== 8) {
      setError('Informe um CEP válido com 8 números.');
      return;
    }
    setError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipcode}/json/`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('cep_lookup_failed');
      const data = await response.json();
      if (data.erro) throw new Error('cep_not_found');
      updateForm({
        addressStreet: data.logradouro || form.addressStreet,
        city: data.localidade || form.city,
        state: data.uf || form.state,
      });
    } catch {
      setError('CEP não encontrado. Preencha o endereço manualmente.');
    }
  };

  const handleNext = async () => {
    setError(null);
    if (step === 1 && (!form.productVertical || !form.projectProfile))
      return setError('Selecione as opções do projeto.');
    if (step === 2 && (!form.billValue || !form.decisionTimeline || !form.zipcode))
      return setError('Informe consumo, prazo e local.');
    if (step === 3) {
      if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim())
        return setError('Preencha nome, e-mail e WhatsApp.');
      if (!isValidEmail(form.email)) return setError('E-mail inválido.');
      if (!form.consent) return setError('O consentimento é obrigatório.');
    }
    
    if (step === 4) {
      setSubmitting(true);
      try {
        const payload = {
          lead: {
            category_id: categoryId,
            product_vertical: form.productVertical,
            project_profile: form.projectProfile,
            quote_type: form.quoteType || 'Energia Solar', // fallback
            system_size_band: computeSystemSizeBand(),
            bill_value: form.billValue || null,
            monthly_kwh: form.monthlyKwh || null,
            decision_timeline: form.decisionTimeline,
            zipcode: form.zipcode || null,
            city: form.city || null,
            state: form.state || null,
            address_full: buildAddressFull() || form.addressFull.trim(),
            full_name: form.fullName,
            email: form.email,
            phone: form.phone,
            preferred_channel: form.preferredChannel,
            notes: (form.notes + ((form as any).installationType ? ` | Tipo de instalação: ${(form as any).installationType}` : '')).trim() || null,
            consent: form.consent,
            nickname: form.nickname,
          },
          preferred_company_id: preferredCompanyId,
          category_id: categoryId,
          decision_context: decisionContext,
          source,
        };
        const response = await leadsWizardApi.create(payload, idempotencyKey);
        setLeadId(response.lead_id);
        setVerificationHint(response.email_hint || form.email);
        setResendCooldown(60);
        trackWizardContactSubmitted(String(response.lead_id), preferredCompanyId || '');
        trackStep(TOTAL_STEPS, TOTAL_STEPS, {
          action: 'lead_created',
          product_vertical: form.productVertical,
        });
        setStep(5);
      } catch (err: unknown) {
        setError(normalizeWizardError(err, 'Erro ao iniciar orçamento.').message);
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

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!leadId || otpCode.length < 6) return setError('Código inválido.');
    setSubmitting(true);
    try {
      const response = await leadsWizardApi.verifyEmailCode(leadId, otpCode);
      setCompanies(Array.isArray(response?.companies) ? response.companies : []);
      trackSubmission(true, leadId);
      trackLeadSuccess({
        lead_id: String(leadId),
        company_id: preferredCompanyId,
        category: form.productVertical,
        city: form.city,
      });
      setStep(6);
    } catch (err: unknown) {
      trackSubmission(false, leadId);
      setError(normalizeWizardError(err, 'Erro na validação.').message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && step < 6 && step > 1) {
          // Wizard fechado antes de completar — abandono
          trackAbandonment(Math.min(step, TOTAL_STEPS), TOTAL_STEPS);
        }
        setOpen(v);
        if (!v) resetWizard();
      }}
    >
      <DialogContent
        overlayClassName="bg-black/65 backdrop-blur-md"
        className={cn(
          'z-[10000] flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-[500px] flex-col overflow-hidden border-none p-0 rounded-3xl bg-white shadow-2xl',
          '[&>button]:right-4 [&>button]:top-4 [&>button]:rounded-full [&>button]:bg-slate-50 hover:[&>button]:bg-slate-100 [&>button]:p-2 [&>button]:text-slate-500 [&>button]:opacity-100 [&>button]:border [&>button]:border-slate-100'
        )}
      >
        <DialogTitle className="sr-only">Solicitar orçamento</DialogTitle>
        
        {/* Clean Header */}
        <div className="bg-white px-5 pt-5 pb-4 md:px-6 md:pt-6 md:pb-4 rounded-t-3xl safe-x">
          {preferredCompany ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center">
                {preferredCompany.logo_url ? (
                  <Image src={preferredCompany.logo_url} alt={preferredCompany.name} width={40} height={40} className="object-cover" />
                ) : (
                  <Zap className="h-5 w-5 text-slate-300" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                  {preferredCompany.name}
                  {preferredCompany.verified && <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />}
                </span>
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                   {preferredCompany.city ? (
                     <><MapPin className="h-3 w-3" /> {(preferredCompany.city || '-') + (preferredCompany.state ? `, ${preferredCompany.state}` : '')}</>
                   ) : (
                     <><Star className="h-3 w-3" /> {formatRating(preferredCompany.rating_avg)}</>
                   )}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-10"></div>
          )}
        </div>

        <div className="overflow-y-auto px-5 pb-5 md:px-6 md:pb-6 overscroll-contain safe-x">
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Solicitar orçamento</h2>
            <p className="text-sm text-slate-500 mt-1">
              {step === 4 
                ? 'Revise as informações e envie sua solicitação.' 
                : `Receba um contato da ${preferredCompany?.name || 'empresa'} para o seu projeto.`}
            </p>
          </div>

          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 top-3 w-full h-[2px] bg-slate-100 -z-10"></div>
            {[
              { num: 1, label: 'Solução' },
              { num: 2, label: 'Projeto' },
              { num: 3, label: 'Contato' },
              { num: 4, label: 'Confirmação' },
            ].map((s) => {
              const isPast = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center bg-white px-2">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    isPast || isCurrent ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium mt-1.5 transition-colors",
                    isCurrent ? "text-blue-600" : "text-slate-400"
                  )}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">O que você deseja comparar?</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Energia solar e/ou baterias', slug: 'solar-residencial' },
                    { label: 'Bombas de calor', slug: 'solar-rural' },
                    { label: 'Carregadores veiculares (EV)', slug: 'wallbox-residencial' },
                  ].map((v) => {
                    const selected = form.productVertical === v.label;
                    return (
                      <div
                        key={v.label}
                        onClick={() => updateForm({ productVertical: v.label })}
                        className={cn(
                          "relative p-3 rounded-2xl border-2 cursor-pointer transition-all",
                          selected ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryMotionIcon
                            slug={v.slug}
                            size={24}
                            motionMode="interactive"
                            className="shrink-0 rounded-md border border-slate-100 bg-white p-0.5"
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight pr-6">
                          {v.label}
                        </span>
                        <div className={cn(
                          "absolute bottom-3 right-3 h-[18px] w-[18px] rounded-full border-2",
                          selected ? "border-blue-600 flex items-center justify-center" : "border-slate-200"
                        )}>
                          {selected && <div className="h-2.5 w-2.5 bg-blue-600 rounded-full"></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Qual é o seu projeto?</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Residencial', icon: 'Home' },
                    { label: 'Condomínio', icon: 'Building' },
                    { label: 'Comercial', icon: 'Building2' },
                  ].map((v) => {
                    const selected = form.projectProfile === v.label;
                    return (
                      <div
                        key={v.label}
                        onClick={() => updateForm({ projectProfile: v.label })}
                        className={cn(
                          "relative p-3 rounded-2xl border-2 cursor-pointer transition-all",
                          selected ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200 bg-white"
                        )}
                      >
                        <div className="mb-2 text-slate-500">
                          {/* We will just use an SVG path for simplicity or lucide icons if imported. I'll use simple SVGs to avoid import issues. */}
                          {v.icon === 'Home' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                          {v.icon === 'Building' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>}
                          {v.icon === 'Building2' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>}
                        </div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight pr-6">
                          {v.label}
                        </span>
                        <div className={cn(
                          "absolute bottom-3 right-3 h-[18px] w-[18px] rounded-full border-2",
                          selected ? "border-blue-600 flex items-center justify-center" : "border-slate-200"
                        )}>
                          {selected && <div className="h-2.5 w-2.5 bg-blue-600 rounded-full"></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Detalhes do seu projeto</h3>
                <p className="text-sm text-slate-500">Informe algumas informações para um orçamento mais preciso.</p>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-3 top-[14px] text-slate-400"><Zap className="h-5 w-5" /></div>
                  <select
                    value={form.billValue}
                    onChange={(e) => updateForm({ billValue: e.target.value })}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>Consumo mensal de energia</option>
                    <option value="Ate R$ 300">Até R$ 300/mês</option>
                    <option value="R$ 300 a R$ 500">R$ 300 a R$ 500/mês</option>
                    <option value="R$ 500 a R$ 1.000">R$ 500 a R$ 1.000/mês</option>
                    <option value="Acima de R$ 1.000">Acima de R$ 1.000/mês</option>
                    <option value="Nao sei">Não sei informar</option>
                  </select>
                  <div className="absolute right-3 top-[14px] pointer-events-none text-slate-400"><ChevronDown className="h-5 w-5" /></div>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-[14px] text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <select
                    value={(form as any).installationType || ''}
                    onChange={(e) => updateForm({ installationType: e.target.value } as any)}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>Tipo de instalação</option>
                    <option value="Telhado Ceramico">Telhado Cerâmico</option>
                    <option value="Telhado Metalico">Telhado Metálico</option>
                    <option value="Laje">Laje plana</option>
                    <option value="Solo">Solo</option>
                    <option value="Outro">Outro</option>
                  </select>
                  <div className="absolute right-3 top-[14px] pointer-events-none text-slate-400"><ChevronDown className="h-5 w-5" /></div>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-[14px] text-slate-400"><Calendar className="h-5 w-5" /></div>
                  <select
                    value={form.decisionTimeline}
                    onChange={(e) => updateForm({ decisionTimeline: e.target.value })}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>Prazo desejado</option>
                    <option value="Agora">O mais rápido possível</option>
                    <option value="Em até 6 meses">Em até 6 meses</option>
                    <option value="Mais de 6 meses">Ainda estou pesquisando</option>
                  </select>
                  <div className="absolute right-3 top-[14px] pointer-events-none text-slate-400"><ChevronDown className="h-5 w-5" /></div>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-[14px] text-slate-400"><MapPin className="h-5 w-5" /></div>
                  <Input
                    value={form.zipcode}
                    onChange={(e) => updateForm({ zipcode: e.target.value })}
                    placeholder="Local da instalação (Ex.: CEP ou Cidade/UF)"
                    className="h-12 w-full rounded-xl border-slate-200 pl-10 text-sm focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-[14px] text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                  </div>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateForm({ notes: e.target.value })}
                    placeholder="Observações (opcional)"
                    className="min-h-24 w-full rounded-xl border border-slate-200 pl-10 pr-3 py-3 text-sm outline-none focus:border-blue-500 resize-none"
                  />
                </div>

              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Seus dados de contato</h3>
                <p className="text-sm text-slate-500">Usaremos seus dados somente para esta solicitação.</p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-3 top-[14px] text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <Input
                    value={form.fullName}
                    autoComplete="name"
                    onChange={(event) => updateForm({ fullName: event.target.value })}
                    placeholder="Nome completo"
                    className="h-12 w-full rounded-xl border-slate-200 pl-10 text-sm focus:border-blue-500"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute left-3 top-[14px] text-[#25D366]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <Input
                    type="tel"
                    value={form.phone}
                    autoComplete="tel"
                    onChange={(event) => updateForm({ phone: event.target.value })}
                    placeholder="WhatsApp"
                    className="h-12 w-full rounded-xl border-slate-200 pl-10 text-sm focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-[14px] text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <Input
                    type="email"
                    value={form.email}
                    autoComplete="email"
                    onChange={(event) => updateForm({ email: event.target.value })}
                    placeholder="E-mail"
                    className="h-12 w-full rounded-xl border-slate-200 pl-10 text-sm focus:border-blue-500"
                  />
                </div>

              </div>

              <div className="flex items-start gap-3 mt-4">
                <Checkbox
                  checked={form.consent}
                  onCheckedChange={(value) => updateForm({ consent: Boolean(value) })}
                  className="mt-0.5"
                />
                <Label className="text-xs text-slate-500 leading-relaxed cursor-pointer" onClick={() => updateForm({ consent: !form.consent })}>
                  Aceito os Termos de Uso e Políticas de Privacidade. Autorizo o envio dos meus dados para empresas relevantes parceiras da plataforma.
                </Label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Quase lá!</h3>
                <p className="text-sm text-slate-500">Verifique se as informações estão corretas.</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Solução</span>
                  <span className="text-sm font-medium text-slate-900">{form.productVertical || 'Não informado'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Projeto</span>
                  <span className="text-sm font-medium text-slate-900">{form.projectProfile || 'Não informado'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Consumo</span>
                  <span className="text-sm font-medium text-slate-900">{form.billValue || 'Não informado'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Local</span>
                  <span className="text-sm font-medium text-slate-900">{form.zipcode || 'Não informado'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Contato</span>
                  <span className="text-sm font-medium text-slate-900">{form.fullName || 'Não informado'} ({form.phone || 'Não informado'})</span>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 py-4 text-center">
              <WizardHeading
                kicker={STEP_KICKERS[8]}
                title="Validação de Segurança"
                subtitle={`Digitie o código enviado para ${verificationHint || form.email}`}
                center
              />
              <div className="flex flex-col items-center gap-6">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 w-10 md:w-12 rounded-xl border-slate-200 text-lg font-bold"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={submitting || otpCode.length < 6}
                  className="h-12 min-w-[180px] rounded-xl bg-blue-600 font-bold text-white"
                >
                  {submitting ? 'Verificando...' : 'Confirmar código'}
                </Button>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || submitting}
                  className="text-xs font-bold text-slate-400 hover:text-blue-600"
                >
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  Sucesso! Orçamento Iniciado.
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {companies.length > 0
                    ? 'Estas empresas receberam sua solicitação:'
                    : 'Sua solicitação foi registrada e seguirá para as empresas elegíveis.'}
                </p>
              </div>
              {companies.length === 0 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  Acompanhe atualizações e propostas reais em <strong>Minhas propostas</strong>.
                </div>
              )}
              <div className="space-y-3">
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                      {c.logo_url ? (
                        <Image
                          src={c.logo_url}
                          alt={c.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <Zap className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 truncate uppercase tracking-tight">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-500 font-bold">
                        {(c.city || '-') + (c.state ? `, ${c.state}` : '')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-slate-900 font-black">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {formatRating(c.rating_avg)}
                      </div>
                      <p className="text-[10px] text-slate-400 font-black">
                        {c.reviews_count || 0} AVALIAÇÕES
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 md:px-6 md:py-3 rounded-b-2xl safe-x pb-[calc(0.75rem+var(--sab))]">
          {step <= TOTAL_STEPS ? (
            <>
              <Button
                variant="ghost"
                className="h-12 min-h-[48px] rounded-xl px-3 text-xs font-black tracking-[0.16em] text-[#0B1B36] hover:bg-slate-50 hover:text-[#1268E8] disabled:text-slate-300"
                onClick={handleBack}
                disabled={step === 1 || submitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> VOLTAR
              </Button>
              {step < TOTAL_STEPS ? (
                <Button
                  onClick={handleNext}
                  disabled={submitting}
                  className="h-12 min-h-[48px] rounded-xl border border-[#1268E8] bg-[#1268E8] px-5 text-xs font-black tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] hover:bg-[#0F56C6] active:scale-[0.98]"
                >
                  AVANÇAR <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={submitting}
                  className="h-12 min-h-[48px] rounded-xl border border-[#1268E8] bg-[#1268E8] px-5 text-xs font-black tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] hover:bg-[#0F56C6] active:scale-[0.98]"
                >
                  ENVIAR SOLICITAÇÃO
                </Button>
              )}
            </>
          ) : step === 5 ? null : (
            <div className="flex w-full gap-2">
              <Button
                asChild
                variant="outline"
                className="h-12 min-h-[48px] flex-1 rounded-xl text-xs font-bold"
              >
                <Link href="/review-dashboard/proposals">VER MINHAS PROPOSTAS</Link>
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="h-12 min-h-[48px] flex-1 rounded-xl bg-[#0B1B36] text-xs font-black tracking-[0.16em] shadow-lg active:scale-[0.98]"
              >
                CONCLUÍDO
              </Button>
            </div>
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
  <div className={cn('space-y-1', center && 'text-center')}>
    {kicker ? (
      <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.18em] text-[#1268E8]">
        {kicker}
      </p>
    ) : null}
    <h2 className="text-[18px] md:text-[24px] font-[800] leading-[1.15] tracking-[-0.02em] text-[#0B1B36] uppercase">
      {title}
    </h2>
    <p className="max-w-[32ch] text-[13px] md:text-[14px] leading-[1.4] text-slate-500 font-medium">
      {subtitle}
    </p>
  </div>
);

const FieldGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</Label>
    {children}
  </div>
);

type OptionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  children: ReactNode;
};

const OptionButton = ({ selected, children, className, ...props }: OptionButtonProps) => (
  <button
    type="button"
    className={cn(
      'w-full border px-3 md:px-4 min-h-[48px] py-2 md:py-3 text-left text-[12px] md:text-[14px] font-[700] uppercase tracking-tight transition-all active:scale-[0.98]',
      'rounded-xl border-slate-200 bg-white text-[#0B1B36] shadow-sm',
      selected
        ? 'border-[#1268E8] bg-blue-50/70 text-[#0B1B36] ring-2 ring-blue-500/10 shadow-md'
        : 'hover:border-blue-300 hover:bg-slate-50 hover:shadow',
      className
    )}
    aria-pressed={selected}
    {...props}
  >
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
