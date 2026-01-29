'use client';

import { useState, useCallback, useEffect } from 'react';
import { fetchApi, categoriesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'rejected';
  featured: boolean;
  seo_url: string;
}

export function useCategories(companyId: string) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await fetchApi<{ categories: Category[] }>(`/companies/${companyId}/categories`);
      setCategories((resp?.categories || []).map(c => ({
        id: String(c.id),
        name: c.name,
        status: (c.status as any) || 'active',
        featured: !!c.featured,
        seo_url: c.seo_url
      })));
    } catch (e) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchAvailableCategories = useCallback(async () => {
    try {
      const all = await categoriesApi.getAll();
      const currentIds = new Set(categories.map(c => c.id));
      setAvailableCategories((all || []).map(c => ({
        id: String(c.id),
        name: c.name,
        status: (c.status as any) || 'active',
        featured: !!c.featured,
        seo_url: c.seo_url
      })).filter(c => !currentIds.has(c.id)));
    } catch (e) {
      setAvailableCategories([]);
    }
  }, [categories]);

  useEffect(() => {
    if (companyId) {
      fetchCategories();
    }
  }, [companyId, fetchCategories]);

  useEffect(() => {
    if (categories.length >= 0) {
      fetchAvailableCategories();
    }
  }, [categories.length, fetchAvailableCategories]);

  const addCategories = async (selectedIds: string[]) => {
    try {
      await fetchApi('/company_dashboard/add_categories', {
        method: 'POST',
        body: JSON.stringify({ category_ids: selectedIds })
      });
      toast({
        title: 'Sucesso',
        description: 'Categorias enviadas para aprovação.'
      });
      await fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar categorias',
        description: error.message || 'Não foi possível adicionar as categorias.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const removeCategory = async (categoryId: string) => {
    try {
      await fetchApi('/company_dashboard/remove_category', {
        method: 'POST',
        body: JSON.stringify({ category_id: categoryId })
      });
      toast({
        title: 'Sucesso',
        description: 'Categoria removida.'
      });
      await fetchCategories();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover categoria',
        description: error.message || 'Não foi possível remover a categoria.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return {
    loading,
    categories,
    availableCategories,
    addCategories,
    removeCategory,
    refresh: fetchCategories
  };
}
