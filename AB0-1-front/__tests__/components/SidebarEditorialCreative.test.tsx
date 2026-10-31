import { render, screen } from '@testing-library/react';
import { SidebarEditorialCreative } from '@/components/banners/SidebarEditorialCreative';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, className, ...props }: React.ComponentProps<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} className={className} {...props} />
  ),
}));

describe('SidebarEditorialCreative', () => {
  const sampleBanner = {
    id: 101,
    title: 'Campanha Solar Verão',
    headline: 'Economize até 95% na sua fatura de luz',
    subtitle: 'Com tecnologia solar homologada pelos maiores fabricantes.',
    cta_label: 'Simular Economia',
    cta_href: '/calculadora',
    sponsored: true,
    creative_mode: 'photo_with_html',
    image_url: null,
    benefits: ['Garantia de 25 anos', 'Monitoramento via App', 'Instalação rápida'],
  };

  it('renderiza os textos aprovados, lista de benefícios e CTA outline sem inventar conteúdo', () => {
    render(<SidebarEditorialCreative banner={sampleBanner} />);

    expect(screen.getByText('Economize até 95% na sua fatura de luz')).toBeInTheDocument();
    expect(
      screen.getByText('Com tecnologia solar homologada pelos maiores fabricantes.')
    ).toBeInTheDocument();
    expect(screen.getByText('Garantia de 25 anos')).toBeInTheDocument();
    expect(screen.getByText('Monitoramento via App')).toBeInTheDocument();
    expect(screen.getByText('Instalação rápida')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Simular Economia' })).toHaveAttribute(
      'href',
      '/api/v1/banner_clicks/101'
    );
  });

  it('exibe o selo de patrocinado quando sponsored é true', () => {
    render(<SidebarEditorialCreative banner={sampleBanner} />);
    expect(screen.getByTestId('sponsored-badge')).toHaveTextContent('Patrocinado');
  });

  it('NUNCA renderiza o texto técnico "Banner Placeholder" para os usuários públicos', () => {
    render(<SidebarEditorialCreative banner={sampleBanner} />);
    expect(screen.queryByText(/banner placeholder/i)).not.toBeInTheDocument();
  });
});
