'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Cookie, ShieldCheck, Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getConsent, optIn, optOut, setConsent } from '@/lib/analytics/consent';
import { cn } from '@/lib/utils';

const CONSENT_KEY = 'avaliasolar_consent';

function hasDecision(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(CONSENT_KEY));
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (!consent) {
      const timer = window.setTimeout(() => setShowBanner(true), 800);
      return () => window.clearTimeout(timer);
    }

    setAnalyticsEnabled(consent.analytics);
    setMarketingEnabled(consent.marketing);
  }, []);

  const persistDecision = (nextAnalytics: boolean, nextMarketing: boolean) => {
    setConsent({ analytics: nextAnalytics, marketing: nextMarketing });
    setAnalyticsEnabled(nextAnalytics);
    setMarketingEnabled(nextMarketing);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    optIn();
    setAnalyticsEnabled(true);
    setMarketingEnabled(true);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleRejectNonEssential = () => {
    optOut();
    setAnalyticsEnabled(false);
    setMarketingEnabled(false);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const bannerVisible = showBanner && !hasDecision();

  const preferenceSummary = useMemo(
    () => [
      { key: 'analytics', label: 'Analytics', enabled: analyticsEnabled },
      { key: 'marketing', label: 'Marketing', enabled: marketingEnabled },
    ],
    [analyticsEnabled, marketingEnabled]
  );

  if (!bannerVisible && !showPreferences) return null;

  return (
    <>
      {bannerVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-[9990] border-t border-white/10 bg-slate-950 text-white shadow-[0_-18px_40px_rgba(2,6,23,0.35)]">
          <div className="mx-auto flex max-h-[70vh] max-w-7xl flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:px-8 lg:py-5">
            <div className="flex min-w-0 items-start gap-3 lg:flex-1">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                <Cookie className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-white">
                  Cookies & Privacidade
                </p>
                <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-200">
                  Utilizamos cookies para funcionalidades essenciais, análise de uso e melhoria da
                  experiência. Você pode aceitar, negar cookies não essenciais ou gerenciar
                  preferências. Consulte nossa{' '}
                  <Link href="/privacy" className="underline decoration-white/30 underline-offset-4 hover:text-blue-200">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:w-[720px] lg:max-w-[48vw]">
              <Button
                type="button"
                onClick={handleAcceptAll}
                className="h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-slate-100"
              >
                Aceitar
              </Button>
              <Button
                type="button"
                onClick={handleRejectNonEssential}
                className="h-10 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                Negar não essencial
              </Button>
              <Button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="h-10 rounded-md border border-white/15 bg-transparent px-4 text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                Gerenciar preferências
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setShowBanner(false)}
              aria-label="Fechar banner de cookies"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:static lg:self-start"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {showPreferences ? (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <Settings2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Gerenciar preferências</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Essenciais permanecem ativos. Você escolhe o que liberar para analytics e marketing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                aria-label="Fechar preferências"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {preferenceSummary.map((item) => (
                <label
                  key={item.key}
                  className={cn(
                    'flex items-center justify-between gap-4 rounded-md border px-4 py-3',
                    item.enabled ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white'
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      {item.label}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.key === 'analytics'
                        ? 'Ajuda a entender o uso do site.'
                        : 'Permite personalização e campanhas relevantes.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => {
                      if (item.key === 'analytics') {
                        setAnalyticsEnabled((current) => !current);
                      } else {
                        setMarketingEnabled((current) => !current);
                      }
                    }}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label={`Alternar ${item.label}`}
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={() => persistDecision(analyticsEnabled, marketingEnabled)}
                className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Salvar preferências
              </Button>
              <Button
                type="button"
                onClick={() => persistDecision(true, true)}
                className="h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Aceitar tudo
              </Button>
              <Button
                type="button"
                onClick={handleRejectNonEssential}
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Recusar não essencial
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
