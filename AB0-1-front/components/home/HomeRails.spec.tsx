import * as React from 'react';
import { render, screen } from '@testing-library/react';
import type { Company } from '@/lib/api';
import { BrandLogoCard } from './HomeBrandsRail';
import { HomeCategoryRail } from './HomeCategoryRail';
import { HomeCompaniesRail } from './HomeCompaniesRail';
import { HomeSolutionsRail } from './HomeSolutionsRail';

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
    <button type="button" aria-label={`Comparar ${company.name}`} data-variant={variant}>
      Comparar
    </button>
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
  it('renderiza logos de marcas sem recorte', () => {
    render(<BrandLogoCard name="Sungrow" logoUrl="/sungrow.png" href="/companies/sungrow" />);

    const logo = screen.getByAltText('Sungrow');

    expect(logo).toHaveClass('object-contain', 'object-center');
    expect(logo).not.toHaveClass('object-cover');
    expect(logo).toHaveAttribute('sizes', '128px');
  });

  it('preserva o logo e disponibiliza favorito e comparação no card', () => {
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
    expect(logo).toHaveClass('object-contain');
    expect(logo).toHaveAttribute('sizes', '44px');
    expect(screen.getAllByRole('button', { name: 'Favoritar empresa' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Comparar Sungrow Brasil' })).toBeInTheDocument();
  });

  it('limita a vitrine a seis empresas', () => {
    const companies = Array.from({ length: 7 }, (_, index) =>
      makeCompany({ id: index + 1, name: `Empresa ${index + 1}` })
    );

    render(<HomeCompaniesRail companies={companies} />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.queryByText('Empresa 7')).not.toBeInTheDocument();
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

    const compareBtn = screen.getByRole('button', { name: 'Comparar Cymaz Solar' });
    expect(compareBtn).toHaveAttribute('data-variant', 'home-compact');
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
