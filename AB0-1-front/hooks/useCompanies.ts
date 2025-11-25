'use client';

import { useState, useEffect } from 'react';
import { companiesApi, Company } from '@/lib/api';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companiesApi.getAll();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCompany = await companiesApi.create(company);
      setCompanies((prev: Company[]) => [...prev, newCompany as Company]);
      return newCompany;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
      throw err;
    }
  };

  const updateCompany = async (id: number, updates: Partial<Company>) => {
    try {
      const updatedCompany = await companiesApi.update(id, updates);
      setCompanies((prev: Company[]) => prev.map((c: Company) => c.id === id ? (updatedCompany as Company) : c));
      return updatedCompany;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update company');
      throw err;
    }
  };

  const deleteCompany = async (id: number) => {
    try {
      await companiesApi.delete(id);
      setCompanies((prev: Company[]) => prev.filter((c: Company) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company');
      throw err;
    }
  };

  return {
    companies,
    loading,
    error,
    refetch: fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}

export function useCompany(id: number) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCompany(id);
    }
  }, [id]);

  const fetchCompany = async (companyId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await companiesApi.getById(companyId);
      setCompany(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company');
    } finally {
      setLoading(false);
    }
  };

  return { company, loading, error, refetch: () => fetchCompany(id) };
}
