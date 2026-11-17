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
  OptimizedImage: ({ src, alt, className, width, height }: any) => (
    <img src={src} alt={alt || 'img'} className={className} width={width} height={height} />
  ),
}));

jest.mock('@/components/WhatsappButton', () => (props: any) => (
  <button type="button" className={props.className}>
    {props.label || 'WhatsApp'}
  </button>
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
};

describe('CompanyHero', () => {
  it('mostra apenas Avaliar quando active_admin esta false', () => {
    render(
      <CompanyHero {...baseProps} company={{ ...(baseCompany as any), active_admin: false }} />
    );

    expect(screen.getByRole('link', { name: /Avaliar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /orçamento/i })).not.toBeInTheDocument();
  });

  it('mostra Orcamento quando active_admin esta true', () => {
    render(
      <CompanyHero {...baseProps} canRequestQuote company={{ ...(baseCompany as any), active_admin: true }} />
    );

    expect(screen.getByRole('button', { name: /solicitar orçamento/i })).toBeInTheDocument();
  });

  it('mantém o WhatsApp somente na seção de contato, sem duplicação no hero', () => {
    render(
      <CompanyHero
        {...baseProps}
        canRequestQuote
        company={{ ...(baseCompany as any), active_admin: true, verified: true }}
      />
    );

    expect(screen.queryByRole('button', { name: /whatsapp/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /solicitar orçamento/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Avaliar/i })).toBeInTheDocument();
  });

  it('preserva a identidade visual da empresa sem duplicar informações de contato', () => {
    render(
      <CompanyHero
        {...baseProps}
        company={{ ...(baseCompany as any), verified: true }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Empresa Teste' })).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('10 avaliações')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /whatsapp/i })).not.toBeInTheDocument();
  });

});
