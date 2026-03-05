import React from 'react';
import { useLeadWizard } from '../hooks/useLeadWizard';
import { WizardStep } from './WizardStep';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ChevronLeft, ArrowRight, CheckCircle2, ShieldCheck, Mail, Zap, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import Image from 'next/image';

interface WizardRendererProps {
  wizardState: ReturnType<typeof useLeadWizard>;
}

export const WizardRenderer: React.FC<WizardRendererProps> = ({ wizardState }) => {
  const { 
    status, schema, currentStepIndex, answers, validationErrors, serverError, 
    leadResult, resendCooldown, distributedCompanies,
    setAnswer, nextStep, prevStep, handleVerifyOtp, handleResendOtp,
    canGoBack, isLastStep, progress 
  } = wizardState;

  const [otpValue, setOtpValue] = React.useState('');
  const formatRating = React.useCallback((rating: unknown) => {
    const parsed = Number(rating ?? 0);
    return Number.isFinite(parsed) ? parsed.toFixed(1) : '0.0';
  }, []);

  if (status === 'LOADING_SCHEMA' || status === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 animate-pulse">Preparando formulário...</p>
      </div>
    );
  }

  if (status === 'SCHEMA_ERROR' || !schema) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ocorreu um erro ao carregar o formulário. Por favor, tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'SUCCESS') {
    const thankYou = schema.thank_you_config;
    return (
      <div className="text-center py-12 space-y-8 animate-in fade-in duration-500">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">{thankYou?.title || 'Solicitação Enviada!'}</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            {thankYou?.message || 'Recebemos seus dados e em breve os melhores fornecedores entrarão em contato.'}
          </p>
        </div>

        {distributedCompanies.length > 0 && (
          <div className="max-w-md mx-auto space-y-4 pt-4 text-left">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
              Empresas que receberam seu pedido:
            </h3>
            <div className="space-y-3">
              {distributedCompanies.map((c: any) => (
                <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 bg-white shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                    {c.logo_url ? (
                      <Image src={c.logo_url} alt={c.name} width={48} height={48} className="object-cover" />
                    ) : (
                      <Zap className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 truncate uppercase tracking-tight text-sm">{c.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{(c.city || '-') + (c.state ? `, ${c.state}` : '')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-slate-900 font-black text-sm">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {formatRating(c.rating_avg)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {thankYou?.redirect_url && (
          <Button
            className="mt-6"
            onClick={() => {
              const redirectUrl = thankYou?.redirect_url;
              if (redirectUrl) window.location.href = redirectUrl;
            }}>
            Continuar
          </Button>
        )}
      </div>
    );
  }

  if (status === 'OTP_VERIFICATION' || (status === 'SUBMITTING' && leadResult)) {
    return (
      <div className="max-w-2xl mx-auto w-full bg-white rounded-xl shadow-sm border p-8 md:p-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Verifique seu E-mail</h2>
          <p className="text-sm text-slate-500 font-medium">
            Enviamos um código de segurança para <span className="text-slate-900 font-bold">{leadResult?.email_hint || 'seu e-mail'}</span>.
          </p>
        </div>

        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center gap-8">
          <InputOTP 
            maxLength={6} 
            value={otpValue} 
            onChange={setOtpValue}
            disabled={status === 'SUBMITTING'}
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot 
                  key={i} 
                  index={i} 
                  className="h-14 w-12 md:w-14 rounded-xl border-slate-200 text-xl font-bold" 
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <div className="w-full space-y-4">
            <Button 
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-100"
              onClick={() => handleVerifyOtp(otpValue)}
              disabled={otpValue.length < 6 || status === 'SUBMITTING'}
            >
              {status === 'SUBMITTING' ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-5 w-5 mr-3 border-b-2 border-white rounded-full"></span>
                  VERIFICANDO...
                </span>
              ) : 'VALIDAR AGORA'}
            </Button>

            <div className="text-center">
              <button 
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || status === 'SUBMITTING'}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {resendCooldown > 0 
                  ? `Reenviar código em ${resendCooldown}s` 
                  : 'Não recebeu o código? Reenviar'}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex items-center justify-center gap-6 opacity-50">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            SEGURO
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
            <Zap className="h-3.5 w-3.5 text-blue-500" />
            RÁPIDO
          </div>
        </div>
      </div>
    );
  }

  const currentStep = schema.schema.steps[currentStepIndex];
  const isPremiumCustom = schema.source === 'company_custom';
  const companyUnavailable = schema.availability?.company_available === false;

  return (
    <div className="max-w-2xl mx-auto w-full bg-white rounded-xl shadow-sm border p-6 md:p-8">
      {/* Branding / Header */}
      <div className="mb-8">
        {isPremiumCustom && (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mb-4">
            Atendimento Exclusivo
          </div>
        )}
        
        {/* Progress Bar (Stripe-like) */}
        {schema.schema.ui_config?.show_progress_bar !== false && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Passo {currentStepIndex + 1} de {schema.schema.steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      {serverError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div className="min-h-[300px]">
        <WizardStep 
          step={currentStep}
          answers={answers}
          errors={validationErrors}
          onAnswerChange={setAnswer}
          onEnterPress={nextStep}
        />
      </div>

      {/* Footer Navigation */}
      <div className="mt-8 pt-6 border-t flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={prevStep} 
          disabled={!canGoBack || status === 'SUBMITTING'}
          className={!canGoBack ? 'invisible' : ''}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        
        <Button 
          onClick={nextStep} 
          disabled={status === 'SUBMITTING' || companyUnavailable}
          className="min-w-[140px]"
        >
          {status === 'SUBMITTING' ? (
            <span className="flex items-center">
              <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></span>
              Enviando...
            </span>
          ) : companyUnavailable ? (
            'Indisponível'
          ) : isLastStep ? (
            'Enviar Solicitação'
          ) : (
            <span className="flex items-center">
              Próximo <ArrowRight className="w-4 h-4 ml-2" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};
