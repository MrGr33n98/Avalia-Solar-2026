'use client';

import { useCallback, useEffect, useRef } from 'react';

import { track } from '../index';
import { getSessionId } from '../session';

export type IntentSignalType =
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
  | 'document_download';

export type IntentSignalCategory =
  | 'micro_interaction'
  | 'financial_intent'
  | 'research_intent'
  | 'contact_intent';

type IntentMetadataPrimitive = string | number | boolean | null;
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

  void fetch('/api/v1/intent_signals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});

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
