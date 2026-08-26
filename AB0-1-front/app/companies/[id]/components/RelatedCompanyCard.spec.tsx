import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RelatedCompanyCard from './RelatedCompanyCard';
import { Company } from '@/lib/api';
import { useComparison } from '@/hooks/useComparison';
import { hasPaidPlan } from '@/lib/feature-access';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: jest.fn(),
}));

jest.mock('@/lib/feature-access', () => ({
  hasPaidPlan: jest.fn(),
}));

jest.mock('@/components/CompanyLogo', () => ({
  CompanyLogo: ({ name }: { name: string }) => <div data-testid="company-logo">{name}</div>,
}));

const mockCompany = {
  id: 1,
  name: 'Empresa Teste',
  slug: 'empresa-teste',
  verified: true,
  rating_avg: 4.5,
  rating_count: 100,
  logo_url: 'logo.png',
  categories: [{ id: 1, name: 'Energia Solar', seo_url: 'energia-solar', status: 'active', featured: false }],
  reputation: {
    rating_avg: 4.5,
    rating_count: 100,
  },
  operations: {
    sla_label: '24h',
    delivered_projects: 50,
  },
  feature_access: {},
} as unknown as Company;

describe('RelatedCompanyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useComparison as jest.Mock).mockReturnValue({
      isInComparison: jest.fn().mockReturnValue(false),
      toggleComparison: jest.fn(),
      canAddMore: true,
    });
    (hasPaidPlan as jest.Mock).mockReturnValue(false);
  });

  it('renders company name, verified badge and category', () => {
    render(<RelatedCompanyCard company={mockCompany} />);
    expect(screen.getByRole('heading', { name: 'Empresa Teste' })).toBeInTheDocument();
    expect(screen.getByLabelText('Verificada')).toBeInTheDocument();
    expect(screen.getByText('Energia Solar')).toBeInTheDocument();
  });

  it('renders metrics (rating, sla, projects)', () => {
    render(<RelatedCompanyCard company={mockCompany} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('100 avaliações')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('handles missing metrics gracefully', () => {
    const noMetricsCompany = {
      ...mockCompany,
      reputation: {},
      operations: {},
      rating_avg: null,
      rating_count: null,
    } as unknown as Company;

    render(<RelatedCompanyCard company={noMetricsCompany} />);
    expect(screen.getAllByText('S/N').length).toBe(2);
    expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });

  it('does not render QuoteCTA when free plan', () => {
    (hasPaidPlan as jest.Mock).mockReturnValue(false);
    render(<RelatedCompanyCard company={mockCompany} />);
    expect(screen.queryByText(/Solicitar orçamento/i)).not.toBeInTheDocument();
  });

  it('renders QuoteCTA when paid plan', () => {
    (hasPaidPlan as jest.Mock).mockReturnValue(true);
    render(<RelatedCompanyCard company={mockCompany} />);
    expect(screen.getByText(/Solicitar orçamento/i)).toBeInTheDocument();
  });

  it('toggles comparison on click', () => {
    const toggleMock = jest.fn();
    (useComparison as jest.Mock).mockReturnValue({
      isInComparison: jest.fn().mockReturnValue(false),
      toggleComparison: toggleMock,
      canAddMore: true,
    });

    render(<RelatedCompanyCard company={mockCompany} />);
    const compareBtn = screen.getByText('Comparar');
    fireEvent.click(compareBtn);

    expect(toggleMock).toHaveBeenCalledWith(mockCompany);
  });
});
