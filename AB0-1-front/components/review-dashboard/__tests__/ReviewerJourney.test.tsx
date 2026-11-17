import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/lib/mvp-reviews', () => ({
  REVIEWS_ONLY_MVP: true,
  CREATOR_EXPERIENCE_ENABLED: false,
  SOCIAL_FEED_ENABLED: false,
}));

jest.mock('@/contexts/AuthContext');

import {
  reviewerNavItems,
  mobileBottomNavItems,
  mobileDrawerItems,
  isNavItemActive,
} from '../reviewerNavigation';
import { ReviewerIdentityCard } from '../layout/ReviewerIdentityCard';

const mockedUseAuth = useAuth as jest.Mock;

describe('Reviewer Dashboard — navegação integrada (MVP)', () => {
  it('oferece as quatro rotas autorizadas no desktop, sem Creator, CRM ou placeholder', () => {
    expect(reviewerNavItems.map(item => item.id)).toEqual([
      'dashboard',
      'reviews',
      'solutions',
      'profile',
    ]);
    expect(reviewerNavItems.map(item => item.href)).toEqual([
      '/review-dashboard',
      '/review-dashboard/reviews',
      '/review-dashboard/solutions',
      '/review-dashboard/profile',
    ]);
  });

  it('preserva três destinos no bottom nav e soluções no drawer mobile', () => {
    expect(mobileBottomNavItems.map(item => item.id)).toEqual([
      'dashboard',
      'reviews',
      'profile',
    ]);
    expect(mobileDrawerItems.map(item => item.id)).toEqual(['solutions']);
  });

  it('destaca a página ativa sem tratar páginas filhas como overview', () => {
    const overview = reviewerNavItems.find(item => item.id === 'dashboard')!;
    const profile = reviewerNavItems.find(item => item.id === 'profile')!;
    expect(isNavItemActive('/review-dashboard', overview)).toBe(true);
    expect(isNavItemActive('/review-dashboard/profile', overview)).toBe(false);
    expect(isNavItemActive('/review-dashboard/profile', profile)).toBe(true);
  });
});

describe('Reviewer Identity Card — fonte confiável', () => {
  beforeEach(() => mockedUseAuth.mockReset());

  it('mostra a identidade real e só os campos disponíveis, sem confiança fictícia', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 7,
        name: 'Ana Ribeiro',
        role: 'review',
        created_at: '2026-05-18T12:00:00Z',
        avatar_url: null,
      },
      reviewerProfile: {
        profession: 'Engenheira',
        company_name: 'Solar Norte',
      },
    });

    render(<ReviewerIdentityCard />);

    expect(screen.getByTestId('reviewer-identity-card')).toBeInTheDocument();
    expect(screen.getByText('Ana Ribeiro')).toBeInTheDocument();
    expect(screen.getByText('Engenheira')).toBeInTheDocument();
    expect(screen.getByText('Solar Norte')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar meus dados de perfil' }))
      .toHaveAttribute('href', '/review-dashboard/profile');
    expect(screen.queryByText('Profissional Verificado')).not.toBeInTheDocument();
    expect(screen.queryByText(/Trust Score/i)).not.toBeInTheDocument();
  });

  it('não inventa profissão, empresa, data ou score quando ausentes', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 8, name: 'Carlos', role: 'review', created_at: null, avatar_url: null },
      reviewerProfile: null,
    });

    render(<ReviewerIdentityCard />);

    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.queryByText(/Membro desde/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Trust Score/i)).not.toBeInTheDocument();
  });

  it('não renderiza o cartão para um usuário empresarial', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 9, name: 'Empresa X', role: 'company', avatar_url: null },
      reviewerProfile: null,
    });

    const { container } = render(<ReviewerIdentityCard />);
    expect(container).toBeEmptyDOMElement();
  });
});
