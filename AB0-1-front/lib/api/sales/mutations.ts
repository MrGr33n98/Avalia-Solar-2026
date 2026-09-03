'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from './client';
import { salesKeys } from './queryKeys';
import { toast } from 'sonner';

export function useCreateOpportunityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof salesApi.createOpportunity>[0]) => salesApi.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.opportunities() });
      queryClient.invalidateQueries({ queryKey: salesKeys.pipelines() });
      toast.success('Oportunidade criada com sucesso!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao criar oportunidade comercial.');
    },
  });
}

export function useCreateCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof salesApi.createAccount>[0]) => salesApi.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      toast.success('Empresa cadastrada com sucesso!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao cadastrar empresa.');
    },
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof salesApi.createContact>[0]) => salesApi.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      toast.success('Contato cadastrado com sucesso!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao cadastrar contato.');
    },
  });
}
