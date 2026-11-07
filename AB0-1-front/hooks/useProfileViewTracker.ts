'use client';

import { useEffect, useRef } from 'react';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';

const SESSION_KEY_PREFIX = 'cpv_tracked_'; // company_profile_view_tracked_<companyId>
const MIN_VISIBLE_MS = 3000;

/**
 * Rastreia visualizações únicas do perfil público de uma empresa.
 *
 * Regras:
 *  - Dispara somente quando a aba está visível (Page Visibility API)
 *  - Aguarda MIN_VISIBLE_MS (3s) de permanência antes de enviar
 *  - Guard de sessão: não reenvio na mesma sessão de navegação (sessionStorage)
 *  - O servidor faz a deduplicação final por fingerprint em 24h
 */
export function useProfileViewTracker(companyId: number | string | undefined) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!companyId) return;

    const sessionKey = `${SESSION_KEY_PREFIX}${companyId}`;

    // Guard: já rastreado nesta sessão de navegação
    if (sessionStorage.getItem(sessionKey)) return;

    function sendTrackRequest() {
      if (trackedRef.current || !companyId) return;
      trackedRef.current = true;
      sessionStorage.setItem(sessionKey, '1');

      void fetch(`/api/v1/companies/${companyId}/track_view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).then(async (response) => {
        if (!response.ok) return;
        const result: { tracked?: boolean } = await response.json();
        // Only a server-confirmed, deduplicated profile view becomes a
        // Buyer Intent signal; impressions rejected as bots/self-view do not.
        if (result.tracked === true) {
          sendIntentSignal({
            company_id: companyId,
            signal_type: 'profile_view',
            signal_category: 'research_intent',
            element_type: 'profile_page',
            metadata: { source: 'verified_profile_view' },
          });
        }
      }).catch(() => {
        // Tracking failures never block the public profile experience.
      });
    }

    function scheduleTracking() {
      if (document.visibilityState !== 'visible') return;
      if (timerRef.current) return;

      timerRef.current = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          sendTrackRequest();
        }
        timerRef.current = null;
      }, MIN_VISIBLE_MS);
    }

    function cancelTracking() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        scheduleTracking();
      } else {
        cancelTracking();
      }
    }

    // Inicia se a aba já estiver visível
    scheduleTracking();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelTracking();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [companyId]);
}
