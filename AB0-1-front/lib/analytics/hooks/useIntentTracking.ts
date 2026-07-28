'use client';

import { useCallback, useEffect, useRef } from 'react';

import { track } from '../index';
import { getSessionId } from '../session';

export type IntentSignalType =
  // Sinais originais
  | 'hover_intent'
  | 'copy_clipboard'
  | 'form_hesitation'
  | 'scroll_pause'
  | 'tooltip_interaction'
  | 'faq_interaction'
  | 'search_query'
  | 'comparison_view'
  | 'comparison_usage'
  | 'calculator_usage'
  | 'product_search'
  | 'review_read'
  | 'review_deep_read'
  | 'phone_hover'
  | 'whatsapp_hover'
  | 'pricing_interaction'
  | 'document_download'
  // Tier 1 — Sinais de compra iminente
  | 'bill_value_entered'
  | 'financing_multiple_simulations'
  | 'contact_info_reveal'
  | 'quote_abandonment'
  | 'return_visit_to_company'
  | 'whatsapp_copy'
  | 'quote_wizard_step'
  | 'quote_submission'
  // Tier 2 — Pesquisa séria
  | 'comparison_third_added'
  | 'negative_review_deep_read'
  | 'certification_hover'
  | 'payback_period_interaction'
  | 'photo_gallery_5plus'
  | 'time_on_company_5min'
  | 'geo_filter_repeated'
  | 'tab_switching_pattern'
  // Tier 3 — Intenção emergente
  | 'roi_calculator_opened'
  | 'search_refinement_chain'
  | 'category_return'
  | 'exit_intent'
  | 'scroll_depth_80pct'
  | 'share_intent'
  // Tier 4 — Micro-comportamento
  | 'mobile_contact_tap'
  | 'idle_then_return'
  | 'social_proof_section_dwell'
  | 'faq_specific_read'
  // Blog
  | 'blog_exit_intent'
  | 'blog_share_intent'
  | 'blog_newsletter_intent'
  | 'blog_cta_click'
  | 'blog_toc_click'
  | 'blog_category_filter'
  | 'blog_search_performed'
  | 'blog_related_post_click'
  | 'blog_idle_return';

export type IntentSignalCategory =
  | 'micro_interaction'
  | 'financial_intent'
  | 'research_intent'
  | 'contact_intent'
  | 'blog_engagement';

type IntentMetadataPrimitive = string | number | boolean | null | undefined;
type IntentMetadataValue = IntentMetadataPrimitive | IntentMetadataPrimitive[] | IntentMetadataRecord;
type IntentMetadataRecord = {
  [key: string]: IntentMetadataValue;
};

export interface IntentSignalPayload {
  company_id: string | number;
  user_id?: string | number;
  anonymous_id?: string;
  session_id?: string;
  signal_type: IntentSignalType;
  signal_category: IntentSignalCategory;
  element_selector?: string;
  element_type?: string;
  page_path?: string;
  referrer_host?: string;
  duration_ms?: number;
  metadata?: IntentMetadataRecord;
  tracked_at?: string;
}

export interface IntentSignalOptions {
  signalCategory?: IntentSignalCategory;
  elementSelector?: string;
  metadata?: IntentMetadataRecord;
}

const getAnonymousId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  try {
    return (
      window.localStorage.getItem('as_anonymous_id') ||
      window.localStorage.getItem('ajs_anonymous_id') ||
      undefined
    );
  } catch {
    return undefined;
  }
};

const getReferrerHost = (): string | undefined => {
  if (typeof document === 'undefined' || !document.referrer) return undefined;

  try {
    const url = new URL(document.referrer);
    return url.hostname || undefined;
  } catch {
    return undefined;
  }
};

const buildBasePayload = (payload: IntentSignalPayload): IntentSignalPayload => {
  if (typeof window === 'undefined') return payload;

  return {
    ...payload,
    anonymous_id: payload.anonymous_id || getAnonymousId(),
    session_id: payload.session_id || getSessionId(),
    page_path: payload.page_path || window.location.pathname,
    referrer_host: payload.referrer_host || getReferrerHost(),
    tracked_at: payload.tracked_at || new Date().toISOString(),
    metadata: payload.metadata || {},
  };
};

/**
 * Envia sinal de intent para o backend dedicado e espelha o evento para PostHog/GA4.
 */
export const sendIntentSignal = (payload: IntentSignalPayload): void => {
  if (typeof window === 'undefined') return;

  const body = buildBasePayload(payload);
  const isNumericCompanyId = typeof body.company_id === 'number' || 
    (typeof body.company_id === 'string' && /^\d+$/.test(body.company_id));

  if (isNumericCompanyId) {
    void fetch('/api/v1/intent_signals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  }

  track(
    `intent_${body.signal_type}`,
    {
      ...body,
      intent_signal: true,
    },
    { critical: true }
  );
};

export const useHoverIntent = (
  companyId: string | number,
  elementType: string,
  thresholdMs = 800,
  options: IntentSignalOptions = {}
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);
  const firedRef = useRef(false);

  const onMouseEnter = useCallback(() => {
    startRef.current = Date.now();
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (firedRef.current) return;

      firedRef.current = true;
      sendIntentSignal({
        company_id: companyId,
        signal_type: elementType === 'whatsapp' ? 'whatsapp_hover' : 'hover_intent',
        signal_category: options.signalCategory || 'contact_intent',
        element_type: elementType,
        element_selector: options.elementSelector,
        duration_ms: Date.now() - startRef.current,
        metadata: options.metadata,
      });
    }, thresholdMs);
  }, [companyId, elementType, options.elementSelector, options.metadata, options.signalCategory, thresholdMs]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { onMouseEnter, onMouseLeave };
};

export const useCopyIntent = (
  companyId: string | number,
  elementType: string,
  options: IntentSignalOptions = {}
) => {
  const onCopy = useCallback(
    (event: { stopPropagation?: () => void }) => {
      event.stopPropagation?.();
      const copiedText = window.getSelection?.()?.toString()?.trim() || '';

      sendIntentSignal({
        company_id: companyId,
        signal_type: 'copy_clipboard',
        signal_category: options.signalCategory || 'contact_intent',
        element_type: elementType,
        element_selector: options.elementSelector,
        metadata: {
          ...(options.metadata || {}),
          text_length: copiedText.length,
          text_type: detectTextType(copiedText),
        },
      });
    },
    [companyId, elementType, options.elementSelector, options.metadata, options.signalCategory]
  );

  return { onCopy };
};

export const useScrollPause = (
  companyId: string | number,
  thresholdMs = 3000,
  options: IntentSignalOptions = {}
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!companyId) return undefined;

    const handleScroll = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        sendIntentSignal({
          company_id: companyId,
          signal_type: 'scroll_pause',
          signal_category: options.signalCategory || 'research_intent',
          element_type: 'content_section',
          element_selector: options.elementSelector,
          duration_ms: thresholdMs,
          metadata: {
            ...(options.metadata || {}),
            scroll_percent: getScrollPercent(),
            viewport_section: getViewportSection(),
          },
        });
      }, thresholdMs);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [companyId, options.elementSelector, options.metadata, options.signalCategory, thresholdMs]);
};

export const useFormHesitation = (
  companyId: string | number,
  options: IntentSignalOptions = {}
) => {
  const fieldHistory = useRef<Map<string, number>>(new Map());

  const trackFieldChange = useCallback(
    (fieldName: string, value: string) => {
      const count = fieldHistory.current.get(fieldName) || 0;
      fieldHistory.current.set(fieldName, count + 1);

      if (count >= 2 && value.length === 0) {
        sendIntentSignal({
          company_id: companyId,
          signal_type: 'form_hesitation',
          signal_category: options.signalCategory || 'contact_intent',
          element_type: 'form_field',
          element_selector: options.elementSelector,
          metadata: {
            ...(options.metadata || {}),
            field_name: fieldName,
            change_count: count + 1,
          },
        });
      }
    },
    [companyId, options.elementSelector, options.metadata, options.signalCategory]
  );

  const resetFieldTracking = useCallback(() => {
    fieldHistory.current.clear();
  }, []);

  return { trackFieldChange, resetFieldTracking };
};

export const useCalculatorInput = (companyId: string | number) => {
  const trackSimulation = useCallback(
    (loanValue: number, installments: number) => {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'calculator_usage',
        signal_category: 'financial_intent',
        element_type: 'calculator',
        metadata: {
          loan_value: Math.round(loanValue),
          installments: Math.round(installments),
        },
      });
    },
    [companyId]
  );

  return { trackSimulation };
};

export const useImageGalleryWatch = (companyId: string | number) => {
  const trackGalleryDwell = useCallback(
    (timeMs: number, photoIndex: number) => {
      if (timeMs <= 5000) return;

      sendIntentSignal({
        company_id: companyId,
        signal_type: 'comparison_view',
        signal_category: 'research_intent',
        element_type: 'image_gallery',
        duration_ms: Math.round(timeMs),
        metadata: {
          photo_index: Math.round(photoIndex),
        },
      });
    },
    [companyId]
  );

  return { trackGalleryDwell };
};

export const useFaqExpand = (companyId: string | number) => {
  const trackQuestion = useCallback(
    (
      questionId: string | number,
      interaction: 'expand' | 'vote_up' | 'vote_down' = 'expand',
      metadata: IntentMetadataRecord = {}
    ) => {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'faq_interaction',
        signal_category: 'research_intent',
        element_type: 'faq',
        metadata: {
          faq_id: questionId,
          interaction,
          ...metadata,
        },
      });
    },
    [companyId]
  );

  return { trackQuestion };
};

export const useSearchIntent = (
  companyId: string | number,
  options: IntentSignalOptions = {}
) => {
  const lastQueryRef = useRef<string>('');

  const trackSearchQuery = useCallback(
    (query: string, metadata: IntentMetadataRecord = {}) => {
      const normalizedQuery = query.trim();
      if (normalizedQuery.length < 2) return;

      const dedupeKey = normalizedQuery.toLowerCase();
      if (lastQueryRef.current === dedupeKey) return;
      lastQueryRef.current = dedupeKey;

      sendIntentSignal({
        company_id: companyId,
        signal_type: 'search_query',
        signal_category: options.signalCategory || 'research_intent',
        element_type: 'search',
        element_selector: options.elementSelector,
        metadata: {
          ...(options.metadata || {}),
          query_term: normalizedQuery.slice(0, 120),
          ...metadata,
        },
      });
    },
    [companyId, options.elementSelector, options.metadata, options.signalCategory]
  );

  return { trackSearchQuery };
};

export const useComparisonIntent = (
  companyId: string | number,
  options: IntentSignalOptions = {}
) => {
  const trackComparisonUsage = useCallback(
    (
      action: 'add' | 'remove' | 'quote_click' | 'view',
      metadata: IntentMetadataRecord = {}
    ) => {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'comparison_usage',
        signal_category: options.signalCategory || 'research_intent',
        element_type: 'comparison',
        element_selector: options.elementSelector,
        metadata: {
          ...(options.metadata || {}),
          action,
          ...metadata,
        },
      });
    },
    [companyId, options.elementSelector, options.metadata, options.signalCategory]
  );

  return { trackComparisonUsage };
};

export const detectTextType = (text: string): string => {
  const trimmedText = text.trim();

  if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(trimmedText) || /^\d{14}$/.test(trimmedText.replace(/\D/g, ''))) {
    return 'cnpj';
  }
  if (/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(trimmedText) || /^\d{10,11}$/.test(trimmedText.replace(/\D/g, ''))) {
    return 'phone';
  }
  if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(trimmedText)) {
    return 'email';
  }
  if (/^https?:\/\//.test(trimmedText)) {
    return 'url';
  }

  return 'other';
};

const getScrollPercent = (): number => {
  const scrollableHeight = document.body.scrollHeight - window.innerHeight;
  if (scrollableHeight <= 0) return 0;

  return Math.max(0, Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100)));
};

export const getViewportSection = (): string => {
  const scrollPercent = getScrollPercent();

  if (scrollPercent <= 25) return 'top';
  if (scrollPercent <= 50) return 'upper_middle';
  if (scrollPercent <= 75) return 'lower_middle';
  return 'bottom';
};

// ---------------------------------------------------------------------------
// NOVOS HOOKS — Tier 1 a 4
// ---------------------------------------------------------------------------

/**
 * Detecta intenção de saída (mouse indo para o topo da janela no desktop).
 * Dispara `exit_intent` uma única vez por sessão.
 */
export const useExitIntent = (
  companyId: string | number,
  options: IntentSignalOptions = {}
) => {
  const firedRef = useRef(false);

  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (firedRef.current) return;
      if (e.clientY <= 20) {
        firedRef.current = true;
        sendIntentSignal({
          company_id: companyId,
          signal_type: 'exit_intent',
          signal_category: options.signalCategory || 'micro_interaction',
          element_type: 'page',
          element_selector: options.elementSelector,
          metadata: {
            ...(options.metadata || {}),
            scroll_percent: getScrollPercent(),
            viewport_section: getViewportSection(),
          },
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [companyId, options.elementSelector, options.metadata, options.signalCategory]);
};

/**
 * Detecta retorno a uma empresa já visitada anteriormente (via localStorage).
 * Dispara `return_visit_to_company` na montagem se for visita de retorno.
 */
export const useReturnVisit = (companyId: string | number) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !companyId) return;

    const key = `avalia_visited_company_${companyId}`;
    const lastVisit = localStorage.getItem(key);
    const now = Date.now();

    if (lastVisit) {
      const diffMinutes = Math.floor((now - Number(lastVisit)) / 60000);
      // Só dispara se a visita anterior foi há mais de 5 minutos (não hot-reload)
      if (diffMinutes >= 5) {
        sendIntentSignal({
          company_id: companyId,
          signal_type: 'return_visit_to_company',
          signal_category: 'research_intent',
          element_type: 'page',
          metadata: {
            minutes_since_last_visit: diffMinutes,
            visit_count: Number(localStorage.getItem(`${key}_count`) || 1) + 1,
          },
        });
        localStorage.setItem(`${key}_count`, String(Number(localStorage.getItem(`${key}_count`) || 1) + 1));
      }
    }

    localStorage.setItem(key, String(now));
  }, [companyId]);
};

/**
 * Dispara `time_on_company_5min` após 5 minutos contínuos na página.
 */
export const useTimeOnPageMilestone = (
  companyId: string | number,
  thresholdMs = 300_000,
  options: IntentSignalOptions = {}
) => {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!companyId) return;

    const timer = setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'time_on_company_5min',
        signal_category: options.signalCategory || 'research_intent',
        element_type: 'page',
        duration_ms: thresholdMs,
        metadata: options.metadata,
      });
    }, thresholdMs);

    return () => clearTimeout(timer);
  }, [companyId, options.metadata, options.signalCategory, thresholdMs]);
};

/**
 * Dispara `scroll_depth_80pct` quando o usuário atinge 80% de scroll.
 */
export const useScrollDepthMilestone = (
  companyId: string | number,
  options: IntentSignalOptions = {}
) => {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!companyId) return;

    const handleScroll = () => {
      if (firedRef.current) return;
      const pct = getScrollPercent();
      if (pct >= 80) {
        firedRef.current = true;
        sendIntentSignal({
          company_id: companyId,
          signal_type: 'scroll_depth_80pct',
          signal_category: options.signalCategory || 'research_intent',
          element_type: 'page',
          metadata: {
            ...(options.metadata || {}),
            scroll_percent: pct,
          },
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [companyId, options.metadata, options.signalCategory]);
};

/**
 * Dispara `idle_then_return` quando o usuário fica inativo por thresholdMs
 * e depois volta a interagir com a página.
 */
export const useIdleReturn = (
  companyId: string | number,
  thresholdMs = 30_000,
  options: IntentSignalOptions = {}
) => {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);

  useEffect(() => {
    if (!companyId) return;

    const resetIdle = () => {
      if (isIdleRef.current) {
        isIdleRef.current = false;
        sendIntentSignal({
          company_id: companyId,
          signal_type: 'idle_then_return',
          signal_category: options.signalCategory || 'research_intent',
          element_type: 'page',
          duration_ms: thresholdMs,
          metadata: options.metadata,
        });
      }

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        isIdleRef.current = true;
      }, thresholdMs);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'pointerdown'];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [companyId, options.metadata, options.signalCategory, thresholdMs]);
};

/**
 * Detecta intenção de compartilhamento via cópia de URL.
 * Dispara `share_intent` quando o usuário copia a URL da página.
 */
export const useShareIntent = (
  companyId: string | number,
  options: IntentSignalOptions = {}
) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !companyId) return;

    const handleCopy = () => {
      const selection = window.getSelection?.()?.toString()?.trim() || '';
      const isUrl = /^https?:\/\//.test(selection) || selection === '';

      // Dispara se copiou URL ou se não havia seleção (Ctrl+A, Ctrl+C = cópia de URL)
      if (isUrl || selection.length === 0) {
        sendIntentSignal({
          company_id: companyId,
          signal_type: 'share_intent',
          signal_category: options.signalCategory || 'research_intent',
          element_type: 'clipboard',
          metadata: {
            ...(options.metadata || {}),
            copied_type: selection.length === 0 ? 'page_url' : 'url_text',
          },
        });
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [companyId, options.metadata, options.signalCategory]);
};

/**
 * Rastreia toque em links de contato no mobile (tel:, wa.me, etc.).
 * Dispara `mobile_contact_tap` com o tipo de contato.
 */
export const useMobileContactTap = (companyId: string | number) => {
  const trackTap = useCallback(
    (contactType: 'phone' | 'whatsapp' | 'email', value?: string) => {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'mobile_contact_tap',
        signal_category: 'contact_intent',
        element_type: `mobile_${contactType}`,
        metadata: {
          contact_type: contactType,
          has_value: Boolean(value),
        },
      });
    },
    [companyId]
  );

  return { trackTap };
};

/**
 * Rastreia quando o usuário entra com o valor da conta de luz no wizard.
 * Dispara `bill_value_entered` — sinal de alta intenção de compra.
 */
export const useBillValueIntent = (companyId: string | number) => {
  const lastValueRef = useRef<string>('');
  const firedRef = useRef(false);

  const trackBillValue = useCallback(
    (value: string) => {
      const normalized = value.replace(/\D/g, '');
      if (normalized.length < 2 || normalized === lastValueRef.current) return;
      lastValueRef.current = normalized;

      const numericValue = Number(normalized);
      if (!Number.isFinite(numericValue) || numericValue <= 0) return;

      // Só dispara na primeira vez que há um valor válido (não a cada keystroke)
      if (!firedRef.current) {
        firedRef.current = true;
        sendIntentSignal({
          company_id: companyId,
          signal_type: 'bill_value_entered',
          signal_category: 'financial_intent',
          element_type: 'bill_value_input',
          metadata: {
            bill_value_band: numericValue >= 1000 ? 'high' : numericValue >= 400 ? 'medium' : 'low',
          },
        });
      }
    },
    [companyId]
  );

  return { trackBillValue };
};

/**
 * Rastreia cada etapa do wizard de orçamento.
 * Dispara `quote_wizard_step` a cada avanço de etapa.
 */
export const useQuoteWizardTracking = (companyId: string | number) => {
  const stepStartRef = useRef<number>(Date.now());
  const openedAtRef = useRef<number>(Date.now());

  const trackStep = useCallback(
    (stepNumber: number, totalSteps: number, metadata: IntentMetadataRecord = {}) => {
      const durationMs = Date.now() - stepStartRef.current;
      stepStartRef.current = Date.now();

      sendIntentSignal({
        company_id: companyId,
        signal_type: 'quote_wizard_step',
        signal_category: 'financial_intent',
        element_type: 'quote_wizard',
        duration_ms: durationMs,
        metadata: {
          step_number: stepNumber,
          total_steps: totalSteps,
          progress_pct: Math.round((stepNumber / totalSteps) * 100),
          ...metadata,
        },
      });
    },
    [companyId]
  );

  const trackAbandonment = useCallback(
    (currentStep: number, totalSteps: number) => {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'quote_abandonment',
        signal_category: 'financial_intent',
        element_type: 'quote_wizard',
        duration_ms: Date.now() - openedAtRef.current,
        metadata: {
          abandoned_at_step: currentStep,
          total_steps: totalSteps,
          progress_pct: Math.round((currentStep / totalSteps) * 100),
        },
      });
    },
    [companyId]
  );

  const trackSubmission = useCallback(
    (success: boolean, leadId?: number | null) => {
      sendIntentSignal({
        company_id: companyId,
        signal_type: 'quote_submission',
        signal_category: 'financial_intent',
        element_type: 'quote_wizard',
        duration_ms: Date.now() - openedAtRef.current,
        metadata: {
          submission_status: success ? 'success' : 'error',
          has_lead_id: Boolean(leadId),
        },
      });
    },
    [companyId]
  );

  const resetTracking = useCallback(() => {
    stepStartRef.current = Date.now();
    openedAtRef.current = Date.now();
  }, []);

  return { trackStep, trackAbandonment, trackSubmission, resetTracking };
};

/**
 * Rastreia intenção no blog (artigos e listagem).
 * Dispara sinais de blog_exit_intent, blog_share_intent, blog_idle_return.
 */
export const useBlogIntentTracking = (
  articleId?: string | number,
  options: IntentSignalOptions = {}
) => {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);
  const exitFiredRef = useRef(false);
  const shareFiredRef = useRef(false);

  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    // Exit intent (desktop only)
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile || exitFiredRef.current) return;
      if (e.clientY <= 20) {
        exitFiredRef.current = true;
        sendIntentSignal({
          company_id: articleId ?? 'blog',
          signal_type: 'blog_exit_intent',
          signal_category: 'blog_engagement',
          element_type: 'page',
          metadata: {
            ...(options.metadata || {}),
            scroll_percent: getScrollPercent(),
          },
        });
      }
    };

    // Share intent via copy
    const handleCopy = () => {
      if (shareFiredRef.current) return;
      const selection = window.getSelection?.()?.toString()?.trim() || '';
      if (!selection || /^https?:\/\//.test(selection)) {
        shareFiredRef.current = true;
        sendIntentSignal({
          company_id: articleId ?? 'blog',
          signal_type: 'blog_share_intent',
          signal_category: 'blog_engagement',
          element_type: 'clipboard',
          metadata: options.metadata,
        });
      }
    };

    // Idle then return
    const resetIdle = () => {
      if (isIdleRef.current) {
        isIdleRef.current = false;
        sendIntentSignal({
          company_id: articleId ?? 'blog',
          signal_type: 'blog_idle_return',
          signal_category: 'blog_engagement',
          element_type: 'page',
          metadata: options.metadata,
        });
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => { isIdleRef.current = true; }, 45_000);
    };

    const idleEvents = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('copy', handleCopy);
    idleEvents.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('copy', handleCopy);
      idleEvents.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [articleId, options.metadata]);

  const trackNewsletterIntent = useCallback(
    (action: 'hover' | 'open' | 'submit' | 'dismiss') => {
      sendIntentSignal({
        company_id: articleId ?? 'blog',
        signal_type: 'blog_newsletter_intent',
        signal_category: 'blog_engagement',
        element_type: 'newsletter_popup',
        metadata: { action, article_id: articleId },
      });
    },
    [articleId]
  );

  const trackCtaClick = useCallback(
    (ctaLabel: string, ctaHref?: string) => {
      sendIntentSignal({
        company_id: articleId ?? 'blog',
        signal_type: 'blog_cta_click',
        signal_category: 'blog_engagement',
        element_type: 'article_cta',
        metadata: { cta_label: ctaLabel, cta_href: ctaHref, article_id: articleId },
      });
    },
    [articleId]
  );

  const trackTocClick = useCallback(
    (headingText: string, headingId?: string) => {
      sendIntentSignal({
        company_id: articleId ?? 'blog',
        signal_type: 'blog_toc_click',
        signal_category: 'blog_engagement',
        element_type: 'table_of_contents',
        metadata: { heading_text: headingText.slice(0, 80), heading_id: headingId, article_id: articleId },
      });
    },
    [articleId]
  );

  const trackCategoryFilter = useCallback(
    (categorySlug: string, categoryName?: string) => {
      sendIntentSignal({
        company_id: articleId ?? 'blog',
        signal_type: 'blog_category_filter',
        signal_category: 'blog_engagement',
        element_type: 'category_filter',
        metadata: { category_slug: categorySlug, category_name: categoryName },
      });
    },
    [articleId]
  );

  const trackRelatedPostClick = useCallback(
    (targetSlug: string, targetTitle?: string, position?: number) => {
      sendIntentSignal({
        company_id: articleId ?? 'blog',
        signal_type: 'blog_related_post_click',
        signal_category: 'blog_engagement',
        element_type: 'related_posts',
        metadata: { target_slug: targetSlug, target_title: targetTitle?.slice(0, 80), position, article_id: articleId },
      });
    },
    [articleId]
  );

  return {
    trackNewsletterIntent,
    trackCtaClick,
    trackTocClick,
    trackCategoryFilter,
    trackRelatedPostClick,
  };
};

/**
 * Tracks if an element stays visible on screen for a specified amount of time.
 * Dispares the intent signal only if the user dwells on it continuously without scrolling away.
 */
export const useIntersectionDwellTime = (
  companyId: string | number,
  signalType: IntentSignalType,
  thresholdMs = 8000,
  options: IntentSignalOptions = {}
) => {
  const targetRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!companyId || !targetRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (firedRef.current || timerRef.current) return;
          
          timerRef.current = setTimeout(() => {
            if (firedRef.current) return;
            firedRef.current = true;
            
            sendIntentSignal({
              company_id: companyId,
              signal_type: signalType,
              signal_category: options.signalCategory || 'research_intent',
              element_type: 'content_section',
              element_selector: options.elementSelector,
              duration_ms: thresholdMs,
              metadata: options.metadata,
            });
          }, thresholdMs);
        } else {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: 0.5 } // Require 50% visibility to start dwell timer
    );

    observer.observe(targetRef.current);

    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [companyId, options.elementSelector, options.metadata, options.signalCategory, signalType, thresholdMs]);

  return targetRef;
};

