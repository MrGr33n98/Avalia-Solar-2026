'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companiesApi, companyAccessApi, hasPossibleAuthSession, Company } from '@/lib/api';

interface CompanyContextType {
  activeCompany: Company | null;
  setActiveCompany: (company: Company | null) => void;
  selectCompany: (company: Company) => Promise<void>;
  companies: Company[];
  isLoading: boolean;
  refetchCompanies: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const readActiveCompanyIdFromCookie = (): number | null => {
  const match = document.cookie.match(/(?:^|;\s*)active_company_id=(\d+)/);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

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
        const parsed = JSON.parse(saved) as Company;
        if (parsed?.id) {
          setActiveCompanyState(parsed);
        } else {
          localStorage.removeItem('active_company');
        }
      } catch (e) {
        console.error('Failed to parse active company from localStorage', e);
        localStorage.removeItem('active_company');
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

  // Keep active company aligned with memberships from API and clean stale localStorage ids.
  useEffect(() => {
    if (isLoading) return;

    if (!Array.isArray(companies) || companies.length === 0) {
      if (activeCompany) {
        setActiveCompany(null);
      }
      return;
    }

    const activeCompanyId = activeCompany ? Number(activeCompany.id) : null;
    const activeMatch = activeCompanyId
      ? companies.find((company) => Number(company.id) === activeCompanyId)
      : null;

    if (activeMatch) {
      if (
        activeCompany &&
        (
          activeCompany.name !== activeMatch.name ||
          activeCompany.slug !== activeMatch.slug ||
          activeCompany.city !== activeMatch.city ||
          activeCompany.state !== activeMatch.state ||
          activeCompany.logo_url !== activeMatch.logo_url ||
          activeCompany.category !== activeMatch.category ||
          activeCompany.status !== activeMatch.status ||
          activeCompany.verified !== activeMatch.verified
        )
      ) {
        setActiveCompany(activeMatch);
      }
      return;
    }

    const savedId = readActiveCompanyIdFromCookie();
    const savedMatch = savedId
      ? companies.find((company) => Number(company.id) === savedId)
      : null;

    setActiveCompany(savedMatch || companies[0]);
  }, [companies, activeCompany, isLoading]);

  // If the selected company is removed while syncing with backend, make sure the cookie is cleared.
  useEffect(() => {
    if (!activeCompany && !isLoading && companies.length === 0) {
      document.cookie = 'active_company_id=; path=/; max-age=0; SameSite=Lax';
    }
  }, [activeCompany, isLoading, companies.length]);

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
