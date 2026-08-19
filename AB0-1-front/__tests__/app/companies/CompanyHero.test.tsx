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
  ctaEnabled: false,
  ctaUrl: null,
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
      <CompanyHero {...baseProps} company={{ ...(baseCompany as any), active_admin: true }} />
    );

    expect(screen.getByRole('button', { name: /solicitar orçamento/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Avaliar/i })).not.toBeInTheDocument();
  });

  it('aplica hierarquia visual de ctas com utilitarios ghost e whatsapp outline', () => {
    render(
      <CompanyHero
        {...baseProps}
        ctaEnabled
        ctaUrl="https://wa.me/5511999999999"
        company={{ ...(baseCompany as any), active_admin: true, verified: true }}
      />
    );

    const shareButton = screen.getByRole('button', { name: /compartilhar perfil/i });
    const compareButton = screen.getByRole('button', { name: /comparar/i });
    const whatsappButton = screen.getByRole('button', { name: /whatsapp/i });
    const quoteButton = screen.getByRole('button', { name: /solicitar orçamento/i });

    expect(shareButton).toHaveClass('bg-transparent');
    expect(shareButton).toHaveClass('border-none');
    expect(compareButton).toHaveClass('bg-transparent');
    expect(compareButton).toHaveClass('border-none');
    expect(whatsappButton).toHaveClass('border-emerald-500');
    expect(whatsappButton).toHaveClass('text-emerald-700');
    expect(quoteButton).toHaveClass('bg-blue-700');
    expect(quoteButton).toHaveClass('text-white');
  });

  it('renderiza o card flutuante de perfil com nome e sem descricao interna', () => {
    render(
      <CompanyHero
        {...baseProps}
        company={{ ...(baseCompany as any), active_admin: true, verified: true }}
      />
    );

    expect(screen.getByLabelText('Card de perfil da empresa')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Empresa Teste' })).toBeInTheDocument();
    expect(screen.queryByText('Descricao')).not.toBeInTheDocument();
    expect(screen.getByText('4.5/5.0')).toBeInTheDocument();
    expect(screen.getByAltText('Empresa Teste')).toHaveClass('rounded-full');
    expect(screen.getByAltText('Empresa Teste')).toHaveClass('object-cover');
  });
});
