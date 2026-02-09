'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companiesApi, companyAccessApi, hasPossibleAuthSession } from '@/lib/api';

interface Company {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  logo_url: string | null;
  category: string;
  status: string;
  verified: boolean;
}

interface CompanyContextType {
  activeCompany: Company | null;
  setActiveCompany: (company: Company | null) => void;
  selectCompany: (company: Company) => Promise<void>;
  companies: Company[];
  isLoading: boolean;
  refetchCompanies: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);

  const { data: companies = [], isLoading, refetch } = useQuery({
    queryKey: ['my-companies'],
    queryFn: () => {
      if (!hasPossibleAuthSession()) return Promise.resolve([]);
      return companiesApi.mine().then(res => res as Company[]);
    },
    enabled: hasPossibleAuthSession(),
    retry: 1,
  });

  // Load active company from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('active_company');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActiveCompanyState(parsed);
      } catch (e) {
        console.error('Failed to parse active company from localStorage', e);
      }
    }
  }, []);

  // Update localStorage when active company changes
  const setActiveCompany = (company: Company | null) => {
    setActiveCompanyState(company);
    if (company) {
      localStorage.setItem('active_company', JSON.stringify(company));
      // Set a cookie for the backend if needed
      document.cookie = `active_company_id=${company.id}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      localStorage.removeItem('active_company');
      document.cookie = `active_company_id=; path=/; max-age=0; SameSite=Lax`;
    }
  };

  const selectCompany = async (company: Company) => {
    if (!company?.id) return;
    if (activeCompany?.id === company.id) return;

    const previous = activeCompany;
    setActiveCompany(company);
    try {
      await companyAccessApi.selectActiveCompany(company.id);
    } catch (error) {
      console.warn('[CompanyContext] Failed to persist active company selection', error);
      setActiveCompany(previous ?? null);
      throw error;
    }
  };

  // Automatically select the first company if none is selected and companies are loaded
  useEffect(() => {
    if (!activeCompany && companies.length > 0) {
      // Check if we have a saved ID in cookies but not the full object in localStorage
      const match = document.cookie.match(/active_company_id=(\d+)/);
      const savedId = match ? parseInt(match[1]) : null;
      
      const found = savedId ? companies.find(c => c.id === savedId) : companies[0];
      if (found) {
        setActiveCompany(found);
      }
    }
  }, [companies, activeCompany]);

  return (
    <CompanyContext.Provider value={{ 
      activeCompany, 
      setActiveCompany, 
      selectCompany,
      companies, 
      isLoading, 
      refetchCompanies: refetch 
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
}
