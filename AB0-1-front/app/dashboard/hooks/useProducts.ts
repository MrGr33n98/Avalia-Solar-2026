import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { productsApi } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';
import type { Product } from '../types';

export function useProducts(companyId: string) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const data = await productsApi.getAll({ company_id: Number(companyId) });
      const productsList = Array.isArray(data)
        ? data
        : data && Array.isArray((data as any).products)
          ? (data as any).products
          : data && Array.isArray((data as any).data)
            ? (data as any).data
            : [];
      setProducts(productsList.map((p: any) => ({ 
        ...p, 
        id: String(p.id) 
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (data: any) => {
    try {
      setLoading(true);
      const created = await productsApi.create({
        ...data,
        company_id: Number(companyId)
      });
      const formatted = { ...created, id: String(created.id) } as Product;
      setProducts(prev => [...prev, formatted]);
      
      track('Product Action', {
        action: 'create',
        product_id: formatted.id,
        company_id: companyId
      });

      toast({ title: 'Produto adicionado!', description: 'Produto criado com sucesso.' });
      return formatted;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o produto.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId: string, data: any) => {
    try {
      setLoading(true);
      const updated = await productsApi.update(Number(productId), {
        ...data,
        company_id: Number(companyId)
      });
      const formatted = { ...updated, id: String(updated.id) } as Product;
      setProducts(prev => prev.map(p => p.id === productId ? formatted : p));
      
      track('Product Action', {
        action: 'update',
        product_id: productId,
        company_id: companyId
      });

      toast({ title: 'Produto atualizado!', description: 'Atualização realizada.' });
      return formatted;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o produto.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      setLoading(true);
      await productsApi.delete(Number(productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      track('Product Action', {
        action: 'delete',
        product_id: productId,
        company_id: companyId
      });

      toast({ title: 'Produto removido!', description: 'O produto foi excluído com sucesso.' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o produto.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    refresh: fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
}
