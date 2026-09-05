import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RelatedCompaniesCarousel from './RelatedCompaniesCarousel';
import { Company } from '@/lib/api';
import { hasPaidPlan } from '@/lib/feature-access';
import { companiesApiSafe } from '@/lib/api-client';

jest.mock('@/lib/feature-access', () => ({
  hasPaidPlan: jest.fn(),
}));

jest.mock('@/lib/api-client', () => ({
  companiesApiSafe: {
    getAllPaginated: jest.fn(),
  },
}));

jest.mock('./RelatedCompanyCard', () => {
  return function DummyRelatedCompanyCard({ company }: { company: { id: number; name: string } }) {
    return <div data-testid={`related-card-${company.id}`}>{company.name}</div>;
  };
});

const mockCurrentCompany = {
  id: 100,
  name: 'Empresa Atual',
  category_info: { id: 1, name: 'Solar' },
} as unknown as Company;

const mockRelatedCompaniesResponse = {
  data: [
    { id: 100, name: 'Empresa Atual' }, // Should be filtered out
    { id: 101, name: 'Rel 1' },
    { id: 102, name: 'Rel 2' },
    { id: 103, name: 'Rel 3' },
    { id: 104, name: 'Rel 4' },
    { id: 105, name: 'Rel 5' },
    { id: 106, name: 'Rel 6' }, // Should be sliced out (max 5)
  ],
};

describe('RelatedCompaniesCarousel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (hasPaidPlan as jest.Mock).mockReturnValue(false);
    (companiesApiSafe.getAllPaginated as jest.Mock).mockResolvedValue(mockRelatedCompaniesResponse);
  });

  it('renders nothing if showAlternatives is false', () => {
    render(
      <RelatedCompaniesCarousel company={mockCurrentCompany} showAlternatives={false} relatedCompanies={[]} loading={false} />
    );
    // It should render the "Perfil Protegido Exclusivo" if showAlternatives is false
    expect(screen.getByText(/Perfil Protegido Exclusivo/i)).toBeInTheDocument();
  });

  it('returns null if paid plan is true despite showAlternatives being true', () => {
    (hasPaidPlan as jest.Mock).mockReturnValue(true);
    const { container } = render(<RelatedCompaniesCarousel company={mockCurrentCompany} showAlternatives={true} relatedCompanies={[]} loading={false} />);
    
    expect(container).toBeEmptyDOMElement();
    expect(companiesApiSafe.getAllPaginated).not.toHaveBeenCalled();
  });

  it('renders related companies, excluding the current company and slicing to 5', () => {
    const mockCompanies = mockRelatedCompaniesResponse.data
      .filter((c) => c.id !== mockCurrentCompany.id)
      .slice(0, 5) as unknown as Company[];

    render(
      <RelatedCompaniesCarousel
        company={mockCurrentCompany}
        showAlternatives={true}
        relatedCompanies={mockCompanies}
        loading={false}
      />
    );

    // Should not render the current company
    expect(screen.queryByTestId('related-card-100')).not.toBeInTheDocument();

    // Should render exactly 5 cards
    expect(screen.getByTestId('related-card-101')).toBeInTheDocument();
    expect(screen.getByTestId('related-card-105')).toBeInTheDocument();
    expect(screen.queryByTestId('related-card-106')).not.toBeInTheDocument();
  });
});
