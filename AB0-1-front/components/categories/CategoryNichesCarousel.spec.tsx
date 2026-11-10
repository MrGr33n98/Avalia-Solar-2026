import * as React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryNichesCarousel from './CategoryNichesCarousel';

const MERCADO_LIVRE_NICHES = [
  {
    id: 101,
    name: 'Comercializadoras Varejistas de Energia',
    seo_url: 'comercializadoras-varejistas-de-energia',
    status: 'active',
  },
  {
    id: 102,
    name: 'Compra de Energia e Contratos de Longo Prazo',
    seo_url: 'compra-de-energia-e-contratos-de-longo-prazo',
    status: 'active',
  },
  {
    id: 103,
    name: 'Consultoria para Migração ao Mercado Livre',
    seo_url: 'consultoria-para-migracao-ao-mercado-livre',
    status: 'active',
  },
  {
    id: 104,
    name: 'Energia Renovável e Certificados de Origem',
    seo_url: 'energia-renovavel-e-certificados-de-origem',
    status: 'active',
  },
  {
    id: 105,
    name: 'Gestão de Energia no Mercado Livre',
    seo_url: 'gestao-de-energia-no-mercado-livre',
    status: 'active',
  },
  {
    id: 106,
    name: 'Gestão de Riscos e Portfólio de Energia',
    seo_url: 'gestao-de-riscos-e-portfolio-de-energia',
    status: 'active',
  },
  {
    id: 107,
    name: 'Medição e Adequação para o Mercado Livre',
    seo_url: 'medicao-e-adequacao-para-o-mercado-livre',
    status: 'active',
  },
  {
    id: 108,
    name: 'Software para Gestão de Energia no ACL',
    seo_url: 'software-para-gestao-de-energia-no-acl',
    status: 'active',
  },
];

describe('CategoryNichesCarousel — Layout e Legibilidade de Nichos', () => {
  it('renderiza nada quando a lista de nichos é vazia ou nula', () => {
    const { container: empty } = render(<CategoryNichesCarousel niches={[]} />);
    expect(empty.firstChild).toBeNull();

    const { container: undefinedNiches } = render(<CategoryNichesCarousel />);
    expect(undefinedNiches.firstChild).toBeNull();
  });

  it('exibe todos os 8 nichos do Mercado Livre de Energia com nomes completos e sem line-clamp', () => {
    render(<CategoryNichesCarousel niches={MERCADO_LIVRE_NICHES} />);

    expect(screen.getByRole('heading', { name: /Explorar Nichos/i })).toBeInTheDocument();

    for (const niche of MERCADO_LIVRE_NICHES) {
      const link = screen.getByRole('link', { name: new RegExp(niche.name, 'i') });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', `/categories/${niche.seo_url}`);

      const labelSpan = screen.getByText(niche.name);
      expect(labelSpan).toBeInTheDocument();
      expect(labelSpan).not.toHaveClass('line-clamp-2');
      expect(labelSpan).not.toHaveClass('line-clamp-3');
      expect(labelSpan).not.toHaveClass('truncate');
      expect(labelSpan).toHaveClass('text-[11px]', 'sm:text-xs', 'font-medium');
    }
  });

  it('aplica classes responsivas adequadas (largura flexível e grid desktop para 8 itens)', () => {
    const { container } = render(<CategoryNichesCarousel niches={MERCADO_LIVRE_NICHES} />);

    const links = screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('/categories'));
    expect(links).toHaveLength(8 + 1); // 8 nichos + 1 "Ver todos"

    const firstNicheLink = screen.getByRole('link', {
      name: new RegExp(MERCADO_LIVRE_NICHES[0].name, 'i'),
    });
    expect(firstNicheLink).toHaveClass('w-[116px]', 'sm:w-[136px]', 'xl:w-full');

    const innerGrid = container.querySelector('[role="region"] > div');
    expect(innerGrid).not.toBeNull();
    expect(innerGrid).toHaveClass('xl:grid');
    expect(innerGrid).toHaveStyle({ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' });
  });

  it('preserva os atalhos de categorias solares legadas em SHORT_NAME_BY_LONG_NAME', () => {
    render(
      <CategoryNichesCarousel
        niches={[
          {
            id: 1,
            name: 'Energia Solar Residencial',
            seo_url: 'energia-solar-residencial',
            status: 'active',
          },
          {
            id: 2,
            name: 'Energia Solar Comercial e Industrial',
            seo_url: 'energia-solar-comercial-industrial',
            status: 'active',
          },
        ]}
      />
    );

    expect(screen.getByText('Residencial')).toBeInTheDocument();
    expect(screen.getByText('Comercial e Industrial')).toBeInTheDocument();
  });
});
