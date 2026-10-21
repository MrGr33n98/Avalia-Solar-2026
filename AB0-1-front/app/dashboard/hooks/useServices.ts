'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type CompanyService = {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  category_id: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  description?: string;
  price_from?: number;
  coverage?: string[];
  status: 'active' | 'inactive';
  image_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type ServiceStats = {
  total: number;
  active: number;
  inactive: number;
};

export type ServiceInput = {
  name: string;
  category_id: number;
  description?: string;
  price_from?: number | null;
  coverage?: string[];
  status: 'active' | 'inactive';
};

type ServicesResponse = {
  data?: CompanyService[];
  meta?: { stats?: ServiceStats };
};

const EMPTY_STATS: ServiceStats = {
  total: 0,
  active: 0,
  inactive: 0,
};

export function useServices(companyId?: string | number) {
  const { toast } = useToast();
  const [services, setServices] = useState<CompanyService[]>([]);
  const [stats, setStats] = useState<ServiceStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchApi<ServicesResponse>(
        '/dashboard/services',
        {
          params: companyId ? { company_id: companyId } : undefined,
        },
      );

      const items = response?.data || [];
      setServices(items);

      if (response?.meta?.stats) {
        setStats(response.meta.stats);
      } else {
        setStats({
          total: items.length,
          active: items.filter((s) => s.status === 'active').length,
          inactive: items.filter((s) => s.status === 'inactive').length,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar serviços';
      toast({
        title: 'Erro ao carregar catálogo de serviços',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const addService = useCallback(
    async (input: ServiceInput) => {
      try {
        const response = await fetchApi<{ service: CompanyService }>(
          '/dashboard/services',
          {
            method: 'POST',
            body: { service: input },
          },
        );

        toast({
          title: 'Serviço cadastrado com sucesso!',
          description: `"${input.name}" foi adicionado ao seu catálogo.`,
        });

        await loadServices();
        return response?.service;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar serviço';
        toast({
          title: 'Erro ao cadastrar serviço',
          description: message,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [loadServices, toast],
  );

  const updateService = useCallback(
    async (id: number, input: Partial<ServiceInput>) => {
      try {
        const response = await fetchApi<{ service: CompanyService }>(
          `/dashboard/services/${id}`,
          {
            method: 'PATCH',
            body: { service: input },
          },
        );

        toast({
          title: 'Serviço atualizado!',
          description: 'As alterações foram salvas com sucesso.',
        });

        await loadServices();
        return response?.service;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar serviço';
        toast({
          title: 'Erro ao atualizar serviço',
          description: message,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [loadServices, toast],
  );

  const deleteService = useCallback(
    async (id: number) => {
      try {
        await fetchApi(`/dashboard/services/${id}`, {
          method: 'DELETE',
        });

        toast({
          title: 'Serviço excluído',
          description: 'O serviço foi removido do seu catálogo.',
        });

        await loadServices();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao excluir serviço';
        toast({
          title: 'Erro ao excluir serviço',
          description: message,
          variant: 'destructive',
        });
        throw err;
      }
    },
    [loadServices, toast],
  );

  return {
    services,
    stats,
    loading,
    loadServices,
    addService,
    updateService,
    deleteService,
  };
}
