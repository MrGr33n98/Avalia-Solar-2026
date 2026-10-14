'use client';

import React from 'react';
import Link from 'next/link';
import { User, Phone, Mail, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { type WizardFormState } from './types';

interface QuoteStepContactProps {
  form: WizardFormState;
  onUpdate: (patch: Partial<WizardFormState>) => void;
  errors?: Record<string, string>;
  onClearError?: (field: string) => void;
}

export function QuoteStepContact({
  form,
  onUpdate,
  errors = {},
  onClearError,
}: QuoteStepContactProps) {
  const handleConsentToggle = (checked: boolean) => {
    onUpdate({ consent: checked });
    if (checked && onClearError) {
      onClearError('consent');
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* Campo: Nome Completo */}
      <div className="space-y-1">
        <Label
          htmlFor="wizard-fullname"
          className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
        >
          Nome Completo
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-[11px] text-slate-400 pointer-events-none">
            <User className="h-4 w-4" />
          </div>
          <Input
            id="wizard-fullname"
            value={form.fullName}
            autoComplete="name"
            onChange={(e) => {
              onUpdate({ fullName: e.target.value });
              if (errors.fullName && onClearError) onClearError('fullName');
            }}
            placeholder="Seu nome ou da sua empresa"
            className="h-10 w-full rounded-xl border-slate-200 pl-9 text-xs font-medium focus:border-blue-500"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullname-error' : undefined}
          />
        </div>
        {errors.fullName && (
          <p id="fullname-error" className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="h-3 w-3" />
            <span>{errors.fullName}</span>
          </p>
        )}
      </div>

      {/* Grid: WhatsApp & E-mail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* WhatsApp */}
        <div className="space-y-1">
          <Label
            htmlFor="wizard-phone"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
          >
            WhatsApp / Celular
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-[11px] text-[#25D366] pointer-events-none">
              <Phone className="h-4 w-4" />
            </div>
            <Input
              id="wizard-phone"
              type="tel"
              value={form.phone}
              autoComplete="tel"
              onChange={(e) => {
                onUpdate({ phone: e.target.value });
                if (errors.phone && onClearError) onClearError('phone');
              }}
              placeholder="(11) 99999-9999"
              className="h-10 w-full rounded-xl border-slate-200 pl-9 text-xs font-medium focus:border-blue-500"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
          </div>
          {errors.phone && (
            <p id="phone-error" className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3 w-3" />
              <span>{errors.phone}</span>
            </p>
          )}
        </div>

        {/* E-mail */}
        <div className="space-y-1">
          <Label
            htmlFor="wizard-email"
            className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
          >
            E-mail
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-[11px] text-slate-400 pointer-events-none">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              id="wizard-email"
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={(e) => {
                onUpdate({ email: e.target.value });
                if (errors.email && onClearError) onClearError('email');
              }}
              placeholder="seuemail@exemplo.com"
              className="h-10 w-full rounded-xl border-slate-200 pl-9 text-xs font-medium focus:border-blue-500"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3 w-3" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>
      </div>

      {/* Consentimento LGPD com validação imediata e id/htmlFor */}
      <div className="pt-2">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="wizard-consent"
            checked={form.consent}
            onCheckedChange={(val) => handleConsentToggle(Boolean(val))}
            className="mt-0.5 h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
          />
          <Label
            htmlFor="wizard-consent"
            className="text-[11px] text-slate-600 leading-relaxed cursor-pointer select-none font-normal"
          >
            Concordo com os{' '}
            <Link
              href="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-bold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-bold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Política de Privacidade
            </Link>
            . Autorizo o envio da solicitação para instaladoras e integradores credenciados.
          </Label>
        </div>

        {errors.consent && (
          <p id="consent-error" className="text-[11px] text-rose-600 flex items-center gap-1 font-bold mt-1.5 ml-6">
            <AlertCircle className="h-3 w-3" />
            <span>O consentimento é obrigatório para continuar.</span>
          </p>
        )}
      </div>
    </div>
  );
}
