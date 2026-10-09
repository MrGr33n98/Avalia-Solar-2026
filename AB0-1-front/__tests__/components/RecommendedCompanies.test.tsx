import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecommendedCompanies from '@/components/compare/RecommendedCompanies';
import type { CompareCompany } from '@/components/compare/mapCompanyToCompareCompany';

const mockCompanyA: CompareCompany = {
  id: 1,
  name: 'Empresa A',
  slug: 'empresa-a',
  logoUrl: null,
  rating: 4.8,
  reviewsCount: 15,
  badges: [],
  city: 'Florianópolis',
  state: 'SC',
  verified: true,
  categoryNames: ['Residencial'],
  categories: [],
  sponsored: false,
  premium: false,
};

const mockCompanyB: CompareCompany = {
  id: 2,
  name: 'Empresa B',
  slug: 'empresa-b',
  logoUrl: null,
  rating: 4.9,
  reviewsCount: 22,
  badges: [],
  city: 'Florianópolis',
  state: 'SC',
  verified: true,
  categoryNames: ['Comercial'],
  categories: [],
  sponsored: false,
  premium: false,
};

const mockCompanyC: CompareCompany = {
  id: 3,
  name: 'Empresa C',
  slug: 'empresa-c',
  logoUrl: null,
  rating: 4.7,
  reviewsCount: 10,
  badges: [],
  city: 'Florianópolis',
  state: 'SC',
  verified: true,
  categoryNames: ['Residencial'],
  categories: [],
  sponsored: false,
  premium: false,
};

const mockRecommended: CompareCompany = {
  id: 4,
  name: 'Empresa Rec',
  slug: 'empresa-rec',
  logoUrl: null,
  rating: 5.0,
  reviewsCount: 30,
  badges: [],
  city: 'Florianópolis',
  state: 'SC',
  verified: true,
  categoryNames: ['Industrial'],
  categories: [],
  sponsored: false,
  premium: false,
};

describe('RecommendedCompanies - limites canônicos', () => {
  const onAdd = jest.fn();
  const onReplace = jest.fn();
  const onRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('no mobile (limite 2), com 2 selecionadas, exibe botão "Substituir" em vez de "Adicionar"', () => {
    render(
      <RecommendedCompanies
        companies={[mockRecommended]}
        selectedCompanies={[mockCompanyA, mockCompanyB]}
        maxComparison={2}
        loading={false}
        error={false}
        onRetry={onRetry}
        onAdd={onAdd}
        onReplace={onReplace}
      />
    );

    const button = screen.getByRole('button', { name: /Substituir por Empresa Rec/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Substituir');

    fireEvent.click(button);
    expect(onAdd).not.toHaveBeenCalled();
  });

  test('no mobile (limite 2), com 1 selecionada, exibe botão "Adicionar"', () => {
    render(
      <RecommendedCompanies
        companies={[mockRecommended]}
        selectedCompanies={[mockCompanyA]}
        maxComparison={2}
        loading={false}
        error={false}
        onRetry={onRetry}
        onAdd={onAdd}
        onReplace={onReplace}
      />
    );

    const button = screen.getByRole('button', { name: /Adicionar Empresa Rec/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Adicionar');

    fireEvent.click(button);
    expect(onAdd).toHaveBeenCalledWith(mockRecommended);
  });

  test('no desktop (limite 3), com 2 selecionadas, exibe botão "Adicionar"', () => {
    render(
      <RecommendedCompanies
        companies={[mockRecommended]}
        selectedCompanies={[mockCompanyA, mockCompanyB]}
        maxComparison={3}
        loading={false}
        error={false}
        onRetry={onRetry}
        onAdd={onAdd}
        onReplace={onReplace}
      />
    );

    const button = screen.getByRole('button', { name: /Adicionar Empresa Rec/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Adicionar');

    fireEvent.click(button);
    expect(onAdd).toHaveBeenCalledWith(mockRecommended);
  });

  test('no desktop (limite 3), com 3 selecionadas, exibe botão "Substituir"', () => {
    render(
      <RecommendedCompanies
        companies={[mockRecommended]}
        selectedCompanies={[mockCompanyA, mockCompanyB, mockCompanyC]}
        maxComparison={3}
        loading={false}
        error={false}
        onRetry={onRetry}
        onAdd={onAdd}
        onReplace={onReplace}
      />
    );

    const button = screen.getByRole('button', { name: /Substituir por Empresa Rec/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Substituir');

    fireEvent.click(button);
    expect(onAdd).not.toHaveBeenCalled();
  });
});
