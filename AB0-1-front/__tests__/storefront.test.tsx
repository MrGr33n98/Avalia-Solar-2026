import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StorefrontClient from '@/app/storefront/[slug]/StorefrontClient';

describe('Storefront Component & Structured Data (SPEC 026 / T13-T16)', () => {
  const mockCompany = {
    id: 101,
    name: 'SolarTech Energia',
    slug: 'solartech-energia',
    verified: true,
    logo_url: 'https://example.com/logo.png',
    headquarters: {
      city: 'Florianópolis',
      state: 'SC',
    },
    rating: 4.9,
    review_count: 28,
  };

  const mockSettings = {
    headline: 'Engenharia solar de alta performance para residências e indústrias',
    cta_label: 'Solicitar Orçamento',
    show_calculator: true,
    featured_brands: ['Canadian Solar', 'Growatt'],
    direct_quote_enabled: true,
  };

  const mockProjects = [
    {
      id: 1,
      title: 'Residência Alphaville',
      power_kwp: 8.5,
      city: 'Florianópolis',
      uf: 'SC',
      photo_urls: ['https://example.com/proj1.jpg'],
      completion_year: 2025,
    },
    {
      id: 2,
      title: 'Galpão Comercial Kobrasol',
      power_kwp: 32.0,
      city: 'São José',
      uf: 'SC',
      photo_urls: ['https://example.com/proj2.jpg'],
      completion_year: 2026,
    },
  ];

  const mockProducts = [
    {
      id: 501,
      category: 'Módulos Fotovoltaicos',
      brand: 'Canadian Solar',
      model: 'HiKu7 Mono PERC 660W',
      warranty_years: 25,
    },
    {
      id: 502,
      category: 'Inversores',
      brand: 'Growatt',
      model: 'MIN 5000TL-X',
      warranty_years: 10,
    },
  ];

  it('renders company details, verified status, and headline correctly', () => {
    render(
      <StorefrontClient
        company={mockCompany}
        settings={mockSettings}
        projects={mockProjects}
        curatedProducts={mockProducts}
      />
    );

    expect(screen.getByText('SolarTech Energia')).toBeInTheDocument();
    expect(screen.getByText('Verificada')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(28 avaliações)')).toBeInTheDocument();
    expect(screen.getByText('Florianópolis – SC')).toBeInTheDocument();
    expect(
      screen.getByText(`"${mockSettings.headline}"`)
    ).toBeInTheDocument();
  });

  it('renders curated products in catalog tab by default', () => {
    render(
      <StorefrontClient
        company={mockCompany}
        settings={mockSettings}
        projects={mockProjects}
        curatedProducts={mockProducts}
      />
    );

    expect(screen.getByText('HiKu7 Mono PERC 660W')).toBeInTheDocument();
    expect(screen.getByText('MIN 5000TL-X')).toBeInTheDocument();
    expect(screen.getByText(/Garantia de 25 anos/)).toBeInTheDocument();
  });

  it('switches to projects tab and displays executed installations', () => {
    render(
      <StorefrontClient
        company={mockCompany}
        settings={mockSettings}
        projects={mockProjects}
        curatedProducts={mockProducts}
      />
    );

    const projectsTabButton = screen.getByRole('button', { name: /Projetos Executados/i });
    fireEvent.click(projectsTabButton);

    expect(screen.getByText('Residência Alphaville')).toBeInTheDocument();
    expect(screen.getByText('Galpão Comercial Kobrasol')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
  });

  it('switches to solar calculator tab and calculates savings dynamically', () => {
    render(
      <StorefrontClient
        company={mockCompany}
        settings={mockSettings}
        projects={mockProjects}
        curatedProducts={mockProducts}
      />
    );

    const calcTabButton = screen.getByRole('button', { name: /Simulador Solar/i });
    fireEvent.click(calcTabButton);

    expect(
      screen.getByText('Simule a sua economia com SolarTech Energia')
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/Conta de luz média mensal/i);
    expect(input).toHaveValue(650);

    // Initial estimation with 650
    // 650 / 95 = ~6.8 kWp, savings = 650 * 0.9 = 585
    expect(screen.getByText('~6.8 kWp')).toBeInTheDocument();
    expect(screen.getByText(/585/)).toBeInTheDocument();

    // Change input to 1000
    fireEvent.change(input, { target: { value: '1000' } });
    // 1000 / 95 = ~10.5 kWp, savings = 900
    expect(screen.getByText('~10.5 kWp')).toBeInTheDocument();
    expect(screen.getByText(/900/)).toBeInTheDocument();
  });

  it('generates compliant Schema.org LocalBusiness with AggregateRating', () => {
    const canonicalUrl = 'https://www.avaliasolar.com.br/storefront/solartech-energia';
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': canonicalUrl,
      name: mockCompany.name,
      description: mockSettings.headline,
      image: mockCompany.logo_url,
      url: canonicalUrl,
      address: {
        '@type': 'PostalAddress',
        addressLocality: mockCompany.headquarters.city,
        addressRegion: mockCompany.headquarters.state,
        addressCountry: 'BR',
      },
      ...(mockCompany.review_count > 0 && mockCompany.rating ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: mockCompany.rating,
          reviewCount: mockCompany.review_count,
          bestRating: '5',
          worstRating: '1',
        },
      } : {}),
    };

    expect(jsonLd['@type']).toBe('LocalBusiness');
    expect(jsonLd.name).toBe('SolarTech Energia');
    expect(jsonLd.address.addressCountry).toBe('BR');
    expect(jsonLd.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.9,
      reviewCount: 28,
      bestRating: '5',
      worstRating: '1',
    });
  });
});

