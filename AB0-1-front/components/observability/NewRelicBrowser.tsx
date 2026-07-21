'use client';

import Script from 'next/script';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import {
  hasAnalyticsConsent,
  onConsentChange,
} from '@/lib/analytics/consent';

const NEW_RELIC_LOADER_URL =
  'https://js-agent.newrelic.com/nr-loader-spa-current.min.js';

type NewRelicRuntime = {
  consent?: (accepted?: boolean) => void;
  setApplicationVersion?: (version: string) => void;
  setCustomAttribute?: (name: string, value: string) => void;
  setUserId?: (value: string | null, resetSession?: boolean) => void;
};

type NewRelicState = 'idle' | 'loading' | 'loaded' | 'revoked';

type NewRelicWindow = Window & {
  NREUM?: Record<string, unknown> & {
    info?: Record<string, unknown>;
    init?: Record<string, unknown>;
    loader_config?: Record<string, unknown>;
  };
  newrelic?: NewRelicRuntime;
  __avaliaSolarNewRelicState?: NewRelicState;
};

function getRuntimeWindow(): NewRelicWindow | null {
  return typeof window === 'undefined' ? null : (window as NewRelicWindow);
}

function hasRequiredConfiguration(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID &&
      process.env.NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID &&
      process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_LICENSE_KEY &&
      process.env.NEXT_PUBLIC_NEW_RELIC_TRUST_KEY &&
      process.env.NEXT_PUBLIC_NEW_RELIC_AGENT_ID,
  );
}

function configureNewRelicGlobals(runtimeWindow: NewRelicWindow): void {
  const applicationId = process.env.NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID as string;
  const licenseKey = process.env
    .NEXT_PUBLIC_NEW_RELIC_BROWSER_LICENSE_KEY as string;

  runtimeWindow.NREUM = runtimeWindow.NREUM || {};
  runtimeWindow.NREUM.init = {
    browser_consent_mode: { enabled: true },
    distributed_tracing: { enabled: true },
    privacy: { cookies_enabled: false },
    session_replay: { enabled: false },
    ajax: {
      capture_payloads: 'none',
      deny_list: ['bam.nr-data.net'],
    },
  };
  runtimeWindow.NREUM.loader_config = {
    accountID: process.env.NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID,
    trustKey: process.env.NEXT_PUBLIC_NEW_RELIC_TRUST_KEY,
    agentID: process.env.NEXT_PUBLIC_NEW_RELIC_AGENT_ID,
    licenseKey,
    applicationID: applicationId,
  };
  runtimeWindow.NREUM.info = {
    beacon: 'bam.nr-data.net',
    errorBeacon: 'bam.nr-data.net',
    licenseKey,
    applicationID: applicationId,
    sa: 1,
  };
}

async function pseudonymizeUserId(userId: string): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;

  const bytes = new TextEncoder().encode(`avalia-solar:new-relic:${userId}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export default function NewRelicBrowser() {
  const { user } = useAuth();
  const [shouldLoad, setShouldLoad] = useState(false);
  const [agentReady, setAgentReady] = useState(false);

  const revokeCollection = useCallback(() => {
    const runtimeWindow = getRuntimeWindow();
    if (!runtimeWindow) return;

    runtimeWindow.__avaliaSolarNewRelicState = 'revoked';
    runtimeWindow.newrelic?.setUserId?.(null, true);
    runtimeWindow.newrelic?.consent?.(false);
    setAgentReady(false);
    setShouldLoad(false);
  }, []);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_ENABLED !== 'true' ||
      !hasRequiredConfiguration()
    ) {
      return;
    }

    const runtimeWindow = getRuntimeWindow();
    if (!runtimeWindow) return;

    const enableCollection = () => {
      if (runtimeWindow.__avaliaSolarNewRelicState === 'revoked') return;

      if (!runtimeWindow.__avaliaSolarNewRelicState) {
        configureNewRelicGlobals(runtimeWindow);
        runtimeWindow.__avaliaSolarNewRelicState = 'loading';
        setShouldLoad(true);
        return;
      }

      if (runtimeWindow.__avaliaSolarNewRelicState === 'loaded') {
        runtimeWindow.newrelic?.consent?.(true);
      }
    };

    if (hasAnalyticsConsent()) enableCollection();

    return onConsentChange((consent) => {
      if (consent.analytics) {
        enableCollection();
      } else {
        revokeCollection();
      }
    });
  }, [revokeCollection]);

  const handleAgentLoad = useCallback(() => {
    const runtimeWindow = getRuntimeWindow();
    if (!runtimeWindow) return;

    if (runtimeWindow.__avaliaSolarNewRelicState === 'revoked') {
      runtimeWindow.newrelic?.consent?.(false);
      return;
    }

    runtimeWindow.__avaliaSolarNewRelicState = 'loaded';
    runtimeWindow.newrelic?.consent?.(true);
    setAgentReady(true);

    const environment = process.env.NEXT_PUBLIC_NEW_RELIC_ENVIRONMENT;
    const release = process.env.NEXT_PUBLIC_NEW_RELIC_RELEASE;

    if (environment) {
      runtimeWindow.newrelic?.setCustomAttribute?.('environment', environment);
    }
    if (release) {
      runtimeWindow.newrelic?.setApplicationVersion?.(release);
    }

  }, []);

  useEffect(() => {
    if (!agentReady) return;

    const runtimeWindow = getRuntimeWindow();
    if (!runtimeWindow?.newrelic) return;

    if (user?.id == null) {
      runtimeWindow.newrelic.setUserId?.(null);
      return;
    }

    let active = true;
    void pseudonymizeUserId(String(user.id)).then((pseudonymousId) => {
      if (
        active &&
        pseudonymousId &&
        runtimeWindow.__avaliaSolarNewRelicState === 'loaded'
      ) {
        runtimeWindow.newrelic?.setUserId?.(pseudonymousId);
      }
    });

    return () => {
      active = false;
    };
  }, [agentReady, user?.id]);

  if (!shouldLoad) return null;

  return (
    <Script
      id="new-relic-browser-agent"
      src={NEW_RELIC_LOADER_URL}
      strategy="afterInteractive"
      onLoad={handleAgentLoad}
    />
  );
}
