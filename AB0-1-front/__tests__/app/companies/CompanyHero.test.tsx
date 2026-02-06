import { render, screen } from '@testing-library/react';
import CompanyHero from '@/app/companies/[id]/components/CompanyHero';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: () => false,
    addToComparison: jest.fn(),
    removeFromComparison: jest.fn(),
  }),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/components/ui/optimized-image', () => ({
  OptimizedImage: (props: any) => <img {...props} alt={props.alt || 'img'} />,
}));

jest.mock('@/components/RatingStars', () => ({
  RatingStars: () => <div data-testid="rating-stars" />,
}));

jest.mock('@/components/WhatsappButton', () => (props: any) => (
  <button type="button">{props.label || 'WhatsApp'}</button>
));

const baseCompany = {
  id: 1,
  name: 'Empresa Teste',
  description: 'Descricao',
  slug: 'empresa-teste',
  verified: false,
};

const baseProps = {
  companyStats: { rating: 4.5, reviewCount: 10 },
  bannerUrl: null,
  bannerError: false,
  setBannerError: jest.fn(),
  logoUrl: null,
  logoError: false,
  setLogoError: jest.fn(),
  ctaEnabled: false,
  ctaUrl: null,
};

describe('CompanyHero', () => {
  it('mostra apenas Avaliar quando active_admin esta false', () => {
    render(
      <CompanyHero
        {...baseProps}
        company={{ ...(baseCompany as any), active_admin: false }}
      />
    );

    expect(screen.getByRole('link', { name: /Avaliar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /orcamento/i })).not.toBeInTheDocument();
  });

  it('mostra Orcamento quando active_admin esta true', () => {
    render(
      <CompanyHero
        {...baseProps}
        company={{ ...(baseCompany as any), active_admin: true }}
      />
    );

    expect(screen.getByRole('button', { name: /orcamento/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Avaliar/i })).not.toBeInTheDocument();
  });
});
