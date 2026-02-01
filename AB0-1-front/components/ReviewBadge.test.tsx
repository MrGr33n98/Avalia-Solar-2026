import { render, screen } from '@testing-library/react';
import CompanyCard from './CompanyCard';
import { Company } from '@/lib/api';

// Mocking hooks and next modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: jest.fn().mockReturnValue(false),
    toggleFavorite: jest.fn(),
  }),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: jest.fn().mockReturnValue(false),
    addToComparison: jest.fn(),
    removeFromComparison: jest.fn(),
  }),
}));

const mockCompany: Company = {
  id: 1,
  name: 'Solar Tech',
  description: 'Empresa líder em energia solar',
  website: 'https://solartech.com',
  phone: '(11) 99999-9999',
  address: 'Rua Solar, 123',
  city: 'São Paulo',
  state: 'SP',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  status: 'active',
  verified: true,
  rating_count: 15,
  average_rating: 4.5,
  slug: 'solar-tech'
};

describe('CompanyCard Review Badge', () => {
  it('exibe o badge com o número correto de reviews', () => {
    render(<CompanyCard company={mockCompany} />);
    const badge = screen.getByText('15');
    expect(badge).toBeInTheDocument();
  });

  it('não exibe o badge quando não há reviews', () => {
    const companyNoReviews = { ...mockCompany, rating_count: 0 };
    render(<CompanyCard company={companyNoReviews} />);
    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  it('não exibe o botão de coração (favorito)', () => {
    render(<CompanyCard company={mockCompany} />);
    const heartIcon = screen.queryByTitle(/favoritos/i);
    expect(heartIcon).not.toBeInTheDocument();
  });

  it('atualiza o badge dinamicamente quando a prop rating_count muda', () => {
    const { rerender } = render(<CompanyCard company={mockCompany} />);
    expect(screen.getByText('15')).toBeInTheDocument();

    const updatedCompany = { ...mockCompany, rating_count: 20 };
    rerender(<CompanyCard company={updatedCompany} />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });
});
