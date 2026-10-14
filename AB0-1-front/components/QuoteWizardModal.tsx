'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { companiesApiSafe, leadsWizardApi } from '@/lib/api-client';
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
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  Star,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

import {
  INITIAL_WIZARD_FORM,
  type WizardCompany,
  type WizardFormState,
} from './quote-wizard/types';
import { QuoteStepSolution } from './quote-wizard/QuoteStepSolution';
import { QuoteStepDetails } from './quote-wizard/QuoteStepDetails';
import { QuoteStepContact } from './quote-wizard/QuoteStepContact';
import { QuoteStepReview } from './quote-wizard/QuoteStepReview';
import { QuoteStepOtp } from './quote-wizard/QuoteStepOtp';
import { QuoteStepSuccess } from './quote-wizard/QuoteStepSuccess';

const TOTAL_STEPS = 4;

const STEP_LABELS: Record<number, string> = {
  1: 'Solução',
  2: 'Projeto',
  3: 'Contato',
  4: 'Revisão',
};

type QuoteWizardOpenDetail = {
  preferredCompanyId?: number;
  source?: string;
  categoryId?: number;
  decisionContext?: Record<string, unknown>;
};

export default function QuoteWizardModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormState>(INITIAL_WIZARD_FORM);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [preferredCompanyId, setPreferredCompanyId] = useState<number | undefined>(undefined);
  const [preferredCompany, setPreferredCompany] = useState<WizardCompany | null>(null);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [decisionContext, setDecisionContext] = useState<Record<string, unknown>>({});
  const [source, setSource] = useState('external_trigger');
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [companies, setCompanies] = useState<WizardCompany[]>([]);
  const [verificationHint, setVerificationHint] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [isLookingUpZipcode, setIsLookingUpZipcode] = useState(false);
  const { user } = useAuth();

  const formatRating = (rating: unknown) => {
    const parsed = Number(rating ?? 0);
    return Number.isFinite(parsed) ? parsed.toFixed(1) : '5.0';
  };

  // Intent tracking hooks
  const companyIdForTracking = preferredCompanyId ?? 0;
  const { trackStep, trackAbandonment, trackSubmission, resetTracking } =
    useQuoteWizardTracking(companyIdForTracking);
  const { trackBillValue } = useBillValueIntent(companyIdForTracking);

  const resetWizard = useCallback(() => {
    setStep(1);
    setForm(INITIAL_WIZARD_FORM);
    setLeadId(null);
    setOtpCode('');
    setCategoryId(undefined);
    setDecisionContext({});
    setSource('external_trigger');
    setError(null);
    setFieldErrors({});
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
    if (!open || !preferredCompanyId) {
      setPreferredCompany(null);
      return;
    }
    let active = true;
    companiesApiSafe.getById(preferredCompanyId).then((company) => {
      if (!active || !company) return;
      setPreferredCompany({
        id: Number(company.id),
        name: company.name,
        city: company.city,
        state: company.state,
        rating_avg: company.rating_avg,
        reviews_count: company.reviews_count,
        verified: company.verified,
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

  const updateForm = (patch: Partial<WizardFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Limpeza de erros em tempo real
    const patchedKeys = Object.keys(patch);
    setFieldErrors((prev) => {
      const next = { ...prev };
      patchedKeys.forEach((key) => delete next[key]);
      return next;
    });
    if (patch.consent === true) {
      setError((prev) => (prev?.toLowerCase().includes('consentimento') ? null : prev));
    } else {
      setError(null);
    }
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === 'consent') {
      setError((prev) => (prev?.toLowerCase().includes('consentimento') ? null : prev));
    }
  };

  const computeSystemSizeBand = () => {
    if (form.systemSizeChoice && form.systemSizeChoice !== 'unknown') return form.systemSizeChoice;
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
    const cleanZipcode = form.zipcode.replace(/\D/g, '');
    if (cleanZipcode.length !== 8) return;
    setIsLookingUpZipcode(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanZipcode}/json/`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.erro) return;
      updateForm({
        addressStreet: data.logradouro || form.addressStreet,
        city: data.localidade || form.city,
        state: data.uf || form.state,
      });
    } catch {
      // Falha silenciosa de CEP permite preenchimento manual
    } finally {
      setIsLookingUpZipcode(false);
    }
  };

  const handleNext = async () => {
    setError(null);
    const newFieldErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.productVertical) newFieldErrors.productVertical = 'Selecione uma solução.';
      if (!form.projectProfile) newFieldErrors.projectProfile = 'Selecione o perfil do projeto.';
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        setError('Selecione as opções do projeto.');
        return;
      }
    }

    if (step === 2) {
      if (!form.billValue) newFieldErrors.billValue = 'Informe a média ou capacidade.';
      if (!form.decisionTimeline) newFieldErrors.decisionTimeline = 'Selecione o prazo.';
      if (!form.zipcode.trim()) newFieldErrors.zipcode = 'Informe o CEP ou cidade.';
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        setError('Preencha as informações obrigatórias do projeto.');
        return;
      }
      if (form.billValue) trackBillValue(form.billValue);
    }

    if (step === 3) {
      if (!form.fullName.trim()) newFieldErrors.fullName = 'Informe seu nome completo.';
      if (!form.phone.trim()) newFieldErrors.phone = 'Informe seu WhatsApp.';
      if (!form.email.trim()) {
        newFieldErrors.email = 'Informe seu e-mail.';
      } else if (!isValidEmail(form.email)) {
        newFieldErrors.email = 'E-mail inválido.';
      }
      if (!form.consent) {
        newFieldErrors.consent = 'O consentimento é obrigatório.';
      }
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        setError(newFieldErrors.consent ? 'O consentimento é obrigatório.' : 'Preencha seus dados de contato.');
        return;
      }
    }

    if (step === 4) {
      setSubmitting(true);
      try {
        const payload = {
          lead: {
            category_id: categoryId,
            product_vertical: form.productVertical,
            project_profile: form.projectProfile,
            quote_type: form.quoteType || form.productVertical || 'Energia Solar',
            system_size_band: computeSystemSizeBand(),
            bill_value: form.billValue || null,
            monthly_kwh: form.monthlyKwh || null,
            decision_timeline: form.decisionTimeline || 'Agora',
            zipcode: form.zipcode || null,
            city: form.city || null,
            state: form.state || null,
            address_full:
              buildAddressFull() || form.addressFull.trim() || form.zipcode.trim() || 'Não informado',
            full_name: form.fullName,
            email: form.email,
            phone: form.phone,
            preferred_channel: form.preferredChannel,
            notes: (
              form.notes +
              (form.installationType ? ` | Tipo de instalação: ${form.installationType}` : '')
            ).trim() || null,
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
        try {
          trackWizardContactSubmitted(String(response.lead_id), preferredCompanyId || '');
          trackStep(TOTAL_STEPS, TOTAL_STEPS, {
            action: 'lead_created',
            product_vertical: form.productVertical,
          });
        } catch {
          // Analytics não-bloqueante
        }
        setStep(5);
      } catch (err: unknown) {
        const normalized = normalizeWizardError(err, 'Erro ao iniciar orçamento.');
        setError(normalized.message);
        if (normalized.fields) {
          const mapped: Record<string, string> = {};
          Object.entries(normalized.fields).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? String(v[0]) : String(v);
          });
          setFieldErrors(mapped);
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Avança para o próximo passo
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    try {
      trackStep(nextStep, TOTAL_STEPS, {
        product_vertical: form.productVertical || undefined,
        decision_timeline: form.decisionTimeline || undefined,
      });
    } catch {
      // Analytics não-bloqueante
    }
    setStep(nextStep);
  };

  const handleBack = () => {
    setError(null);
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleResendOtp = async () => {
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

  const handleVerifyOtp = async () => {
    setError(null);
    if (!leadId || otpCode.length < 6) return setError('Informe o código de 6 dígitos.');
    setSubmitting(true);
    try {
      const response = await leadsWizardApi.verifyEmailCode(leadId, otpCode);
      setCompanies(Array.isArray(response?.companies) ? response.companies : []);
      try {
        trackSubmission(true, leadId);
        trackLeadSuccess({
          lead_id: String(leadId),
          company_id: preferredCompanyId,
          category: form.productVertical,
          city: form.city,
        });
      } catch {
        // Analytics não-bloqueante
      }
      setStep(6);
    } catch (err: unknown) {
      try {
        trackSubmission(false, leadId);
      } catch {
        // Analytics não-bloqueante
      }
      setError(normalizeWizardError(err, 'Código de verificação incorreto ou expirado.').message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && step < 6 && step > 1) {
          try {
            trackAbandonment(Math.min(step, TOTAL_STEPS), TOTAL_STEPS);
          } catch {
            // Analytics não-bloqueante
          }
        }
        setOpen(v);
        if (!v) resetWizard();
      }}
    >
      <DialogContent
        overlayClassName="bg-black/60 backdrop-blur-sm"
        className={cn(
          'z-[10000] flex max-h-[min(90dvh,680px)] w-[min(calc(100%-2rem),460px)] flex-col overflow-hidden',
          'border border-slate-200/80 bg-white p-0 gap-0 rounded-3xl shadow-2xl transition-all'
        )}
      >
        <DialogTitle className="sr-only">Solicitar Orçamento</DialogTitle>
        <DialogDescription className="sr-only">
          Solicitação de orçamento personalizada para energia solar e mobilidade elétrica
        </DialogDescription>

        {/* Topo Compacto com Empresa Destinatária */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 shrink-0">
          {preferredCompany ? (
            <div className="flex items-center gap-2.5 min-w-0 pr-8">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white flex items-center justify-center">
                {preferredCompany.logo_url ? (
                  <Image
                    src={preferredCompany.logo_url}
                    alt={preferredCompany.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <Zap className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>{preferredCompany.name}</span>
                  {preferredCompany.verified && (
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  )}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                  {preferredCompany.city ? (
                    <>
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{preferredCompany.city}{preferredCompany.state ? `, ${preferredCompany.state}` : ''}</span>
                    </>
                  ) : (
                    <>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{formatRating(preferredCompany.rating_avg)}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">
                AS
              </div>
              <span>Solicitar Orçamento</span>
            </div>
          )}
        </div>

        {/* Barra de Progresso / Stepper Compacto (1 linha) */}
        {step <= TOTAL_STEPS && (
          <div className="border-b border-slate-100 bg-white px-4 py-2 shrink-0">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((s) => {
                const isCurrent = step === s;
                const isPast = step > s;
                return (
                  <div key={s} className="flex items-center gap-1.5 text-xs select-none">
                    <div
                      className={cn(
                        'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                        isPast
                          ? 'bg-blue-600 text-white'
                          : isCurrent
                            ? 'bg-blue-600 text-white ring-2 ring-blue-500/20'
                            : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {isPast ? <CheckCircle2 className="h-3 w-3" /> : s}
                    </div>
                    <span
                      className={cn(
                        'text-[11px] font-bold hidden sm:inline transition-colors',
                        isCurrent ? 'text-blue-600' : isPast ? 'text-slate-800' : 'text-slate-400'
                      )}
                    >
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Corpo com Scroll de Contingência (Fit-content em viewports normais) */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 overscroll-contain">
          {/* Mensagem de Erro Geral */}
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs font-bold text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <QuoteStepSolution form={form} onUpdate={updateForm} />
          )}

          {step === 2 && (
            <QuoteStepDetails
              form={form}
              onUpdate={updateForm}
              onLookupZipcode={lookupZipcode}
              isLookingUpZipcode={isLookingUpZipcode}
            />
          )}

          {step === 3 && (
            <QuoteStepContact
              form={form}
              onUpdate={updateForm}
              errors={fieldErrors}
              onClearError={clearFieldError}
            />
          )}

          {step === 4 && (
            <QuoteStepReview
              form={form}
              preferredCompany={preferredCompany}
              onGoToStep={(s) => setStep(s)}
            />
          )}

          {step === 5 && (
            <QuoteStepOtp
              emailHint={verificationHint || form.email}
              otpCode={otpCode}
              onOtpChange={setOtpCode}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              resendCooldown={resendCooldown}
              submitting={submitting}
            />
          )}

          {step === 6 && (
            <QuoteStepSuccess
              companies={companies}
              onClose={() => setOpen(false)}
            />
          )}
        </div>

        {/* Rodapé Fixo com Botões (Passos 1 a 4) */}
        {step <= TOTAL_STEPS && (
          <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 bg-white px-4 py-3 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1 || submitting}
              className="h-10 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              <span>Voltar</span>
            </Button>

            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="h-10 min-w-[120px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                <span>Avançar</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="h-10 min-w-[150px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98]"
              >
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </span>
                ) : (
                  <span>Enviar Solicitação</span>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const parseNumber = (v: string) => {
  if (!v) return 0;
  const n = Number(v.replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
