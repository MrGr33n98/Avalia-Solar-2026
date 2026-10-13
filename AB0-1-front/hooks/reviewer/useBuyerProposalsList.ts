'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';

export interface UseBuyerProposalsListReturn {
  proposals: MarketplaceProposal[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  load: () => Promise<void>;
  updateProposal: (proposal: MarketplaceProposal) => void;
  setProposals: React.Dispatch<React.SetStateAction<MarketplaceProposal[]>>;
}

/**
 * Hook para carregar e gerenciar a coleção de propostas do comprador.
 * Implementa cancelamento seguro de requisições pendentes via AbortController.
 */
export function useBuyerProposalsList(): UseBuyerProposalsListReturn {
  const [proposals, setProposals] = useState<MarketplaceProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProposal = useCallback((proposal: MarketplaceProposal) => {
    setProposals((current) =>
      current.some((item) => item.id === proposal.id)
        ? current.map((item) => (item.id === proposal.id ? proposal : item))
        : [...current, proposal]
    );
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await marketplaceProposalsApi.list();
      if (!controller.signal.aborted) {
        setProposals(response.proposals ?? []);
      }
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        setError('Não foi possível carregar suas propostas. Tente novamente.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [load]);

  return {
    proposals,
    loading,
    refreshing,
    error,
    load,
    updateProposal,
    setProposals,
  };
}
