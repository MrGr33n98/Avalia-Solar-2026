import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CompanyCatalogShowcase, {
  CatalogTab,
  ShowcaseData,
} from '@/app/companies/[id]/components/CompanyCatalogShowcase';
import CatalogItemCard, { CatalogItem } from '@/app/companies/[id]/components/CatalogItemCard';
import * as api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn(),
}));

describe('CompanyCatalogShowcase', () => {
  const mockTabs: CatalogTab[] = [
    { key: 'all', label: 'Todos', count: 3 },
    { key: 'category:1', label: 'Inversores', count: 2 },
    { key: 'services', label: 'Serviços', count: 1 },
  ];

  const mockItems: CatalogItem[] = [
    {
      id: 'product:101',
      type: 'product',
      product_id: 101,
      name: 'Inversor Híbrido 5kW',
      short_description: 'Eficiência de 97.5%',
      image_url: 'https://example.com/inv.jpg',
      category: { id: 1, name: 'Inversores', slug: 'inversores' },
      position: 1,
      cta: { label: 'Ver produto', href: '/products/101-inversor-hibrido-5kw' },
    },
    {
      id: 'product:102',
      type: 'product',
      product_id: 102,
      name: 'Microinversor 2kW',
      short_description: 'Monitoramento individual',
      image_url: null,
      category: { id: 1, name: 'Inversores', slug: 'inversores' },
      position: 2,
      cta: { label: 'Ver produto', href: '/products/102-microinversor-2kw' },
    },
    {
      id: 'service:201',
      type: 'service',
      service_id: 201,
      name: 'Homologação e Projeto',
      short_description: 'Aprovação rápida na concessionária',
      image_url: null,
      category: { id: 2, name: 'Serviços', slug: 'servicos' },
      position: 3,
      cta: { label: 'Ver serviço', href: '/companies/372/servicos/homologacao-e-projeto' },
    },
  ];

  const mockShowcaseResponse: { data: ShowcaseData } = {
    data: {
      company_id: 372,
      selected_tab: 'all',
      tabs: mockTabs,
      items: mockItems,
      max_items: 5,
      has_more: false,
      total_count: 3,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (api.fetchApi as jest.Mock).mockResolvedValue(mockShowcaseResponse);
  });

  it('renders section title "Produtos e serviços" without star icon', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(
        <CompanyCatalogShowcase companyId={372} companySlug="goodwe-brasil" />
      );
      container = rendered.container;
    });

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Produtos e serviços');

    // Asserts no star SVG inside the heading or title area
    const starIcon = container!.querySelector('h3 svg.lucide-star');
    expect(starIcon).toBeNull();
  });

  it('renders category pills with dynamic counters', async () => {
    await act(async () => {
      render(<CompanyCatalogShowcase companyId={372} companySlug="goodwe-brasil" />);
    });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Todos/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /Todos/i })).toHaveTextContent('3');
    expect(screen.getByRole('tab', { name: /Inversores/i })).toHaveTextContent('2');
    expect(screen.getByRole('tab', { name: /Serviços/i })).toHaveTextContent('1');
  });

  it('renders a single horizontal track with scroll-snap and max 5 items', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(
        <CompanyCatalogShowcase companyId={372} companySlug="goodwe-brasil" />
      );
      container = rendered.container;
    });

    await waitFor(() => {
      expect(screen.getByText('Inversor Híbrido 5kW')).toBeInTheDocument();
    });

    const track = container!.querySelector('[role="tabpanel"]');
    expect(track).toBeInTheDocument();
    expect(track?.className).toContain('snap-x');
    expect(track?.className).toContain('snap-mandatory');
    expect(track?.className).toContain('md:grid-cols-5');

    const cards = container!.querySelectorAll('article');
    expect(cards.length).toBe(3);
    expect(cards.length).toBeLessThanOrEqual(5);
  });

  it('switches tabs without full page reload and calls API with tab parameter', async () => {
    await act(async () => {
      render(<CompanyCatalogShowcase companyId={372} companySlug="goodwe-brasil" />);
    });

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Serviços/i })).toBeInTheDocument();
    });

    const servicosPill = screen.getByRole('tab', { name: /Serviços/i });
    await act(async () => {
      fireEvent.click(servicosPill);
    });

    expect(api.fetchApi).toHaveBeenCalledWith(
      '/companies/372/catalog/showcase',
      expect.objectContaining({
        params: { tab: 'services', limit: 5 },
      })
    );
  });
});

describe('CatalogItemCard', () => {
  const productItem: CatalogItem = {
    id: 'product:101',
    type: 'product',
    product_id: 101,
    name: 'Inversor String 5kW Plus',
    short_description: 'Alta eficiência e garantia estendida',
    image_url: 'https://example.com/inv.jpg',
    category: { id: 1, name: 'Inversores', slug: 'inversores' },
    position: 1,
    cta: { label: 'Ver produto', href: '/products/101-inversor-string-5kw-plus' },
  };

  const serviceItem: CatalogItem = {
    id: 'service:201',
    type: 'service',
    service_id: 201,
    name: 'Instalação e Comissionamento',
    short_description: 'Equipe especializada própria',
    image_url: null,
    category: { id: 2, name: 'Serviços', slug: 'servicos' },
    position: 2,
    cta: { label: 'Ver serviço', href: '/companies/372/servicos/instalacao-comissionamento' },
  };

  it('renders product card with yellow CTA "Ver produto"', () => {
    render(<CatalogItemCard item={productItem} />);

    expect(screen.getByText('Inversor String 5kW Plus')).toBeInTheDocument();
    expect(screen.getByText('Inversores')).toBeInTheDocument();
    expect(screen.getByText('Alta eficiência e garantia estendida')).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: /Ver produto Inversor String 5kW Plus/i });
    expect(cta).toHaveAttribute('href', '/products/101-inversor-string-5kw-plus');
    expect(cta.className).toContain('bg-[#FCD34D]');
  });

  it('renders service card with yellow CTA "Ver serviço"', () => {
    render(<CatalogItemCard item={serviceItem} />);

    expect(screen.getByText('Instalação e Comissionamento')).toBeInTheDocument();
    expect(screen.getByText('Serviços')).toBeInTheDocument();
    expect(screen.getByText('Equipe especializada própria')).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: /Ver serviço Instalação e Comissionamento/i });
    expect(cta).toHaveAttribute('href', '/companies/372/servicos/instalacao-comissionamento');
    expect(cta.className).toContain('bg-[#FCD34D]');
  });
});
