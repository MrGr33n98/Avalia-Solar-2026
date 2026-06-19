'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useComparison } from '@/hooks/useComparison';
import { track } from '@/lib/analytics';
import IdentityBridgeModal from '@/components/ui/IdentityBridgeModal';
import {
  SIGNUP_GATE_EVENT,
  buildReturnTo,
  isAuthRoute,
  type SignupGateDetail,
  type SignupGateSource,
} from '@/lib/signup-gate';

interface SignupGateConfig {
  source: SignupGateSource;
  returnTo: string;
  title: string;
  description: string;
  comparisonCount?: number;
}

const DEFAULT_COPY: Record<SignupGateSource, Pick<SignupGateConfig, 'title' | 'description'>> = {
  comparison_cta: {
    title: 'Crie sua conta para continuar comparando',
    description:
      'Desbloqueie a análise completa, salve sua shortlist e volte exatamente para onde parou.',
  },
  compare_page: {
    title: 'Crie sua conta para ver a comparação completa',
    description:
      'Libere a visão lado a lado, mantenha suas empresas salvas e siga sua pesquisa sem perder o contexto.',
  },
  review_tab: {
    title: 'Quer ver todas as avaliações?',
    description:
      'Crie sua conta para acessar o histórico completo de performance, elogios e pontos de atenção.',
  },
  contact_reveal: {
    title: 'Crie sua conta para ver os contatos',
    description: 'Libere telefone, e-mail e outros canais de contato desta empresa.',
  },
  quote_wizard: {
    title: 'Quer salvar seu orçamento?',
    description:
      'Voce pode preencher a solicitacao agora. Criar conta ajuda a acompanhar respostas e historico depois.',
  },
  quick_lead: {
    title: 'Quer acompanhar sua solicitacao?',
    description:
      'O pedido pode seguir pelo formulario. A conta fica para salvar dados e acompanhar os retornos.',
  },
  dynamic_lead_wizard: {
    title: 'Quer acompanhar seu orçamento?',
    description:
      'Voce pode preencher o formulario agora e usar a conta depois para acompanhar empresas e propostas.',
  },
  direct_chat: {
    title: 'Crie sua conta para falar com a empresa',
    description:
      'Entre como comprador para iniciar o chat direto e manter o histórico da conversa.',
  },
  search_results: {
    title: 'Crie sua conta para falar com empresas',
    description: 'Libere os canais de contato e volte exatamente para a empresa que você escolheu.',
  },
  comparison_reveal: {
    title: 'Crie sua conta para comparar melhor',
    description:
      'Desbloqueie detalhes da comparação e continue sua pesquisa sem perder o contexto.',
  },
  manual: {
    title: 'Crie sua conta para continuar',
    description: 'Desbloqueie mais detalhes e volte exatamente para o ponto em que estava.',
  },
};

const DISMISSED_SIGNUP_GATES_KEY = 'avalia_solar_dismissed_signup_gates_v1';

function signupGateKey(config: Pick<SignupGateConfig, 'source' | 'returnTo'>): string {
  const path = (config.returnTo || '/').split('?')[0] || '/';
  return `${config.source}:${path}`;
}

function readDismissedSignupGates(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const rawValue = window.sessionStorage.getItem(DISMISSED_SIGNUP_GATES_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function wasSignupGateDismissed(config: SignupGateConfig): boolean {
  return readDismissedSignupGates().includes(signupGateKey(config));
}

function rememberSignupGateDismissed(config: SignupGateConfig): void {
  if (typeof window === 'undefined') return;

  try {
    const dismissedGates = new Set(readDismissedSignupGates());
    dismissedGates.add(signupGateKey(config));
    window.sessionStorage.setItem(
      DISMISSED_SIGNUP_GATES_KEY,
      JSON.stringify(Array.from(dismissedGates).slice(-50))
    );
  } catch {
    // Nao bloqueia a navegacao se storage estiver indisponivel.
  }
}

export default function SignupGateModalHost() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { count, isLoading: comparisonLoading } = useComparison();
  const [config, setConfig] = useState<SignupGateConfig | null>(null);

  const currentReturnTo = useMemo(
    () => buildReturnTo(pathname, searchParams?.toString() || null),
    [pathname, searchParams]
  );

  const suppressed = isAuthRoute(pathname);

  const resolveConfig = useCallback(
    (detail: SignupGateDetail): SignupGateConfig | null => {
      if (suppressed || authLoading || isAuthenticated) return null;

      const copy = DEFAULT_COPY[detail.source] || DEFAULT_COPY.manual;

      const nextConfig = {
        source: detail.source,
        returnTo: detail.returnTo || currentReturnTo,
        title: detail.title || copy.title,
        description: detail.description || copy.description,
        comparisonCount: detail.comparisonCount,
      };

      return wasSignupGateDismissed(nextConfig) ? null : nextConfig;
    },
    [authLoading, currentReturnTo, isAuthenticated, suppressed]
  );

  const showGate = useCallback(
    (detail: SignupGateDetail) => {
      const nextConfig = resolveConfig(detail);
      if (!nextConfig) return;
      if (config) return;

      setConfig(nextConfig);
      track('signup_gate_opened', {
        source: nextConfig.source,
        return_to: nextConfig.returnTo,
        pathname,
        comparison_count: nextConfig.comparisonCount ?? count,
      });
    },
    [config, count, pathname, resolveConfig]
  );

  useEffect(() => {
    if (isAuthenticated && config) {
      setConfig(null);
    }
  }, [config, isAuthenticated]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<SignupGateDetail>).detail;
      if (!detail) return;
      showGate(detail);
    };

    window.addEventListener(SIGNUP_GATE_EVENT, handleOpen as EventListener);
    return () => window.removeEventListener(SIGNUP_GATE_EVENT, handleOpen as EventListener);
  }, [showGate]);

  useEffect(() => {
    if (suppressed || authLoading || comparisonLoading || isAuthenticated) return;
    if (pathname !== '/compare' || count < 2) return;
    if (config) return;

    const timer = window.setTimeout(() => {
      if (suppressed || authLoading || comparisonLoading || isAuthenticated) return;
      if (pathname !== '/compare' || count < 2) return;
      if (config) return;

      showGate({
        source: 'compare_page',
        returnTo: currentReturnTo,
        comparisonCount: count,
      });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [
    authLoading,
    comparisonLoading,
    config,
    count,
    currentReturnTo,
    isAuthenticated,
    pathname,
    showGate,
    suppressed,
  ]);

  const handleDismiss = useCallback(() => {
    if (!config) return;

    rememberSignupGateDismissed(config);
    track('signup_gate_dismissed', {
      source: config.source,
      return_to: config.returnTo,
      pathname,
      comparison_count: config.comparisonCount ?? count,
    });

    setConfig(null);
  }, [config, count, pathname]);

  const handlePrimary = useCallback(() => {
    if (!config) return;

    rememberSignupGateDismissed(config);
    track('signup_gate_primary_clicked', {
      source: config.source,
      return_to: config.returnTo,
      pathname,
      comparison_count: config.comparisonCount ?? count,
    });

    setConfig(null);
    router.push(`/signup?return_to=${encodeURIComponent(config.returnTo)}`);
  }, [config, count, pathname, router]);

  const handleSecondary = useCallback(() => {
    if (!config) return;

    rememberSignupGateDismissed(config);
    track('signup_gate_secondary_clicked', {
      source: config.source,
      return_to: config.returnTo,
      pathname,
      comparison_count: config.comparisonCount ?? count,
    });

    setConfig(null);
    router.push(`/login?return_to=${encodeURIComponent(config.returnTo)}`);
  }, [config, count, pathname, router]);

  if (!config) return null;

  return (
    <IdentityBridgeModal
      isOpen={Boolean(config)}
      onClose={handleDismiss}
      onLogin={handlePrimary}
      onSecondaryAction={handleSecondary}
      title={config.title}
      description={config.description}
      primaryActionLabel="Criar conta grátis"
      secondaryActionLabel="Já tenho conta"
      showSecondaryAction
      canDismiss
      trackAnalytics={false}
    />
  );
}
