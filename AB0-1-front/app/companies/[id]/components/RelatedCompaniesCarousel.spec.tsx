import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RelatedCompaniesCarousel from './RelatedCompaniesCarousel';
import { Company } from '@/lib/api';
import { hasPaidPlan } from '@/lib/feature-access';

jest.mock('@/lib/feature-access', () => ({
  hasPaidPlan: jest.fn(),
}));

jest.mock('./RelatedCompanyCard', () => {
  return function DummyRelatedCompanyCard({ company }: { company: { id: number; name: string } }) {
    return <div data-testid={`related-card-${company.id}`}>{company.name}</div>;
  };
});

const mockFreeCompany = {
  id: 100,
  name: 'Empresa Gratuita',
  category_info: { id: 1, name: 'Solar' },
} as unknown as Company;

const mockPaidCompany = {
  id: 200,
  name: 'Empresa Pro Paga',
  has_paid_plan: true,
  category_info: { id: 1, name: 'Solar' },
} as unknown as Company;

const mockCompaniesList = [
  { id: 101, name: 'Concorrente 1' },
  { id: 102, name: 'Concorrente 2' },
  { id: 103, name: 'Concorrente 3' },
  { id: 104, name: 'Concorrente 4' },
  { id: 105, name: 'Concorrente 5' },
] as unknown as Company[];

describe('RelatedCompaniesCarousel - Anti-Leak & Mode Matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (hasPaidPlan as jest.Mock).mockImplementation((c) => Boolean(c?.has_paid_plan));
  });

  describe('Proteção Comercial e Prevenção de Brecha (Zero Entitlement Leak)', () => {
    it('renderiza "Perfil Protegido Exclusivo" quando empresa PAGA tem proteção ativa (mode=protected)', () => {
      render(
        <RelatedCompaniesCarousel
          company={mockPaidCompany}
          mode="protected"
          relatedCompanies={[]}
        />
      );
      expect(screen.getByText(/Perfil Protegido Exclusivo/i)).toBeInTheDocument();
      // Não deve fabricar verificação cadastral dentro do card de proteção
      expect(screen.queryByTestId('company-verified-badge')).not.toBeInTheDocument();
    });

    it('NUNCA exibe "Perfil Protegido Exclusivo" para empresa Free mesmo se showAlternatives for falso ou indefinido (Free sempre exibe alternativas)', () => {
      // Cenário crítico: Empresa Free sem feature_access ou com show_alternatives=false
      render(
        <RelatedCompaniesCarousel
          company={mockFreeCompany}
          showAlternatives={false}
          relatedCompanies={mockCompaniesList}
          loading={false}
        />
      );

      // NUNCA deve exibir o card de proteção
      expect(screen.queryByText(/Perfil Protegido Exclusivo/i)).not.toBeInTheDocument();
      // Deve renderizar os cards de concorrentes para empresas Free
      expect(screen.getByTestId('related-card-101')).toBeInTheDocument();
    });

    it('exibe "Perfil Protegido Exclusivo" para empresa Paga via fallback legado de showAlternatives=false', () => {
      render(
        <RelatedCompaniesCarousel
          company={mockPaidCompany}
          showAlternatives={false}
          relatedCompanies={[]}
          loading={false}
        />
      );

      expect(screen.getByText(/Perfil Protegido Exclusivo/i)).toBeInTheDocument();
    });
  });

  describe('Estados de Carregamento, Erro e Vazio', () => {
    it('renderiza skeleton de carregamento quando mode=loading', () => {
      render(
        <RelatedCompaniesCarousel
          company={mockFreeCompany}
          mode="loading"
        />
      );

      const skeleton = screen.getByLabelText(/Carregando empresas semelhantes/i);
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('renderiza estado de erro e dispara onRetry quando o botão é clicado', () => {
      const handleRetry = jest.fn();
      render(
        <RelatedCompaniesCarousel
          company={mockFreeCompany}
          mode="error"
          onRetry={handleRetry}
        />
      );

      expect(screen.getByText(/Não foi possível carregar empresas semelhantes/i)).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /Tentar novamente/i });
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renderiza estado vazio honesto quando mode=empty', () => {
      render(
        <RelatedCompaniesCarousel
          company={mockFreeCompany}
          mode="empty"
          relatedCompanies={[]}
        />
      );

      expect(screen.getByText(/Nenhuma outra empresa correspondente encontrada/i)).toBeInTheDocument();
      expect(screen.queryByText(/Perfil Protegido Exclusivo/i)).not.toBeInTheDocument();
    });
  });

  describe('Renderização de Resultados e Acessibilidade', () => {
    it('renderiza os cards de concorrentes no carrossel com controles de navegação', () => {
      render(
        <RelatedCompaniesCarousel
          company={mockFreeCompany}
          mode="results"
          relatedCompanies={mockCompaniesList}
        />
      );

      expect(screen.getByRole('region', { name: /Empresas Relacionadas/i })).toBeInTheDocument();
      expect(screen.getByTestId('related-card-101')).toBeInTheDocument();
      expect(screen.getByTestId('related-card-105')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Empresa anterior/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Próxima empresa/i })).toBeInTheDocument();
    });
  });
});
