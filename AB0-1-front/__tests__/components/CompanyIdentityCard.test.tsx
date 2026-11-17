import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanyIdentityCard from '@/app/companies/[id]/components/CompanyIdentityCard';

jest.mock('@/app/companies/[id]/components/CompanyViewCounter', () => () => (
  <span data-testid="company-views">42 visualizações</span>
));

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
  test('uses a mobile row, preserves the tablet stack and desktop row', () => {
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

    const mainWrapper = section?.querySelector('.flex.w-full.flex-row');
    expect(mainWrapper).toBeInTheDocument();
    expect(mainWrapper).toHaveClass('flex-row', 'md:flex-col', 'lg:flex-row');
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

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/SB\s+Solar/);
    expect(screen.getByText('São João da Boa Vista, SP')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();

    const favButton = screen.getByLabelText('Favoritar empresa');
    expect(favButton).toBeInTheDocument();
    fireEvent.click(favButton);
    expect(mockToggleFavorite).toHaveBeenCalledWith(1);

    expect(screen.getByLabelText('Compartilhar empresa')).toBeInTheDocument();
  });

  test('keeps long company names on one mobile line while retaining full semantics', () => {
    const longName = 'Cooperativa Regional de Energia Solar Fotovoltaica Sustentável e Tecnologia';
    render(
      <CompanyIdentityCard
        company={{ ...mockCompany, name: longName }}
        companyStats={{ rating: '4.8', reviewCount: 15 }}
        logoUrl="/images/sb-solar.jpg"
        logoError={false}
        setLogoError={jest.fn()}
      />
    );

    const heading = screen.getByTestId('company-name');
    expect(heading).toHaveAttribute('title', longName);
    expect(heading).toHaveAttribute('aria-label', longName);
    expect(heading).toHaveClass('flex', 'md:block');
    expect(screen.getByTestId('company-name-text')).toHaveClass(
      'min-w-0', 'truncate', 'md:whitespace-normal', 'md:break-words'
    );
    const iconActions = screen.getByTestId('company-quick-icon-actions');
    expect(iconActions).toHaveClass('shrink-0', 'gap-0');
    expect(screen.getByTestId('company-quick-actions')).toHaveClass(
      'flex-col-reverse', 'md:flex-row'
    );
  });
  test('only invites the first review when there are no approved reviews', () => {
    render(
      <CompanyIdentityCard
        company={mockCompany}
        companyStats={{ rating: '0', reviewCount: 0 }}
        logoUrl={null}
        logoError={false}
        setLogoError={jest.fn()}
      />
    );

    expect(screen.queryByText(/Sem avaliações/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Novo perfil/)).not.toBeInTheDocument();
    const firstReviewLink = screen.getByRole('link', { name: 'Seja o primeiro a avaliar' });
    expect(firstReviewLink).toHaveAttribute('href', expect.stringContaining('/review'));
  });

});
