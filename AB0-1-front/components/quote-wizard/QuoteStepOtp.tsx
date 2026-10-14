'use client';

import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';

interface QuoteStepOtpProps {
  emailHint: string;
  otpCode: string;
  onOtpChange: (code: string) => void;
  onVerify: () => Promise<void>;
  onResend: () => Promise<void>;
  resendCooldown: number;
  submitting: boolean;
}

export function QuoteStepOtp({
  emailHint,
  otpCode,
  onOtpChange,
  onVerify,
  onResend,
  resendCooldown,
  submitting,
}: QuoteStepOtpProps) {
  return (
    <div className="space-y-5 text-center py-2 animate-in fade-in duration-200">
      <div className="space-y-1">
        <div className="mx-auto h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Validação de Segurança
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Digite o código de 6 dígitos que enviamos para{' '}
          <strong className="text-slate-700">{emailHint}</strong>
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={6}
          value={otpCode}
          onChange={onOtpChange}
          aria-label="Código de verificação de 6 dígitos"
        >
          <InputOTPGroup className="gap-1.5 sm:gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-11 w-9 sm:h-12 sm:w-11 rounded-xl border-slate-200 text-base font-black text-slate-900"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <Button
          type="button"
          onClick={onVerify}
          disabled={submitting || otpCode.length < 6}
          className="h-11 min-w-[190px] rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 text-xs shadow-md transition-all disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verificando...</span>
            </span>
          ) : (
            'Confirmar código'
          )}
        </Button>

        <button
          type="button"
          onClick={onResend}
          disabled={resendCooldown > 0 || submitting}
          className="text-xs font-bold text-slate-500 hover:text-blue-600 disabled:opacity-40 transition-colors"
        >
          {resendCooldown > 0
            ? `Reenviar código em ${resendCooldown}s`
            : 'Não recebeu? Reenviar código'}
        </button>
      </div>
    </div>
  );
}
