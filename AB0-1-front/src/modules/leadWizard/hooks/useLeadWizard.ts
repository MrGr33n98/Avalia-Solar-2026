import { useState, useEffect, useCallback } from 'react';
import { WizardSchema, WizardStateStatus, WizardPayload, LeadCoreFields, FieldSchema } from '../types/wizard.types';
import { wizardApi } from '../api/wizard.api';
import { track } from '@/lib/analytics';

const SESSION_KEY = 'leadWizardSession';
const CORE_KEYS = ['full_name', 'email', 'phone', 'zipcode', 'city', 'state', 'consent'];

export const useLeadWizard = (categoryId: number, preferredCompanyId?: number) => {
  const [status, setStatus] = useState<WizardStateStatus>('IDLE');
  const [schema, setSchema] = useState<WizardSchema | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [leadResult, setLeadResult] = useState<{ lead_id: number; otp_sent_at: string } | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      setStatus('LOADING_SCHEMA');
      try {
        const fetchedSchema = await wizardApi.resolveSchema(categoryId, preferredCompanyId);
        setSchema(fetchedSchema);
        
        // Restore session if available and matches category
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed.categoryId === categoryId) {
            setAnswers(parsed.answers || {});
            setCurrentStepIndex(Math.min(parsed.currentStepIndex || 0, fetchedSchema.schema.steps.length - 1));
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
        
        setStatus('STEP_ACTIVE');
        track('wizard_started', { category_id: categoryId, template_key: fetchedSchema.template_key });
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
    if (status === 'STEP_ACTIVE' && Object.keys(answers).length > 0) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        categoryId,
        currentStepIndex,
        answers,
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [answers, currentStepIndex, status, categoryId]);

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

  const buildPayload = useCallback((): WizardPayload => {
    const coreFields: any = { consent: false, category_id: categoryId, preferred_company_id: preferredCompanyId || null };
    const dynamicFields: any = {};

    Object.entries(answers).forEach(([key, value]) => {
      if (CORE_KEYS.includes(key)) {
        coreFields[key] = value;
      } else {
        dynamicFields[key] = value;
      }
    });

    return {
      lead: coreFields as LeadCoreFields,
      wizard_answers: dynamicFields,
      // utm and attribution could be grabbed from a global context/cookie here
    };
  }, [answers, categoryId, preferredCompanyId]);

  const submitWizard = async () => {
    setStatus('SUBMITTING');
    setServerError(null);
    try {
      const payload = buildPayload();
      const result = await wizardApi.submitLead(payload);
      setLeadResult(result);
      setStatus('SUCCESS');
      localStorage.removeItem(SESSION_KEY);
      track('wizard_submitted', { category_id: categoryId });
    } catch (error: any) {
      console.error(error);
      setServerError(error?.message || 'Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
      setStatus('ERROR');
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
    setAnswer,
    nextStep,
    prevStep,
    abandonWizard,
    canGoBack: currentStepIndex > 0,
    isLastStep: schema ? currentStepIndex === schema.schema.steps.length - 1 : false,
    progress: schema ? ((currentStepIndex + 1) / schema.schema.steps.length) * 100 : 0
  };
};
