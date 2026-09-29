import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanyIdentityCard from '@/app/companies/[id]/components/CompanyIdentityCard';

const mockToggleFavorite = jest.fn();

jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: jest.fn().mockReturnValue(false),
    toggleFavorite: mockToggleFavorite,
  }),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ views_count: 42 }),
    })
  ) as any;
});

const mockCompany = {
  id: 1,
  name: 'SB Solar',
  slug: 'sb-solar',
  city: 'São João da Boa Vista',
  state: 'SP',
  verified: true,
  description: 'Distribuidora nacional de equipamentos fotovoltaicos',
} as any;

describe('CompanyIdentityCard Responsive Layout', () => {
  test('renders logo and company details in flex-row wrapper from mobile', () => {
    const { container } = render(
      <CompanyIdentityCard
        company={mockCompany}
        companyStats={{ rating: '4.8', reviewCount: 15 }}
        logoUrl="/images/sb-solar.jpg"
        logoError={false}
        setLogoError={jest.fn()}
      />
    );

    const section = container.querySelector('#company-identity-card');
    expect(section).toBeInTheDocument();

    const mainWrapper = section?.querySelector('.flex.min-w-0.flex-row');
    expect(mainWrapper).toBeInTheDocument();
    expect(mainWrapper).toHaveClass('flex-row');
  });

  test('renders company name, location, rating, favorite and share action buttons', () => {
    render(
      <CompanyIdentityCard
        company={mockCompany}
        companyStats={{ rating: '4.8', reviewCount: 15 }}
        logoUrl="/images/sb-solar.jpg"
        logoError={false}
        setLogoError={jest.fn()}
      />
    );

    expect(screen.getByText('SB Solar')).toBeInTheDocument();
    expect(screen.getByText('São João da Boa Vista, SP')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();

    const favButton = screen.getByLabelText('Favoritar empresa');
    expect(favButton).toBeInTheDocument();
    fireEvent.click(favButton);
    expect(mockToggleFavorite).toHaveBeenCalledWith(1);

    expect(screen.getByLabelText('Compartilhar empresa')).toBeInTheDocument();
  });
});
