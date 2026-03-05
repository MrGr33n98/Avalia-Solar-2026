import { useState, useEffect, useCallback } from 'react';
import { WizardSchema, WizardSessionData, WizardStateStatus } from '../types/wizard.types';
import { wizardApi } from '../api/wizard.api';
import { track } from '@/lib/analytics';
import { buildWizardPayload } from '../utils/payload';

const SESSION_KEY = 'leadWizardSession';
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const getRemainingCooldown = (otpSentAt?: string) => {
  if (!otpSentAt) return 0;

  const sentAtMs = new Date(otpSentAt).getTime();
  if (Number.isNaN(sentAtMs)) return 0;

  const elapsedSeconds = Math.floor((Date.now() - sentAtMs) / 1000);
  return Math.max(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds, 0);
};

export const useLeadWizard = (categoryId: number, preferredCompanyId?: number) => {
  const [status, setStatus] = useState<WizardStateStatus>('IDLE');
  const [schema, setSchema] = useState<WizardSchema | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [leadResult, setLeadResult] = useState<{ lead_id: number; otp_sent_at: string; email_hint?: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [distributedCompanies, setDistributedCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const loadSchema = async () => {
      setStatus('LOADING_SCHEMA');
      try {
        const fetchedSchema = await wizardApi.resolveSchema(categoryId, preferredCompanyId);
        setSchema(fetchedSchema);
        setServerError(fetchedSchema.availability?.company_available === false ? fetchedSchema.availability.message || 'Esta empresa não atende a categoria selecionada.' : null);
        
        // Restore session if available and matches category
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession) as WizardSessionData;
          if (
            parsed.categoryId === categoryId &&
            parsed.preferredCompanyId === preferredCompanyId
          ) {
            setAnswers(parsed.answers || {});
            setCurrentStepIndex(Math.min(parsed.currentStepIndex || 0, fetchedSchema.schema.steps.length - 1));
            
            // If there's a leadResult, resume the OTP verification
            if (parsed.leadResult) {
              setLeadResult(parsed.leadResult);
              setResendCooldown(getRemainingCooldown(parsed.leadResult.otp_sent_at));
              setStatus('OTP_VERIFICATION');
            } else {
              setStatus('STEP_ACTIVE');
            }
          } else {
            localStorage.removeItem(SESSION_KEY);
            setStatus('STEP_ACTIVE');
          }
        } else {
          setStatus('STEP_ACTIVE');
        }
        track('wizard_started', {
          category_id: categoryId,
          template_key: fetchedSchema.template_key,
          availability_reason: fetchedSchema.availability?.reason,
        });
      } catch (error) {
        setStatus('SCHEMA_ERROR');
      }
    };

    if (categoryId) loadSchema();
  }, [categoryId, preferredCompanyId]);

  // Track step views
  useEffect(() => {
    if (status === 'STEP_ACTIVE' && schema) {
      track('wizard_step_viewed', { 
        step_index: currentStepIndex,
        step_name: schema.schema.steps[currentStepIndex]?.title,
        category_id: categoryId 
      });
    }
  }, [currentStepIndex, status, schema, categoryId]);

  // Autosave
  useEffect(() => {
    if (status !== 'LOADING_SCHEMA' && status !== 'IDLE' && status !== 'SUCCESS' && Object.keys(answers).length > 0) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        categoryId,
        preferredCompanyId,
        currentStepIndex,
        answers,
        leadResult, // Persist leadResult to allow resumption
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [answers, currentStepIndex, status, categoryId, preferredCompanyId, leadResult]);

  const setAnswer = useCallback((key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [validationErrors]);

  const validateCurrentStep = useCallback(() => {
    if (!schema) return false;
    const currentStep = schema.schema.steps[currentStepIndex];
    const errors: Record<string, string> = {};

    currentStep.fields.forEach(field => {
      // Check visibility rules
      if (field.dependsOn) {
        const depValue = answers[field.dependsOn.field];
        if (depValue !== field.dependsOn.value) return; // Field is hidden, skip validation
      }

      const val = answers[field.key];
      if (field.required && (val === undefined || val === '' || val === null || val === false)) {
        errors[field.key] = field.errorMessage || 'Este campo é obrigatório';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [schema, currentStepIndex, answers]);

  const nextStep = useCallback(() => {
    if (schema?.availability?.company_available === false) {
      setStatus('STEP_ACTIVE');
      return;
    }

    setStatus('VALIDATING');
    if (validateCurrentStep()) {
      track('wizard_step_completed', { step_index: currentStepIndex });
      if (schema && currentStepIndex < schema.schema.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
        setStatus('STEP_ACTIVE');
      } else {
        submitWizard();
      }
    } else {
      setStatus('STEP_ACTIVE');
    }
  }, [validateCurrentStep, schema, currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setValidationErrors({});
    }
  }, [currentStepIndex]);

  const buildPayload = useCallback(() => buildWizardPayload({
    answers,
    categoryId,
    preferredCompanyId,
    schema,
  }), [answers, categoryId, preferredCompanyId, schema]);

  const submitWizard = async () => {
    setStatus('SUBMITTING');
    setServerError(null);
    try {
      const payload = buildPayload();
      const result = await wizardApi.submitLead(payload);
      setLeadResult(result);
      setStatus('OTP_VERIFICATION');
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      // localStorage.removeItem(SESSION_KEY); // DO NOT REMOVE YET
      track('wizard_otp_viewed', { category_id: categoryId, lead_id: result.lead_id });
    } catch (error: any) {
      console.error(error);
      setServerError(error?.message || 'Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
      setStatus('ERROR');
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (!leadResult?.lead_id) return;
    setStatus('SUBMITTING');
    setServerError(null);
    try {
      const response = await wizardApi.verifyOtp(leadResult.lead_id, code);
      setDistributedCompanies(response.companies || []);
      setStatus('SUCCESS');
      localStorage.removeItem(SESSION_KEY); // ONLY CLEAR AFTER SUCCESS
      track('wizard_success', { 
        category_id: categoryId, 
        lead_id: leadResult.lead_id,
        distributed_count: response.companies?.length || 0
      });
    } catch (error: any) {
      setServerError(error?.message || 'Código inválido ou expirado.');
      setStatus('OTP_VERIFICATION');
    }
  };

  const handleResendOtp = async () => {
    if (!leadResult?.lead_id || resendCooldown > 0) return;
    setStatus('SUBMITTING');
    setServerError(null);
    try {
      await wizardApi.resendOtp(leadResult.lead_id);
      setLeadResult((prev) => (
        prev ? { ...prev, otp_sent_at: new Date().toISOString() } : prev
      ));
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setStatus('OTP_VERIFICATION');
      track('wizard_otp_resend_clicked', { lead_id: leadResult.lead_id });
    } catch (error: any) {
      setServerError('Erro ao reenviar código.');
      setStatus('OTP_VERIFICATION');
    }
  };

  const abandonWizard = useCallback(() => {
    track('wizard_abandoned', { step_index: currentStepIndex });
  }, [currentStepIndex]);

  return {
    status,
    schema,
    currentStepIndex,
    answers,
    validationErrors,
    serverError,
    leadResult,
    resendCooldown,
    distributedCompanies,
    setAnswer,
    nextStep,
    prevStep,
    handleVerifyOtp,
    handleResendOtp,
    abandonWizard,
    canGoBack: currentStepIndex > 0,
    isLastStep: schema ? currentStepIndex === schema.schema.steps.length - 1 : false,
    progress: schema ? ((currentStepIndex + 1) / schema.schema.steps.length) * 100 : 0
  };
};
