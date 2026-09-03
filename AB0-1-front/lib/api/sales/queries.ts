'use client';

import { useQuery } from '@tanstack/react-query';
import { salesApi } from './client';
import { salesKeys } from './queryKeys';

export function useSalesPipelines() {
  return useQuery({
    queryKey: salesKeys.pipelines(),
    queryFn: () => salesApi.getPipelines(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useSalesAccountOptions(search: string) {
  return useQuery({
    queryKey: salesKeys.accountOptions(search),
    queryFn: async () => {
      return await salesApi.getAccounts({ options: true, q: search, limit: 20 });
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useSalesContactOptions(accountId?: string | number) {
  return useQuery({
    queryKey: salesKeys.contacts(accountId),
    queryFn: async () => {
      if (!accountId) return [];
      return await salesApi.getContacts({ sales_account_id: accountId, options: true, limit: 30 });
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSalesOpportunities(filters?: Record<string, any>) {
  return useQuery({
    queryKey: salesKeys.opportunities(filters),
    queryFn: () => salesApi.getOpportunities(filters),
    staleTime: 1000 * 30, // 30 seconds
  });
}
