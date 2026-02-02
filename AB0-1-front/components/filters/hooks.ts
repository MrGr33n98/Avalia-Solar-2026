import { useState, useEffect } from 'react';
import { CategoryTreeNode, StateOption } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.avaliasolar.com.br/api/v1';

export function useCategoriesTree() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(`${API_BASE_URL}/categories/tree`);
        if (!response.ok) throw new Error('Falha ao buscar categorias');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useStatesOptions() {
  const [states, setStates] = useState<StateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchStates() {
      try {
        // Usando o endpoint global de estados que já existe no backend
        const response = await fetch(`${API_BASE_URL}/states`);
        if (!response.ok) throw new Error('Falha ao buscar estados');
        const data = await response.json();
        
        // O backend retorna um array simples de strings ou objetos dependendo do endpoint
        // Vamos normalizar para StateOption[]
        const normalizedData: StateOption[] = Array.isArray(data) 
          ? data.map((item: any) => typeof item === 'string' ? { state: item, count: 0 } : { state: item.state, count: item.count || 0 })
          : [];
          
        setStates(normalizedData.sort((a, b) => a.state.localeCompare(b.state)));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    }

    fetchStates();
  }, []);

  return { states, loading, error };
}
