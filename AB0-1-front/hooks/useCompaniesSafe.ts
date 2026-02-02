'use client';

import { useState, useEffect, useCallback } from 'react';
import { companiesApiSafe, Company } from '@/lib/api-client';

interface UseCompaniesSafeParams {
  status?: 'active' | 'inactive';
  featured?: boolean;
  category_id?: number;
  limit?: number;
}

// Hook para lista de empresas
export function useCompaniesSafe(params?: UseCompaniesSafeParams) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await companiesApiSafe.getAll({
        status: params?.status || 'active',
        featured: params?.featured ?? true,
        limit: params?.limit || 12,
        category_id: params?.category_id,
      });

      setCompanies(data);
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
      setError((err as any)?.message || 'Falha ao carregar empresas');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [params?.status, params?.featured, params?.limit, params?.category_id]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return { companies, loading, error, refetch: fetchCompanies };
}

// Hook para logos de parceiros
export function usePartnerLogos() {
  const [partners, setPartners] = useState<Array<Pick<Company, 'id' | 'name' | 'logo_url'>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await companiesApiSafe.getAll({
          featured: true,
          status: 'active',
          limit: 10, // Get more to filter verified ones
        });

        const partnerLogos = data
          .filter(c => c.status === 'active' && c.verified && c.logo_url)
          .slice(0, 5) // Take only 5 after filtering
          .map(({ id, name, logo_url }) => ({ id, name, logo_url }));

        setPartners(partnerLogos);
      } catch (err) {
        console.error('Erro ao buscar logos dos parceiros:', err);
        setError((err as any)?.message || 'Falha ao carregar logos dos parceiros');
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  return { partners, loading, error };
}

// Hook para empresa única
export function useCompanySafe(id: number | string) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async (companyId: number | string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await companiesApiSafe.getById(companyId);

      // 🔑 Normaliza o retorno
      setCompany(data || null);
    } catch (err) {
      setError((err as any)?.message || 'Falha ao carregar empresa');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchCompany(id);
    }
  }, [id, fetchCompany]);

  return { company, loading, error, refetch: () => fetchCompany(id) };
}
