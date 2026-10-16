'use client';

import { useCallback, useEffect, useState } from 'react';
import { type MarketplaceProposal } from '@/lib/api';
import { isProposalReceived } from '@/lib/marketplace-proposals';

export interface UseProposalComparisonReturn {
  compareIds: number[];
  setCompareIds: React.Dispatch<React.SetStateAction<number[]>>;
  compareNotice: string;
  setCompareNotice: (msg: string) => void;
  toggleCompare: (id: number, proposal?: MarketplaceProposal) => void;
  removeCompareId: (id: number) => void;
  clearCompare: () => void;
}

/**
 * Hook para gerenciar o estado da comparação de propostas (2 a 3 propostas simultâneas).
 * Valida elegibilidade e controla avisos contextuais temporários.
 */
export function useProposalComparison(
  initialIds: number[] = [],
  proposals: MarketplaceProposal[] = []
): UseProposalComparisonReturn {
  const [compareIds, setCompareIds] = useState<number[]>(initialIds);
  const [compareNotice, setCompareNotice] = useState<string>('');

  useEffect(() => {
    if (!compareNotice) return;
    const timer = setTimeout(() => setCompareNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [compareNotice]);

  const toggleCompare = useCallback(
    (id: number, proposal?: MarketplaceProposal) => {
      const target = proposal || proposals.find((p) => p.id === id);
      if (!target || !isProposalReceived(target)) {
        setCompareNotice('Disponível apenas quando a proposta for recebida.');
        return;
      }

      setCompareIds((current) => {
        if (current.includes(id)) {
          return current.filter((item) => item !== id);
        }
        if (current.length >= 3) {
          setCompareNotice('Você pode comparar até 3 propostas.');
          return current;
        }
        if (current.length > 0) {
          const first = proposals.find((p) => p.id === current[0]);
          const firstReqId = first?.request?.id ?? first?.lead?.id ?? first?.lead_distribution_id;
          const targetReqId = target.request?.id ?? target.lead?.id ?? target.lead_distribution_id;
          if (firstReqId && targetReqId && firstReqId !== targetReqId) {
            setCompareNotice('Só é possível comparar propostas do mesmo projeto.');
            return current;
          }
        }
        return [...current, id];
      });
    },
    [proposals]
  );

  const removeCompareId = useCallback((id: number) => {
    setCompareIds((current) => current.filter((item) => item !== id));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
  }, []);

  return {
    compareIds,
    setCompareIds,
    compareNotice,
    setCompareNotice,
    toggleCompare,
    removeCompareId,
    clearCompare,
  };
}
