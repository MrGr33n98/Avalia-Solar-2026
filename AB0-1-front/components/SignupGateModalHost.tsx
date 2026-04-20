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
    description: 'Desbloqueie a análise completa, salve sua shortlist e volte exatamente para onde parou.',
  },
  compare_page: {
    title: 'Crie sua conta para ver a comparação completa',
    description: 'Libere a visão lado a lado, mantenha suas empresas salvas e siga sua pesquisa sem perder o contexto.',
  },
  review_tab: {
    title: 'Quer ver todas as avaliações?',
    description: 'Crie sua conta para acessar o histórico completo de performance, elogios e pontos de atenção.',
  },
  contact_reveal: {
    title: 'Crie sua conta para ver os contatos',
    description: 'Libere telefone, e-mail e outros canais de contato desta empresa.',
  },
  quote_wizard: {
    title: 'Crie sua conta para continuar seu orçamento',
    description: 'Desbloqueie o formulário de orçamento, salve sua solicitação e volte exatamente ao ponto em que estava.',
  },
  quick_lead: {
    title: 'Crie sua conta para continuar sua solicitação',
    description: 'Desbloqueie o pedido rápido, mantenha seus dados vinculados e siga sem perder o contexto.',
  },
  dynamic_lead_wizard: {
    title: 'Crie sua conta para continuar seu orçamento',
    description: 'Desbloqueie o formulário completo e siga com a empresa mais aderente ao seu projeto.',
  },
  manual: {
    title: 'Crie sua conta para continuar',
    description: 'Desbloqueie mais detalhes e volte exatamente para o ponto em que estava.',
  },
};

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

      return {
        source: detail.source,
        returnTo: detail.returnTo || currentReturnTo,
        title: detail.title || copy.title,
        description: detail.description || copy.description,
        comparisonCount: detail.comparisonCount,
      };
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
  }, [authLoading, comparisonLoading, config, count, currentReturnTo, isAuthenticated, pathname, showGate, suppressed]);

  const handlePrimary = useCallback(() => {
    if (!config) return;

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
      onClose={() => setConfig(null)}
      onLogin={handlePrimary}
      onSecondaryAction={handleSecondary}
      title={config.title}
      description={config.description}
      primaryActionLabel="Criar conta grátis"
      secondaryActionLabel="Já tenho conta"
      showSecondaryAction
      canDismiss={false}
      trackAnalytics={false}
    />
  );
}
