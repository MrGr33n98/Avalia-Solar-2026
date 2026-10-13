'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { marketplaceProposalsApi, type MarketplaceProposal } from '@/lib/api';
import {
  classifyProposalError,
  type ClassifiedProposalError,
  proposalStateMessages,
} from '@/components/reviewer/proposals/proposal-state';

export interface UseBuyerProposalDetailProps {
  selectedId: number | null;
  rawProposalParam: string | null;
  onProposalLoaded?: (proposal: MarketplaceProposal) => void;
}

export interface UseBuyerProposalDetailReturn {
  detailLoading: boolean;
  detailErrorState: ClassifiedProposalError | null;
  retryDetail: () => void;
  clearError: () => void;
}

/**
 * Hook para carregar os detalhes de uma proposta específica,
 * com sanitização de IDs inválidos, cancelamento de requisições obsoletas,
 * classificação tipada de erros (401, 403, 404, 429, rede) e auto-visualização.
 */
export function useBuyerProposalDetail({
  selectedId,
  rawProposalParam,
  onProposalLoaded,
}: UseBuyerProposalDetailProps): UseBuyerProposalDetailReturn {
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErrorState, setDetailErrorState] = useState<ClassifiedProposalError | null>(null);
  const [detailAttempt, setDetailAttempt] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  const retryDetail = useCallback(() => {
    setDetailAttempt((prev) => prev + 1);
  }, []);

  const clearError = useCallback(() => {
    setDetailErrorState(null);
  }, []);

  useEffect(() => {
    // Caso 1: Parâmetro fornecido mas inválido (ex: não numérico, negativo ou decimal)
    if (rawProposalParam && selectedId === null) {
      setDetailErrorState({
        state: 'not_found',
        status: 404,
        message: 'Identificador de proposta inválido.',
        config: proposalStateMessages.not_found,
        canRetry: false,
      });
      setDetailLoading(false);
      return;
    }

    // Caso 2: Nenhuma proposta selecionada
    if (!selectedId) {
      setDetailErrorState(null);
      setDetailLoading(false);
      return;
    }

    // Cancelar requisição anterior se houver
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setDetailLoading(true);
    setDetailErrorState(null);

    (async () => {
      try {
        const response = await marketplaceProposalsApi.get(selectedId);
        if (controller.signal.aborted) return;

        let proposal = response.proposal;
        // Se a proposta foi apenas 'sent', marcar como 'viewed' automaticamente
        if (proposal.status === 'sent') {
          try {
            const viewResponse = await marketplaceProposalsApi.view(selectedId);
            if (!controller.signal.aborted) {
              proposal = viewResponse.proposal;
            }
          } catch {
            // Se o POST view falhar, prossegue com os dados recebidos do GET
          }
        }

        if (!controller.signal.aborted) {
          onProposalLoaded?.(proposal);
          setDetailErrorState(null);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const classified = classifyProposalError(err);
          setDetailErrorState(classified);
        }
      } finally {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [selectedId, rawProposalParam, detailAttempt, onProposalLoaded]);

  return {
    detailLoading,
    detailErrorState,
    retryDetail,
    clearError,
  };
}
