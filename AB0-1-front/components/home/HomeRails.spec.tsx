import * as React from 'react';
import { render, screen } from '@testing-library/react';
import type { Company } from '@/lib/api';
import { BrandLogoCard } from './HomeBrandsRail';
import { HomeCompaniesRail } from './HomeCompaniesRail';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    alt = '',
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
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
  it('maximiza logos no rail compacto de marcas sem trocar o object-contain', () => {
    render(<BrandLogoCard name="Sungrow" logoUrl="/sungrow.png" href="/companies/sungrow" />);

    const logo = screen.getByAltText('Sungrow');

    expect(logo).toHaveClass('object-contain', 'p-0.5');
    expect(logo).not.toHaveClass('p-[3px]');
    expect(logo).toHaveAttribute('sizes', '104px');
  });

  it('usa toda a área do card para logo e mantém banner como capa', () => {
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
    const banner = screen.getByAltText('Imagem de capa de Growatt Brasil');

    expect(logo).toHaveClass('object-contain', 'p-2');
    expect(logo).toHaveAttribute('sizes', '(max-width: 640px) 210px, 230px');
    expect(logo.parentElement).toHaveClass('relative', 'h-full', 'w-full');
    expect(banner).toHaveClass('object-cover', 'object-center');
    expect(banner).toHaveAttribute('sizes', '(max-width: 640px) 210px, 230px');
  });
});
