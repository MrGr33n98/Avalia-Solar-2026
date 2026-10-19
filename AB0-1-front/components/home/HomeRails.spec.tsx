import * as React from 'react';
import { render, screen } from '@testing-library/react';
import type { Company } from '@/lib/api';
import { HomeCategoryRail } from './HomeCategoryRail';
import { HomeCompaniesRail, HomeCompanyCard } from './HomeCompaniesRail';
import { HomeSolutionsRail } from './HomeSolutionsRail';
import { fireEvent } from '@testing-library/react';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    alt = '',
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock('@/components/company/CompanyVerifiedBadge', () => ({
  CompanyVerifiedBadge: () => <span aria-label="Empresa verificada" />,
}));

jest.mock('@/components/favorites/FavoriteButton', () => ({
  FavoriteButton: () => <button type="button" aria-label="Favoritar empresa" />,
}));

jest.mock('@/components/ComparisonToggleButton', () => ({
  __esModule: true,
  default: ({ company, variant }: { company: Company; variant?: string }) => (
    <label data-variant={variant}>
      <input
        type="checkbox"
        aria-label={`Adicionar ${company.name} à comparação`}
      />
      <span>Comparar</span>
    </label>
  ),
}));

jest.mock('@/lib/slug', () => ({
  buildCompanyPath: (_slug: string, _name: string, id: number) => `/companies/${id}`,
}));

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 1,
    slug: 'empresa-solar',
    name: 'Empresa Solar',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    verified: true,
    category: 'Energia solar',
    description: 'Empresa de energia solar',
    website: '',
    phone: '',
    address: '',
    created_at: '',
    updated_at: '',
    ...overrides,
  } as Company;
}

describe('rails de identidade visual da home', () => {
  it('preserva o logo com sizes responsivo, sem padding forçado e disponibiliza favorito e comparação', () => {
    render(
      <HomeCompaniesRail
        companies={[
          makeCompany({ id: 1, name: 'Sungrow Brasil', logo_url: '/sungrow.png' }),
          makeCompany({
            id: 2,
            name: 'Growatt Brasil',
            logo_url: '/growatt.png',
            banner_url: '/growatt-banner.png',
          }),
        ]}
      />
    );

    const logo = screen.getByAltText('Logotipo Sungrow Brasil');
    expect(logo).toHaveClass('object-contain', 'object-center');
    expect(logo).not.toHaveClass('p-1');
    expect(logo).toHaveAttribute('sizes', '(min-width: 1024px) 44px, (min-width: 640px) 56px, 48px');
    expect(logo.getAttribute('src')).toBe('/sungrow.png');

    const logoLink = logo.closest('a');
    expect(logoLink).not.toBeNull();
    expect(logoLink).toHaveClass('h-12', 'w-12', 'sm:h-14', 'sm:w-14', 'lg:h-11', 'lg:w-11');

    expect(screen.getAllByRole('button', { name: 'Favoritar empresa' })).toHaveLength(2);
    expect(screen.getByRole('checkbox', { name: 'Adicionar Sungrow Brasil à comparação' })).toBeInTheDocument();
  });

  it('exibe fallback Building2 quando a empresa não possui logo', () => {
    render(
      <HomeCompaniesRail
        companies={[makeCompany({ id: 1, name: 'Empresa Sem Logo', logo_url: '' })]}
      />
    );

    expect(screen.queryByAltText('Logotipo Empresa Sem Logo')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Logotipo não informado')).toBeInTheDocument();
  });

  it('exibe fallback Building2 quando ocorre erro no carregamento da imagem', () => {
    render(
      <HomeCompanyCard
        company={makeCompany({ id: 1, name: 'Empresa Imagem Quebrada', logo_url: '/broken.png' })}
      />
    );

    const logo = screen.getByAltText('Logotipo Empresa Imagem Quebrada');
    expect(logo).toBeInTheDocument();

    fireEvent.error(logo);

    expect(screen.queryByAltText('Logotipo Empresa Imagem Quebrada')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Logotipo não informado')).toBeInTheDocument();
  });

  it('não renderiza seção Marcas em destaque e preserva Empresas em destaque', () => {
    render(
      <HomeCompaniesRail
        companies={[makeCompany({ id: 1, name: 'Empresa Solar' })]}
      />
    );

    expect(screen.getByText('Empresas em destaque')).toBeInTheDocument();
    expect(screen.queryByText('Marcas em destaque')).not.toBeInTheDocument();
  });

  it('com até 12 empresas, limita o rail a exatamente nove cards (IDs 1..9), com cards 7..9 marcados com hidden para mobile', () => {
    const companies = Array.from({ length: 12 }, (_, index) =>
      makeCompany({ id: index + 1, name: `Empresa ${index + 1}` })
    );

    render(<HomeCompaniesRail companies={companies} />);

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(9);
    expect(screen.queryByText('Empresa 10')).not.toBeInTheDocument();

    // Cards 1..6 são visíveis tanto no mobile quanto no desktop
    for (let i = 0; i < 6; i++) {
      expect(articles[i]).toHaveClass('flex', 'flex-col', 'lg:grid');
      expect(articles[i]).not.toHaveClass('hidden');
    }

    // Cards 7..9 são ocultos no mobile (hidden) e visíveis no desktop (lg:grid)
    for (let i = 6; i < 9; i++) {
      expect(articles[i]).toHaveClass('hidden', 'lg:grid');
    }
  });

  it('exibe exatamente a quantidade recebida quando menor que nove e não renderiza nada se vazio', () => {
    const { rerender } = render(
      <HomeCompaniesRail
        companies={Array.from({ length: 5 }, (_, i) => makeCompany({ id: i + 1, name: `E5 ${i + 1}` }))}
      />
    );
    expect(screen.getAllByRole('article')).toHaveLength(5);

    rerender(
      <HomeCompaniesRail
        companies={Array.from({ length: 8 }, (_, i) => makeCompany({ id: i + 1, name: `E8 ${i + 1}` }))}
      />
    );
    expect(screen.getAllByRole('article')).toHaveLength(8);

    const { container } = render(<HomeCompaniesRail companies={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza categorias em destaque como chips horizontais compactos', () => {
    render(<HomeCategoryRail categories={[]} />);

    expect(screen.getByText('Categorias em destaque')).toBeInTheDocument();
    expect(screen.getByText('Energia Solar')).toBeInTheDocument();
    expect(screen.getByText('Mobilidade Elétrica')).toBeInTheDocument();
  });

  it('renderiza tipos de solução oficiais como chips horizontais compactos', () => {
    render(<HomeSolutionsRail />);

    expect(screen.getByText('Tipos de solução')).toBeInTheDocument();
    expect(screen.getByText('Painéis Solares')).toBeInTheDocument();
    expect(screen.getByText('Inversores')).toBeInTheDocument();
  });

  it('ancora selo verificado dentro do tail para empresa verificada', () => {
    render(
      <HomeCompaniesRail
        companies={[
          makeCompany({
            id: 1,
            name: 'Sicoob - Crédito Sustentável',
            verified: true,
          }),
        ]}
      />
    );

    const tail = screen.getByTestId('company-name-tail');
    expect(tail).toBeInTheDocument();
    expect(tail).toHaveTextContent('tentável');

    const badgeAnchor = screen.getByTestId('verified-badge-anchor');
    expect(badgeAnchor).toBeInTheDocument();
    expect(tail).toContainElement(badgeAnchor);
    expect(screen.getByText(/Sicoob - Crédito Sus/)).toBeInTheDocument();
  });

  it('não renderiza selo de verificação quando verified é false', () => {
    render(
      <HomeCompaniesRail
        companies={[
          makeCompany({
            id: 2,
            name: 'Growatt Sem Selo',
            verified: false,
          }),
        ]}
      />
    );

    expect(screen.queryByTestId('verified-badge-anchor')).not.toBeInTheDocument();
    expect(screen.getByText('Growatt Sem Selo')).toBeInTheDocument();
  });

  it('passa variante home-compact para o botão de comparação', () => {
    render(
      <HomeCompaniesRail
        companies={[makeCompany({ id: 1, name: 'Cymaz Solar', verified: true })]}
      />
    );

    const compareControl = screen.getByRole('checkbox', { name: 'Adicionar Cymaz Solar à comparação' });
    expect(compareControl.closest('label')).toHaveAttribute('data-variant', 'home-compact');
  });

  it('exibe Sem avaliações quando não há reviews confirmados', () => {
    render(
      <HomeCompaniesRail
        companies={[
          makeCompany({
            id: 1,
            name: 'Nova Solar',
            average_rating: 0,
            rating_count: 0,
          }),
        ]}
      />
    );

    expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
    expect(screen.queryByText('5.0')).not.toBeInTheDocument();
  });

  it('exibe nota e contagem quando há reviews confirmados', () => {
    render(
      <HomeCompaniesRail
        companies={[
          makeCompany({
            id: 1,
            name: 'Top Solar',
            average_rating: 4.9,
            rating_count: 28,
          }),
        ]}
      />
    );

    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(28)')).toBeInTheDocument();
  });
});
