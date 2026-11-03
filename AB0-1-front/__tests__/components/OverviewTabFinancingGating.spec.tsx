import React from 'react';
import { render, screen } from '@testing-library/react';
import OverviewTab from '@/app/companies/[id]/components/OverviewTab';
import { Company } from '@/lib/api';

// Mocks para isolar dependências externas do OverviewTab
jest.mock('@/contexts/LocationContext', () => ({
  useLocation: () => ({ coordinates: null, loading: false }),
}));

jest.mock('@/lib/feature-access', () => ({
  isFeatureEnabled: () => false,
  hasPaidPlan: () => false,
  canShowMediaGallery: () => false,
  canShowCompanyProfileAds: () => false,
}));

jest.mock('@/app/companies/[id]/components/SocialProof', () => () => <div data-testid="social-proof-mock" />);
jest.mock('@/app/companies/[id]/components/ReviewsPreview', () => () => <div data-testid="reviews-preview-mock" />);
jest.mock('@/app/companies/[id]/components/ProjectsPreview', () => () => <div data-testid="projects-preview-mock" />);
jest.mock('@/app/companies/[id]/components/RelatedCompaniesCarousel', () => () => <div data-testid="related-companies-mock" />);

const baseCompany: Company = {
  id: 1140,
  name: 'Eletroserv Engenharia',
  description: 'Instalação e projetos solares',
  website: 'https://eletroserv.eng.br',
  phone: '83987220000',
  address: 'Campina Grande, PB',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  banner_url: null,
  logo_url: null,
  state: 'PB',
  city: 'Campina Grande',
  status: 'active',
  verified: true,
  category: 'energia-solar',
  financing_enabled: false,
  financing_tab_visible: false,
  financing_profile: null,
  categories: [
    { id: 70, name: 'Energia Solar', seo_url: 'energia-solar' },
    { id: 81, name: 'Financiamento de Energia Solar', seo_url: 'financiamento-energia-solar' },
  ],
};

describe('OverviewTab - Gating de Financiamento Solar', () => {
  it('NÃO renderiza simulador quando empresa tem categoria de financiamento mas não habilitou o recurso', () => {
    render(<OverviewTab company={baseCompany} reviews={[]} reviewsLoading={false} companyStats={{ rating: '5.0', reviewCount: 10, productCount: 2, yearsInBusiness: 5 }} />);

    expect(screen.queryByText(/Simule seu financiamento solar/i)).not.toBeInTheDocument();
  });

  it('NÃO renderiza simulador quando perfil de financiamento está em rascunho (draft)', () => {
    const companyWithDraft: Company = {
      ...baseCompany,
      financing_enabled: true,
      financing_tab_visible: true,
      financing_profile: {
        status: 'draft',
        default_amount_cents: 5000000,
        currency: 'BRL',
      },
    };

    render(<OverviewTab company={companyWithDraft} reviews={[]} reviewsLoading={false} companyStats={{ rating: '5.0', reviewCount: 10, productCount: 2, yearsInBusiness: 5 }} />);

    expect(screen.queryByText(/Simule seu financiamento solar/i)).not.toBeInTheDocument();
  });

  it('RENDERIZA simulador quando financiamento está habilitado e perfil está publicado', () => {
    const companyWithPublished: Company = {
      ...baseCompany,
      financing_enabled: true,
      financing_tab_visible: true,
      financing_profile: {
        status: 'published',
        default_amount_cents: 5000000,
        currency: 'BRL',
        default_term_months: 60,
        default_down_payment_percent: 20,
        default_interest_rate_monthly: 1.2,
      },
    };

    render(<OverviewTab company={companyWithPublished} reviews={[]} reviewsLoading={false} companyStats={{ rating: '5.0', reviewCount: 10, productCount: 2, yearsInBusiness: 5 }} />);

    expect(screen.getByText(/Simule seu financiamento solar/i)).toBeInTheDocument();
  });
});
