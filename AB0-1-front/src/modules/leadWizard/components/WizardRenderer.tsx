import React from 'react';
import { useLeadWizard } from '../hooks/useLeadWizard';
import { WizardStep } from './WizardStep';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ChevronLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WizardRendererProps {
  wizardState: ReturnType<typeof useLeadWizard>;
}

export const WizardRenderer: React.FC<WizardRendererProps> = ({ wizardState }) => {
  const { 
    status, schema, currentStepIndex, answers, validationErrors, serverError, 
    setAnswer, nextStep, prevStep, canGoBack, isLastStep, progress 
  } = wizardState;

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
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{thankYou?.title || 'Solicitação Enviada!'}</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          {thankYou?.message || 'Recebemos seus dados e em breve os melhores fornecedores entrarão em contato.'}
        </p>
        {thankYou?.redirect_url && (
          <Button className="mt-6" onClick={() => window.location.href = thankYou.redirect_url}>
            Continuar
          </Button>
        )}
      </div>
    );
  }

  const currentStep = schema.schema.steps[currentStepIndex];
  const isPremiumCustom = schema.source === 'company_custom';

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
          disabled={status === 'SUBMITTING'}
          className="min-w-[140px]"
        >
          {status === 'SUBMITTING' ? (
            <span className="flex items-center">
              <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></span>
              Enviando...
            </span>
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
