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
  category?: { id: number; name: string; slug: string };
  description?: string;
  price_from?: number | null;
  coverage?: string[];
  status: 'active' | 'inactive';
  image_url?: string | null;
  cover_image_url?: string | null;
  images?: Array<{ id: number; url: string }>;
  public_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type ServiceStats = { total: number; active: number; inactive: number };

export type ServiceInput = {
  name: string;
  category_id: number;
  description?: string;
  price_from?: number | null;
  coverage?: string[];
  status: 'active' | 'inactive';
  cover_image?: File | null;
  images?: File[];
  remove_image_ids?: number[];
  remove_cover_image?: boolean;
};

type ServicesResponse = {
  data?: CompanyService[];
  meta?: { stats?: ServiceStats };
};

const EMPTY_STATS: ServiceStats = { total: 0, active: 0, inactive: 0 };

function buildServiceForm(input: Partial<ServiceInput>): FormData {
  const form = new FormData();
  const textFields = ['name', 'description', 'price_from', 'category_id', 'status'] as const;

  textFields.forEach((field) => {
    const value = input[field];
    if (value !== undefined) {
      form.append(`service[${field}]`, value === null ? '' : String(value));
    }
  });

  input.coverage?.forEach((location) => form.append('service[coverage][]', location));
  if (input.cover_image) form.append('service[cover_image]', input.cover_image);
  input.images?.forEach((image) => form.append('service[images][]', image));
  input.remove_image_ids?.forEach((id) => form.append('service[remove_image_ids][]', String(id)));
  if (input.remove_cover_image) form.append('service[remove_cover_image]', 'true');

  return form;
}

export function useServices(companyId?: string | number) {
  const { toast } = useToast();
  const [services, setServices] = useState<CompanyService[]>([]);
  const [stats, setStats] = useState<ServiceStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchApi<ServicesResponse>('/dashboard/services', {
        params: companyId ? { company_id: companyId } : undefined,
      });
      const items = response?.data || [];
      setServices(items);
      setStats(response?.meta?.stats || {
        total: items.length,
        active: items.filter((service) => service.status === 'active').length,
        inactive: items.filter((service) => service.status === 'inactive').length,
      });
    } catch (err: unknown) {
      toast({
        title: 'Erro ao carregar catálogo de serviços',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const addService = useCallback(async (input: ServiceInput) => {
    try {
      const response = await fetchApi<{ service: CompanyService }>('/dashboard/services', {
        method: 'POST',
        params: companyId ? { company_id: companyId } : undefined,
        body: buildServiceForm(input),
      });
      toast({ title: 'Serviço cadastrado!', description: 'O serviço foi salvo no catálogo.' });
      await loadServices();
      return response.service;
    } catch (err: unknown) {
      toast({
        title: 'Erro ao cadastrar serviço',
        description: err instanceof Error ? err.message : 'Não foi possível salvar.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [companyId, loadServices, toast]);

  const updateService = useCallback(async (id: number, input: Partial<ServiceInput>) => {
    try {
      const response = await fetchApi<{ service: CompanyService }>(`/dashboard/services/${id}`, {
        method: 'PATCH',
        params: companyId ? { company_id: companyId } : undefined,
        body: buildServiceForm(input),
      });
      toast({ title: 'Serviço atualizado!', description: 'Alterações salvas com sucesso.' });
      await loadServices();
      return response.service;
    } catch (err: unknown) {
      toast({
        title: 'Erro ao atualizar serviço',
        description: err instanceof Error ? err.message : 'Não foi possível salvar.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [companyId, loadServices, toast]);

  const deleteService = useCallback(async (id: number) => {
    try {
      await fetchApi(`/dashboard/services/${id}`, {
        method: 'DELETE',
        params: companyId ? { company_id: companyId } : undefined,
      });
      toast({ title: 'Serviço excluído', description: 'O serviço foi removido do catálogo.' });
      await loadServices();
    } catch (err: unknown) {
      toast({
        title: 'Erro ao excluir serviço',
        description: err instanceof Error ? err.message : 'Não foi possível excluir.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [companyId, loadServices, toast]);

  return { services, stats, loading, loadServices, addService, updateService, deleteService };
}
