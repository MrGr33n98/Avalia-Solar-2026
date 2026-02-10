'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { leadsWizardApi } from '@/lib/api-client';
import { track } from '@/lib/analytics/lazy';
import { Zap, ShieldCheck, Clock, MapPin } from 'lucide-react';

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

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      setPreferredCompanyId(detail.preferredCompanyId);
      setOpen(true);
      setStep(1);
      setError(null);
      setVerificationHint('');
      track('Quick Lead Opened', { source: detail.source });
    };
    window.addEventListener('open-quick-lead', handler as EventListener);
    return () => window.removeEventListener('open-quick-lead', handler as EventListener);
  }, []);

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
      setError('Informe um e-mail valido.');
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
          nickname: form.nickname, // Honeypot
          // Defaults for required wizard fields
          product_vertical: 'Energia Solar',
          project_profile: 'Residencial',
          quote_type: 'Energia Solar',
          system_size_band: 'Ate 7 kWp',
          decision_timeline: 'Agora',
          address_full: form.zipcode ? `CEP: ${form.zipcode}` : 'Não informado'
        },
        preferred_company_id: preferredCompanyId
      };

      const response = await leadsWizardApi.create(payload);
      setLeadId(response.lead_id);
      setVerificationHint(response.email_hint || form.email);
      setResendCooldown(60);
      setStep(2);
      track('Quick Lead Created', { lead_id: response.lead_id });
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

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
    } catch (err: any) {
      setError(err?.message || 'Código inválido.');
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
    } catch (err: any) {
      setError(err?.message || 'Erro ao reenviar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden z-[10000]">
        <div className="bg-primary px-6 py-6 text-white">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 fill-current" />
            Solicitação Rápida
          </DialogTitle>
          <DialogDescription className="text-blue-100 mt-1">
            Receba orçamentos de empresas verificadas em poucos minutos.
          </DialogDescription>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Honeypot field - Hidden from users */}
                <div className="hidden" aria-hidden="true">
                  <Input
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-name">Nome Completo</Label>
                  <Input
                    id="quick-name"
                    required
                    placeholder="Seu nome"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-email">Email</Label>
                    <Input
                      id="quick-email"
                      type="email"
                      required
                      placeholder="seu@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quick-phone">Telefone</Label>
                    <Input
                      id="quick-phone"
                      required
                      placeholder="(00) 00000-0000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-zip">CEP (Opcional)</Label>
                  <Input
                    id="quick-zip"
                    placeholder="00000-000"
                    value={form.zipcode}
                    onChange={(e) => setForm({ ...form, zipcode: e.target.value })}
                  />
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="quick-consent"
                    checked={form.consent}
                    onCheckedChange={(val) => setForm({ ...form, consent: Boolean(val) })}
                  />
                  <Label htmlFor="quick-consent" className="text-xs text-gray-500 leading-snug cursor-pointer">
                    Concordo em receber contato de empresas parceiras para fins de orçamento.
                  </Label>
                </div>
              </div>

              {error && (
                <p className="text-sm font-medium text-red-500 bg-red-50 p-2 rounded border border-red-100">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Receber Orçamentos Agora'}
              </Button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 font-medium pt-2 border-t">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Seguro & Grátis</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Resposta em 24h</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Empresas Locais</span>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6 py-4 flex flex-col items-center">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-gray-900">Verifique seu e-mail</h3>
                <p className="text-sm text-gray-500">Enviamos um codigo de 6 digitos para {verificationHint || form.email}</p>
              </div>

              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <InputOTPSlot key={idx} index={idx} className="h-12 w-10 sm:w-12 text-lg" />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {error && (
                <p className="text-sm font-medium text-red-500 bg-red-50 p-2 rounded border border-red-100 w-full text-center">
                  {error}
                </p>
              )}

              <div className="w-full space-y-3">
                <Button onClick={handleVerifyOtp} className="w-full h-11 font-bold" disabled={submitting || otpCode.length < 6}>
                  {submitting ? 'Verificando...' : 'Confirmar Código'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleResend} 
                  className="w-full text-gray-500" 
                  disabled={resendCooldown > 0 || submitting}
                >
                  {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Não recebi o código'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Solicitação Enviada!</h3>
                <p className="text-sm text-gray-500">
                  Em breve, as melhores empresas entrarão em contato com você para apresentar propostas.
                </p>
              </div>
              <Button onClick={() => setOpen(false)} className="w-full">
                Entendido
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
